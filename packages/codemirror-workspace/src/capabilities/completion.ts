/// <reference types="codemirror/addon/hint/show-hint" />

import type { Editor, Position, Hint, Hints } from "codemirror";
import type {
  CompletionItem,
  CompletionList,
  CancellationToken,
} from "vscode-languageserver-protocol";
import {
  CompletionItemKind,
  TextEdit,
  InsertTextFormat,
  CancellationTokenSource,
} from "vscode-languageserver-protocol";
import CodeMirror from "codemirror";

import {
  cmRange,
  documentationToString,
  completionItemKindToString,
} from "../utils/conversions";
import { applyEdits } from "../utils/editor";
import { escapeHtml } from "../utils/string";
import { insertSnippet } from "./snippet";

/**
 * Show completion popup.
 * @param opts
 */
export const showCompletion = (opts: CompletionContextOptions) => {
  new CompletionContext(opts).showHint();
};

/**
 * Hide completion popup.
 * @param editor
 */
export const hideCompletion = (editor: Editor) => {
  editor.closeHint();
};

/**
 * True if completion is active.
 * @param editor
 */
export const completionIsActive = (editor: Editor) =>
  !!editor.state?.completionActive;

/**
 * True if completion is active, and the completion list is complete.
 * There's no need to make new requests.
 * @param editor
 */
export const completionIsComplete = (editor: Editor) =>
  !!editor.state?.completionActive?.options?.updateOnCursorActivity;

export type CompletionContextOptions = {
  editor: Editor;
  list: CompletionList;
  invoked: boolean;
  renderMarkdown: (x: string) => string;
  getDetails: (
    item: CompletionItem,
    token?: CancellationToken
  ) => Promise<CompletionItem>;
};

// Manages completion state.
// - Avoid querying the server when the list is complete
// - Cache `completionItem/resolve`
class CompletionContext {
  private editor: Editor;
  private list: CompletionList;
  private updates: number;
  private invoked: boolean;
  private renderMarkdown: (x: string) => string;
  private getDetails: (
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
    getDetails,
  }: CompletionContextOptions) {
    this.editor = editor;
    this.list = list;
    this.invoked = invoked;
    this.updates = 0;
    this.renderMarkdown = renderMarkdown;
    this.getDetails = getDetails;
  }

  showHint() {
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
          let from = posFrom;
          let to = posTo;
          if (item.textEdit) {
            // Need to adjust the content for the typed characters because the
            // range in `textEdit` can be the range when the completion was requested.
            // Replace the range so it matches the original content before completing.
            const edit = item.textEdit;
            const range = cmRange(
              TextEdit.is(edit) ? edit.range : edit.replace
            );
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
      this.pendingRequest = new CancellationTokenSource();
      this.getDetails(item, this.pendingRequest.token).then((x) => {
        this.pendingRequest = null;
        this.removeTooltip();
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
