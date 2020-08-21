import type { Editor, Position, TextMarker } from "codemirror";
import type { Hover } from "vscode-languageserver-protocol";
import { MarkupContent, MarkedString } from "vscode-languageserver-protocol";

import { addTooltip } from "../utils/tooltip";
import { cmRange } from "../utils/conversions";

const states = new WeakMap<Editor, LspHoverState>();

interface LspHoverState {
  marker?: TextMarker;
  tooltip?: HTMLElement;
}

/**
 * Show hover information.
 * @param editor
 * @param pos Position of the event
 * @param hover
 */
export const showHoverInfo = (editor: Editor, pos: Position, hover: Hover) => {
  removeHoverInfo(editor);
  if (Array.isArray(hover.contents) && hover.contents.length === 0) return;
  const info = hoverContentsToString(hover.contents);
  if (!info) return;

  const state = states.get(editor) || {};
  let start = pos;
  if (hover.range) {
    let end = pos;
    [start, end] = cmRange(hover.range);
    state.marker = editor.markText(start, end, {
      css: "text-decoration: underline",
    });
  }

  const el = document.createElement("div");
  el.innerText = info;
  const coords = editor.charCoords(start, "page");
  state.tooltip = addTooltip(el, coords.left, coords.top);
  states.set(editor, state);
};

/**
 * Remove hover information from the editor.
 * @param editor
 */
export const removeHoverInfo = (editor: Editor) => {
  const state = states.get(editor);
  if (!state) return;

  if (state.marker) state.marker.clear();
  if (state.tooltip) state.tooltip.remove();
  states.delete(editor);
};

const hoverContentsToString = (contents: Hover["contents"]): string => {
  if (MarkupContent.is(contents)) {
    // TODO Handle Markdown (contents.kind == "markdown")
    return contents.value;
  }

  // MarkedString is considereed deprecated
  if (MarkedString.is(contents)) return handleMarkedString(contents);
  // MarkedString[]
  if (Array.isArray(contents)) return handleMarkedString(contents[0]);

  // Shouldn't be possible
  return "";
};

const handleMarkedString = (m: MarkedString) => {
  if (typeof m === "string") return m;
  // Code block with language
  // m.language;
  return m.value;
};
