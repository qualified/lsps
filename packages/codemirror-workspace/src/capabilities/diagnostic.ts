import type { Editor, TextMarker } from "codemirror";
import type { Diagnostic } from "vscode-languageserver-protocol";

import { cmRange, diagnosticSeverityName } from "../utils/conversions";

const GUTTER_ID = "cm-lsp-gutter";
const states = new WeakMap<Editor, LspDiagnosticsState>();

interface LspDiagnosticsState {
  marks: TextMarker[];
}

/**
 * Show diagnostics on the editor.
 * @param editor
 * @param diagnostics
 */
export const showDiagnostics = (editor: Editor, diagnostics: Diagnostic[]) => {
  removeDiagnostics(editor);
  if (diagnostics.length === 0) return;

  const state = states.get(editor) || { marks: [] };
  for (const d of diagnostics) {
    // TODO Use diagnostic information to style text appropriately
    const [start, end] = cmRange(d.range);
    const severity = diagnosticSeverityName(d.severity || 3);
    // const tags = (d.tags || []).map(t => diagnosticTagName(t));
    // const code = d.code;
    // const source = d.source;
    state.marks.push(
      editor.markText(start, end, {
        title: d.message,
        className: `cm-lsp-mark-${severity}`,
      })
    );

    // TODO Improve appearance
    const el = document.createElement("div");
    el.classList.add(`cm-lsp-guttermark-${severity}`);
    el.style.width = "10px";
    el.style.fontSize = "8px";
    el.style.textAlign = "center";
    el.title = d.message;
    el.innerText = "⬤";
    editor.setGutterMarker(start.line, GUTTER_ID, el);
  }
  states.set(editor, state);
};

/**
 * Remove diagnostics from the editor.
 * @param editor
 */
export const removeDiagnostics = (editor: Editor) => {
  const state = states.get(editor);
  if (!state) return;

  editor.clearGutter(GUTTER_ID);
  for (const mark of state.marks) mark.clear();
  state.marks.length = 0;
  states.delete(editor);
};
