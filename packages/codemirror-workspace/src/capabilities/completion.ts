/// <reference types="codemirror/addon/hint/show-hint" />

import type { Editor, Position, Hint, Hints } from "codemirror";
import type {
  CompletionContext,
  CompletionItem,
  CompletionList,
  CancellationToken,
} from "vscode-languageserver-protocol";
import {
  CancellationTokenSource,
  CompletionItemKind,
  CompletionTriggerKind,
  InsertTextFormat,
  TextEdit,
} from "vscode-languageserver-protocol";
import CodeMirror from "codemirror";

import { LspConnection } from "@qualified/lsp-connection";

import {
  cmRange,
  completionItemKindToString,
  completionItemsToList,
  documentationToString,
  lspPosition,
} from "../utils/conversions";
import { applyEdits } from "../utils/editor";
import { escapeHtml } from "../utils/string";
import { insertSnippet } from "./snippet";

export type CompletionHandlerOptions = {
  uri: string;
  editor: Editor;
  conn: LspConnection;
  renderMarkdown: (x: string) => string;
};

export class CompletionHandler {
  private uri: string;
  private editor: Editor;
  private conn: LspConnection;
  private pendingRequest: CancellationTokenSource | null = null;
  private renderMarkdown: (x: string) => string;

  constructor({ uri, editor, conn, renderMarkdown }: CompletionHandlerOptions) {
    this.uri = uri;
    this.editor = editor;
    this.conn = conn;
    this.renderMarkdown = renderMarkdown;
  }

  invoke() {
    this.request({
      triggerKind: CompletionTriggerKind.Invoked,
    });
  }

  private retriggerForIncomplete() {
    this.request({
      triggerKind: CompletionTriggerKind.TriggerForIncompleteCompletions,
    });
  }

  private triggerWith(triggerCharacter: string) {
    this.request({
      triggerKind: CompletionTriggerKind.TriggerCharacter,
      triggerCharacter,
    });
  }

  /**
   * Attempt to start/resume completion on `change` event.
   *
   * @returns true if handled.
   */
  onChange(): boolean {
    const pos = this.editor.getCursor();
    // Treat as handled
    if (pos.ch === 0) return true;

    const triggerCharacter = this.editor.getLine(pos.line)[pos.ch - 1];
    // Note that this must be checked before ignoring further typing for "complete"
    // completion so a new completion is triggered.
    if (this.conn.completionTriggers.includes(triggerCharacter)) {
      this.triggerWith(triggerCharacter);
      return true;
    }

    if (this.isComplete()) {
      // Do nothing, completion is active with a complete list.
      // The popup is updated on `curorActivity` event.
      // Treat this as handled.
      return true;
    }

    const type = this.editor.getTokenTypeAt(pos);
    if (type) {
      if (/\b(?:variable|property|type)\b/.test(type)) {
        if (this.isActive()) {
          this.retriggerForIncomplete();
        } else {
          this.invoke();
        }
        return true;
      }

      // HTML attribute completion within a string.
      if (this.isActive() && type === "string") {
        this.retriggerForIncomplete();
        return true;
      }
    }

    return false;
  }

  private request(context: CompletionContext) {
    this.cancelPending();

    const cts = new CancellationTokenSource();
    this.pendingRequest = cts;
    this.conn
      .getCompletion(
        {
          textDocument: { uri: this.uri },
          position: lspPosition(this.editor.getCursor()),
          context,
        },
        this.pendingRequest.token
      )
      .then((list) => {
        if (this.pendingRequest === cts) {
          this.pendingRequest = null;
        } else {
          // canceled
          return;
        }

        if (!list) return;
        if (Array.isArray(list)) {
          list = completionItemsToList(list);
        }
        if (list.items.length === 0) return;

        new CompletionHint({
          list,
          editor: this.editor,
          invoked:
            context.triggerKind !== CompletionTriggerKind.TriggerCharacter,
          renderMarkdown: this.renderMarkdown,
          resolveItem: (item, cancel) =>
            this.conn
              .getCompletionItemDetails(item, cancel)
              .then((x) => x || item),
        }).show();
      });
  }

