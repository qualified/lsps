import type { Editor, TextMarker, Position } from "codemirror";
import type { TextEdit } from "vscode-languageserver-protocol";
import { normalizeKeyMap } from "codemirror";
import {
  SnippetParser,
  TextmateSnippet,
  Placeholder,
  Choice,
  Text,
} from "@qualified/vscode-snippet-parser";

import { groupBy } from "../utils/array";
import { applyEdits } from "../utils/editor";

/**
 * Insert snippet by replacing the range (`from` `to`).
 *
 * @param cm - Editor
 * @param text - Snippet template.
 * @param from - The start of range to replace with the snippet.
 * @param to - The end of range to replace with the snippet.
 * @param edits - Additional edits from completion item.
 */
export const insertSnippet = (
  cm: Editor,
  text: string,
  from: Position,
  to: Position,
  edits?: TextEdit[]
) => {
  // Parse and insert the final tabstop if missing.
  const snippet = new SnippetParser().parse(text, true, true);
  adjustWhitespace(cm, from, snippet);
  // TODO Support some variables and transforms?
  // snippet.resolveVariables();
  // console.log(JSON.stringify(snippet.toTextmateString()));
  // console.log(JSON.stringify(snippet.toString()));
  cm.replaceRange(snippet.toString(), from, to, "complete");

  // Add markers to tabstops so we can keep track of them after insertions.
  const markers = new Map<Placeholder, TextMarker>();
  const offset = cm.indexFromPos(from);
  for (const placeholder of snippet.placeholders) {
    markers.set(
      placeholder,
      cm.markText(...getPlaceholderRange(cm, offset, snippet, placeholder), {
        className: "cmw-snippet-tabstop",
        collapsed: false,
        clearWhenEmpty: false,
        // New text will be part of the marker
        inclusiveLeft: true,
        inclusiveRight: true,
      })
    );
  }

  if (edits) applyEdits(cm, edits, "+complete");
  if (snippet.placeholders.length === 0) return;

  let groupIndex = 0;
  const tabstopGroups = groupBy(
    snippet.placeholders,
    Placeholder.compareByIndex
  );
  // Add some visual marker to the final tabstop unless the cursor jumps there immediately.
  let finalMarker: TextMarker | null = null;
  if (tabstopGroups.length > 1) {
    const widget = document.createElement("span");
    widget.className = "cmw-snippet-final-tabstop";
    const finals = tabstopGroups[tabstopGroups.length - 1];
    const final = finals[finals.length - 1];
    finalMarker = cm.setBookmark(
      cm.posFromIndex(offset + snippet.offset(final) + snippet.fullLen(final)),
      { widget, insertLeft: true }
    );
  }

  // Jump to tabstop index.
  const jumpTo = (index: number) => {
    const placeholders = tabstopGroups[index];
    const placeholder = placeholders[0];
    const isFinal = placeholder.isFinalTabstop;
    const selections = placeholders.map((p) => {
      const { from, to } = markers.get(p)!.find();
      return { anchor: from, head: to };
    });
    // If the group is for final tabstop, we make the last one primary.
    cm.setSelections(selections, isFinal ? selections.length - 1 : 0, {
      scroll: true,
      origin: "snippet",
    });
    // TODO Support Choice. Show completion popup with options.
  };

  // Clicking something exits snippet mode.
  const onMousedown = () => {
    dispose();
  };

  const dispose = () => {
    cm.removeKeyMap(tabstopKeyMap);
    cm.off("mousedown", onMousedown);

    const ps = tabstopGroups[tabstopGroups.length - 1];
    const p = ps[ps.length - 1];
    const m = markers.get(p)!;
    cm.setCursor(m.find().to);
    for (const m of markers.values()) m.clear();
    markers.clear();
    if (finalMarker) finalMarker.clear();
    tabstopGroups.length = 0;
  };

  // Add keymaps to jump to tabstops
  const tabstopKeyMap = normalizeKeyMap({
    Tab: (cm: Editor) => {
      if (groupIndex + 1 <= tabstopGroups.length - 1) {
        jumpTo(++groupIndex);
      }
      if (groupIndex >= tabstopGroups.length - 1) {
        dispose();
      }
    },
    "Shift-Tab": (cm: Editor) => {
      if (groupIndex - 1 >= 0) jumpTo(--groupIndex);
    },
    Enter: (cm: Editor) => {
      dispose();
    },
    Esc: (cm: Editor) => {
      dispose();
    },
  });
  cm.addKeyMap(tabstopKeyMap);
  cm.on("mousedown", onMousedown);
  jumpTo(0);
  // Finish immediately if the snippet only contained single final tabstop.
  if (tabstopGroups.length === 1 && tabstopGroups[0].length === 1) {
    dispose();
  }
};

const getPlaceholderRange = (
  cm: Editor,
  offset: number,
  snippet: TextmateSnippet,
  placeholder: Placeholder
): [Position, Position] => {
  const pOffset = offset + snippet.offset(placeholder);
  return [
    cm.posFromIndex(pOffset),
    cm.posFromIndex(pOffset + snippet.fullLen(placeholder)),
  ];
};

// https://github.com/microsoft/vscode/blob/355fbca8b2b13507b5f8a73189e06f6ac4d694c8/src/vs/editor/contrib/snippet/snippetSession.ts#L336
const adjustWhitespace = (
  cm: Editor,
  pos: Position,
  snippet: TextmateSnippet
) => {
  const lineWhites = getLeadingWhitespace(cm.getLine(pos.line), 0, pos.ch);
  snippet.walk((marker) => {
    // Adjust indentation of text markers, except for choise elements
    // which get adjusted when being selected
    if (marker instanceof Text && !(marker.parent instanceof Choice)) {
      const lines = marker.value.split(/\r?\n|\r/);
      for (let i = 1; i < lines.length; ++i) {
        const originalWhites = getLeadingWhitespace(lines[i]);
        let whites = lineWhites + originalWhites;
        // Replace spaces with Tabs
        if (cm.getOption("indentWithTabs")) {
          const unit = cm.getOption("indentUnit") || 2;
          whites = whites.replace(/\t/g, " ".repeat(unit));
          const tabs = Math.floor(whites.length / unit);
          whites = "\t".repeat(tabs) + " ".repeat(whites.length - tabs * unit);
        }
        lines[i] = whites + lines[i].substr(originalWhites.length);
      }

      const newValue = lines.join(cm.lineSeparator());
      if (newValue !== marker.value) {
        marker.parent.replace(marker, [new Text(newValue)]);
      }
    }
    return true;
  });
};

const getLeadingWhitespace = (
  line: string,
  start: number = 0,
  end: number = line.length
): string => {
  for (let i = start; i < end; ++i) {
    if (line[i] !== " " && line[i] !== "\t") return line.substring(start, i);
  }
  return line.substring(start, end);
};
