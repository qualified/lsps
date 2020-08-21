import type { Editor, TextMarker } from "codemirror";
import type { DocumentHighlight } from "vscode-languageserver-protocol";

import { cmRange } from "../utils/conversions";

const states = new WeakMap<Editor, LspDocumentHighlightState>();

interface LspDocumentHighlightState {
  marks: TextMarker[];
}

/**
 * Show document highlights in the editor.
 * @param editor
 * @param highlights
 */
export const showHighlights = (
  editor: Editor,
  highlights: DocumentHighlight[]
) => {
  const state = states.get(editor) || { marks: [] };
  for (const { kind, range } of highlights) {
    // TODO Use kind to style differently
    const [start, end] = cmRange(range);
    state.marks.push(
      editor.markText(start, end, {
        className: `cm-lsp-highlight`,
      })
    );
  }
  states.set(editor, state);
};

/**
 * Remove document highlights from the editor.
 * @param editor
 */
export const removeHighlights = (editor: Editor) => {
  const state = states.get(editor);
  if (!state) return;

  if (state.marks && state.marks.length > 0) {
    for (const mark of state.marks) mark.clear();
    state.marks.length = 0;
  }
  states.delete(editor);
};