  /**
   * Close completion popup.
   */
  close() {
    this.cancelPending();
    this.editor.closeHint();
  }

  /**
   * True if completion is active.
   */
  private isActive() {
    return !!this.editor.state?.completionActive;
  }

  /**
   * True if completion is active, and the completion list is complete.
   * There's no need to make new requests.
   */
  private isComplete() {
    return !!this.editor.state?.completionActive?.options
      ?.updateOnCursorActivity;
  }

  private cancelPending() {
    if (this.pendingRequest) {
      this.pendingRequest.cancel();
      this.pendingRequest = null;
    }
  }
}

export type CompletionHintOptions = {
  editor: Editor;
  list: CompletionList;
  invoked: boolean;
  renderMarkdown: (x: string) => string;
  resolveItem: (
    item: CompletionItem,
    token?: CancellationToken
  ) => Promise<CompletionItem>;
};

// Manages completion state.
// - Avoid querying the server when the list is complete
// - Cache `completionItem/resolve`
class CompletionHint {
  private editor: Editor;
  private list: CompletionList;
  private updates: number;
  private invoked: boolean;
  private renderMarkdown: (x: string) => string;
  private resolveItem: (
    item: CompletionItem,
    token?: CancellationToken
  ) => Promise<CompletionItem>;
  private tooltip: HTMLElement | null = null;
  private detailsCache: WeakMap<CompletionItem, CachedDetails> = new WeakMap();
  private pendingRequest: CancellationTokenSource | null = null;

  constructor({
    editor,
    invoked,
    list,
    renderMarkdown,
    resolveItem,
  }: CompletionHintOptions) {
    this.editor = editor;
    this.list = list;
    this.invoked = invoked;
    this.updates = 0;
    this.renderMarkdown = renderMarkdown;
    this.resolveItem = resolveItem;
  }

  show() {
    this.editor.showHint({
      completeSingle: false,
      updateOnCursorActivity: !this.list.isIncomplete,
      // Called once at first, then for each `cursorActivity` if the list is complete (no need to requery)
      hint: () => this.update(),
    });
  }

  private update() {
    const { from: posFrom, to: posTo, items } = this.getState();
    const list = items.map((item) => {
      const hint: HintWithItem = {
        // Note that `text` field is only set because @types/codemirror wrongly requires it.
        text: "",
        displayText: item.label,
        // Called when this completion is picked.
        hint: (cm: Editor) => {
          let text = item.insertText || item.label;
          let from = { line: posFrom.line, ch: posFrom.ch };
          let to = { line: posTo.line, ch: posTo.ch };
          if (item.textEdit) {
            // Need to adjust the content for the typed characters because the
            // range in `textEdit` can be the range when the completion was requested.
            // Replace the range so it matches the original content before completing.
            const edit = item.textEdit;
            const range = cmRange(
              TextEdit.is(edit) ? edit.range : edit.replace
            );
            // Adjust the current range based on the item's range to
            // make sure the current range contains the original range.
            // This is necessary when the current range was not accurate due to CM limitation.
            //
            // The item's range can start before the current range when CM token doesn't match
            // with the Language Server's (e.g., HTML closing tag completion containing the slash).
            if (range[0].ch < from.ch) from.ch = range[0].ch;
            // The item's range can end after the current range for completion within string
            // where the end of the current range is the cursor position.
            if (range[1].ch > to.ch) to.ch = range[1].ch;

            this.editor.replaceRange(
              this.editor.getRange(range[0], range[1]),
              from,
              to,
              "complete"
            );
            [from, to] = range;
            text = edit.newText;
          }

          if (item.insertTextFormat === InsertTextFormat.Snippet) {
            // Insert snippet and start snippet mode.
            return insertSnippet(cm, text, from, to, item.additionalTextEdits);
          }

          cm.replaceRange(text, from, to, "+complete");
          if (item.additionalTextEdits) {
            applyEdits(cm, item.additionalTextEdits, "+complete");
          }
          // Scroll to cursor
          cm.scrollIntoView(null);
          cm.closeHint();
        },
        // Function to create item in menu. Called once in `Widget`'s constructor.
        // @ts-ignore: using `HintWithItem` instead of `Hint`
        render: this.renderItem,
        item,
      };
      return hint;
    });
    const hints: Hints = {
      from: posFrom,
      to: posTo,
      list,
    };
    CodeMirror.on(hints, "close", this.onHintsClose);
    CodeMirror.on(hints, "update", this.onHintsUpdate);
    // @ts-ignore: using `HintWithItem` instead of `Hint`
    CodeMirror.on(hints, "select", this.onHintsSelect);
    return hints;
  }

