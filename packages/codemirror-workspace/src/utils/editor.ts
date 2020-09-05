import type { Editor, TextMarker, Position } from "codemirror";
import type { TextEdit } from "vscode-languageserver-protocol";

import { cmRange } from "./conversions";

/**
 * Apply text edits preserving cursor location.
 * @param cm - Editor
 * @param edits - Array of text edit to apply.
 * @param origin - Optional origin string to use.
 */
export const applyEdits = (cm: Editor, edits: TextEdit[], origin?: string) => {
  const pos = cm.getCursor();
  const current = cm.markText(pos, pos, { clearWhenEmpty: false });
  const marks = edits.map((e) =>
    cm.markText(...cmRange(e.range), { clearWhenEmpty: false })
  );
  cm.operation(() => {
    for (let i = 0; i < edits.length; ++i) {
      const mark = marks[i];
      const range = mark.find();
      cm.replaceRange(edits[i].newText, range.from, range.to, origin);
      mark.clear();
    }
  });
  cm.setCursor(current.find().to);
  current.clear();
};

/**
 * Highlight range of text.
 * @param cm - Editor to operate on.
 * @param from - Start of the range to highlight
 * @param to - End of the range to highlight
 * @param duration - Clear after duration if given.
 */
export const highlightRange = (
  cm: Editor,
  from: Position,
  to: Position,
  duration: number = 0
): TextMarker => {
  const mark = cm.markText(from, to, { className: "cmw-highlight" });
  if (typeof duration === "number" && duration > 0) {
    setTimeout(() => {
      mark.clear();
    }, duration);
  }
  return mark;
};
