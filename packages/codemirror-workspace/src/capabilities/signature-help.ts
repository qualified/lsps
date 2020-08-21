import type { Editor, Position } from "codemirror";
import type { SignatureHelp } from "vscode-languageserver-protocol";

import { documentationToString } from "../utils/conversions";
import { addTooltip } from "../utils/tooltip";

const states = new WeakMap<Editor, LspSignatureHelpState>();

interface LspSignatureHelpState {
  tooltip?: HTMLElement;
  // For retriggering
  // activeHelp?: SignatureHelp;
}

// TODO Improve appearance
// TODO Syntax highlight the signature with current mode?
/**
 * Show signature help.
 * @param editor
 * @param help
 * @param pos - Cursor position.
 */
export const showSignatureHelp = (
  editor: Editor,
  help: SignatureHelp,
  pos: Position
) => {
  if (help.activeSignature === null) return;

  const state = states.get(editor) || {};

  const info = help.signatures[help.activeSignature];
  const sig = document.createElement("div");
  const label = document.createElement("div");
  let hasParameterDoc = false;
  // Emphasize active parameter within the signature.
  if (help.activeParameter !== null && info.parameters) {
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

    const paramDoc = documentationToString(paramInfo.documentation);
    if (paramDoc) {
      hasParameterDoc = true;
      const paramDocEl = document.createElement("div");
      paramDocEl.style.marginTop = "4px";
      paramDocEl.innerText = paramDoc;
      sig.appendChild(paramDocEl);
    }
  } else {
    label.innerText = info.label;
    sig.appendChild(label);
  }

  const sigDoc = documentationToString(info.documentation);
  if (sigDoc) {
    const sigDocEl = document.createElement("div");
    if (hasParameterDoc) sigDocEl.style.marginTop = "8px";
    sigDocEl.innerText = sigDoc;
    sig.appendChild(sigDocEl);
  }

  const coords = editor.charCoords(pos, "page");
  state.tooltip = addTooltip(sig, coords.left, coords.top);
  states.set(editor, state);
};

export const removeSignatureHelp = (editor: Editor) => {
  const state = states.get(editor);
  if (!state) return;
  if (state.tooltip) state.tooltip.remove();
  states.delete(editor);
};

const escapeRegExp = (s: string): string =>
  s.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
