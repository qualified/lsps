import type { Editor, Position } from "codemirror";
import type { SignatureHelp } from "vscode-languageserver-protocol";

import { documentationToString } from "../utils/conversions";
import { addTooltip } from "../ui/tooltip";
import { escapeRegExp } from "../utils/regexp";
import { MouseLeaveAllListener } from "../events";

const states = new WeakMap<Editor, LspSignatureHelpState>();

interface LspSignatureHelpState {
  tooltip?: HTMLElement;
  mouseLeaveAllListener?: MouseLeaveAllListener;
  // For retriggering
  // activeHelp?: SignatureHelp;
}

// TODO Improve appearance
// TODO Syntax highlight the signature with current mode?
/**
 * Show signature help.
 * @param editor
 * @param mouseLeaveAllListener
 * @param help
 * @param pos - Cursor position.
 * @param renderMarkdown
 */
export const showSignatureHelp = (
  editor: Editor,
  mouseLeaveAllListener: MouseLeaveAllListener,
  help: SignatureHelp,
  pos: Position,
  renderMarkdown: (x: string) => string = (x) => x
) => {
  // `activeSignature` should be `number | null`, but can be `undefined` (JSON is missing the field).
  // If `activeSignature` is not set, show the first one.
  help.activeSignature ??= 0;
  const info = help.signatures[help.activeSignature];
  if (!info) return;

  const state = states.get(editor) || {};

  const sig = document.createElement("div");
  const label = document.createElement("div");
  let hasParameterDoc = false;
  // Emphasize active parameter within the signature.
  if (help.activeParameter != null && info.parameters) {
    // Ensure index is within bounds for variadic parameters.
    const index = Math.min(help.activeParameter, info.parameters.length - 1);
    const paramInfo = info.parameters[index];
    const style = "text-decoration: underline; font-weight: 500;";
    // signatureInformation.parameterInformation.labelOffsetSupport
    if (Array.isArray(paramInfo.label)) {
      const [start, end] = paramInfo.label;
      label.innerHTML = [
        info.label.slice(0, start),
        `<span style="${style}">`,
        info.label.slice(start, end),
        "</span>",
        info.label.slice(end),
      ].join("");
    } else {
      label.innerHTML = info.label.replace(
        new RegExp("(" + escapeRegExp(paramInfo.label) + ")"),
        `<span style="${style}">$1</span>`
      );
    }
    sig.appendChild(label);

    const paramDoc = documentationToString(
      paramInfo.documentation,
      renderMarkdown
    );
    if (paramDoc) {
      hasParameterDoc = true;
      const paramDocEl = document.createElement("div");
      paramDocEl.style.marginTop = "4px";
      paramDocEl.innerHTML = paramDoc;
      sig.appendChild(paramDocEl);
    }
  } else {
    label.innerText = info.label;
    sig.appendChild(label);
  }

  const sigDoc = documentationToString(info.documentation, renderMarkdown);
  if (sigDoc) {
    const sigDocEl = document.createElement("div");
    if (hasParameterDoc) sigDocEl.style.marginTop = "8px";
    sigDocEl.innerHTML = sigDoc;
    sig.appendChild(sigDocEl);
  }

  const coords = editor.charCoords(pos, "page");
  state.tooltip = addTooltip(sig, coords.left, coords.top);
  state.mouseLeaveAllListener = mouseLeaveAllListener;
  mouseLeaveAllListener.addElement(state.tooltip);
  states.set(editor, state);
};

export const removeSignatureHelp = (editor: Editor) => {
  const state = states.get(editor);
  if (!state) return;
  if (state.mouseLeaveAllListener && state.tooltip)
    state.mouseLeaveAllListener.removeElement(state.tooltip);
  if (state.tooltip) state.tooltip.remove();
  states.delete(editor);
};