  private getState(): {
    from: Position;
    to: Position;
    items: CompletionItem[];
  } {
    const pos = this.editor.getCursor();
    // Filter by typed text when:
    // - the completion was invoked (typing identifier or manually invoked)
    // - the triggered completion was updated by user typing after the trigger character
    if (this.updates++ > 0 || this.invoked) {
      const token = this.editor.getTokenAt(pos);
      if (token.type === "string") {
        // HACK Try to find the correct range within a string.
        // Completion inside a string is possible in HTML for attributes.
        // Set the start of the range to match the start of a TextEdit.
        // Set the end of the range to the cursor position.
        // The end of the range is adjusted again when completing an item.
        const itemWithTextEdit = this.list.items.find((x) => x.textEdit);
        if (itemWithTextEdit) {
          const edit = itemWithTextEdit.textEdit!;
          const range = cmRange(TextEdit.is(edit) ? edit.range : edit.replace);
          token.start = range[0].ch;
          token.end = pos.ch;
        }
      }

      const posFrom = { line: pos.line, ch: token.start };
      const posTo = { line: pos.line, ch: token.end };
      const typed = this.editor.getRange(posFrom, posTo);
      return {
        from: posFrom,
        to: posTo,
        items: filteredItems(this.list.items, typed, 50),
      };
    } else {
      return {
        from: pos,
        to: pos,
        items: this.list.items,
      };
    }
  }

  private renderItem = (el: HTMLLIElement, _data: Hints, cur: HintWithItem) => {
    const item = cur.item;
    // TODO Use meaningful icons for each kind
    // TODO Show matching characters in different color?
    const hue = Math.floor(((item.kind || 0) / 30) * 180 + 180);
    let color = `hsl(${hue}, 75%, 50%)`;
    // If completing a color, show the color.
    // TODO This is just an example and only handles 6 digit hex.
    if (item.kind === CompletionItemKind.Color) {
      const doc = documentationToString(item.documentation);
      if (doc) {
        const hex = doc.match(/#[\da-f]{6}/i);
        if (hex) color = hex[0];
      }
    }

    const icon = el.appendChild(document.createElement("div"));
    icon.style.color = color;
    icon.className = [
      `cmw-icon`,
      `cmw-icon--${completionItemKindToString(item.kind)}`,
    ].join(" ");
    el.appendChild(document.createTextNode(item.label));
  };

  private onHintsClose = () => {
    this.cancelPending();
    this.removeTooltip();
  };

  private onHintsUpdate = () => {
    this.cancelPending();
    this.removeTooltip();
  };

  // Show details of each completion item on `select`.
  // See https://github.com/codemirror/CodeMirror/blob/6fcc49d5321261b525e50f111f3b28a602f01f71/addon/tern/tern.js#L229
  private onHintsSelect = (selected: HintWithItem, node: HTMLElement) => {
    this.cancelPending();
    this.removeTooltip();

    const item = selected.item;
    const cached = this.detailsCache.get(item);
    if (cached) {
      this.addTooltip(node, cached);
    } else {
      const cts = new CancellationTokenSource();
      this.pendingRequest = cts;
      this.resolveItem(item, this.pendingRequest.token).then((x) => {
        this.removeTooltip();
        if (this.pendingRequest === cts) {
          this.pendingRequest = null;
        } else {
          // canceled
          return;
        }

        const cached = this.cacheDetails(Object.assign(item, x));
        this.detailsCache.set(item, cached);
        this.addTooltip(node, cached);
      });
    }
  };

  private cacheDetails(item: CompletionItem): CachedDetails {
    return {
      kind: item.kind && completionItemKindToString(item.kind),
      detail: item.detail && escapeHtml(item.detail),
      documentation:
        item.documentation &&
        documentationToString(item.documentation, this.renderMarkdown),
    };
  }

  private tooltipContent(cached: CachedDetails): string {
    let content = "";
    if (cached.detail) {
      content += `<code>${cached.detail}</code>`;
    }
    if (cached.documentation) {
      content += `<div>${cached.documentation}</div>`;
    }
    return content;
  }

  private addTooltip(node: HTMLElement, cached: CachedDetails) {
    // Ensure the `node` is in document
    if (!node.isConnected) return;
    const content = this.tooltipContent(cached);
    if (!content) return;

    const menu = node.parentNode! as HTMLElement;
    const x = menu.getBoundingClientRect().right + window.pageXOffset;
    const y = menu.getBoundingClientRect().top + window.pageYOffset;
    const el = document.createElement("div");
    el.innerHTML = content;
    const tooltip = document.createElement("div");
    tooltip.classList.add("cmw-completion-item-doc");
    tooltip.style.cssText = `
    z-index: 10;
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    font-size: 12px;
    padding: 2px;
    max-height: 400px;
    max-width: 400px;
    overflow: auto;
    `;
    tooltip.appendChild(el);
    document.body.appendChild(tooltip);
    this.tooltip = tooltip;
  }

  private removeTooltip() {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  private cancelPending() {
    if (this.pendingRequest) {
      this.pendingRequest.cancel();
      this.pendingRequest = null;
    }
  }
}

interface CachedDetails {
  kind: string | undefined;
  detail: string | undefined;
  documentation: string | undefined;
}

interface HintWithItem extends Hint {
  item: CompletionItem;
}

const filteredItems = (
  items: CompletionItem[],
  typed: string,
  maxItems: number = 30
) => {
  const scores = items.reduce((o, item) => {
    o[item.label] = lcsScore(item.filterText || item.label, typed);
    // Boost the score if preselect
    // if (item.preselect) o[item.label] *= 100;
    return o;
  }, {} as { [k: string]: number });

  return items
    .slice()
    .sort((a, b) => scores[b.label] - scores[a.label])
    .slice(0, maxItems);
};

const PREFIX_BONUS = 0.5;

// Similarity score between strings based on the length of the longest common subsequence.
const lcsScore = (fst: string, snd: string): number => {
  const m = fst.length;
  const n = snd.length;
  const k = Math.min(m, n);
  if (k === 0) return 0;

  // Length of the common prefix to boost with
  let prefix = 0;
  while (fst[prefix] === snd[prefix] && ++prefix < k);

  // Normalize the score based on the input lengths
  const scale = (m + n) / (2 * m * n);
  const llcs =
    k === prefix ? k : m < n ? lcsLength(snd, fst) : lcsLength(fst, snd);
  return scale * llcs ** 2 + prefix * PREFIX_BONUS;
};

// Returns LCS length.
// Uses single array of size min(x.length, y.length) + 1 for look up.
// Assumes x.length >= y.length > 0.
//
// For X = AGCAT, Y = GAC, L changes like the following:
//
//      Ø  G  A  C
//   Ø  0  0  0  0
//   A  0  0 *1  1
//   G  0 *1  1  1
//   C  0  1  1 *2
//   A  0  1 *2  2
//   T  0  1  2  2
//
// where * denotes a match that incremented the value from previous column/row.
const lcsLength = (x: string, y: string): number => {
  const m = x.length;
  const n = y.length;
  const L = [0];
  for (let i = 1; i <= n; ++i) L[i] = 0;
  for (let i = 1; i <= m; ++i) {
    // prev is the value from previous column/row
    for (let j = 1, prev = L[0]; j <= n; ++j) {
      const tmp = L[j];
      L[j] = x[i - 1] === y[j - 1] ? prev + 1 : Math.max(L[j - 1], L[j]);
      prev = tmp;
    }
  }
  return L[n];
};
