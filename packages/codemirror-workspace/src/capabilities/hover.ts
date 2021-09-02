import type { Editor, Position, TextMarker } from "codemirror";
import type { Hover } from "vscode-languageserver-protocol";

import { addTooltip } from "../ui/tooltip";
import { cmRange, hoverContentsToString } from "../utils/conversions";
import { MouseLeaveAllListener } from "../events";

const states = new WeakMap<Editor, LspHoverState>();

interface LspHoverState {
  marker?: TextMarker;
  tooltip?: HTMLElement;
  disabled?: boolean;
  mouseLeaveAllListener?: MouseLeaveAllListener;
}

/**
 * Show hover information.
 * @param editor
 * @param mouseLeaveAllListener
 * @param pos Position of the event
 * @param hover
 * @param renderMarkdown
 */
export const showHoverInfo = (
  editor: Editor,
  mouseLeaveAllListener: MouseLeaveAllListener,
  pos: Position,
  hover: Hover,
  renderMarkdown: (x: string) => string = (x) => x
) => {
  removeHoverInfo(editor);
  if (Array.isArray(hover.contents) && hover.contents.length === 0) return;
  const info = hoverContentsToString(hover.contents, renderMarkdown);
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
  el.innerHTML = info;
  const coords = editor.charCoords(start, "page");
  state.tooltip = addTooltip(el, coords.left, coords.top);
  state.mouseLeaveAllListener = mouseLeaveAllListener;
  mouseLeaveAllListener.addElement(state.tooltip);
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
  if (state.mouseLeaveAllListener && state.tooltip)
    state.mouseLeaveAllListener.removeElement(state.tooltip);
  if (state.tooltip) state.tooltip.remove();
  states.delete(editor);
};

export const hoverInfoEnabled = (editor: Editor) =>
  !states.get(editor)?.disabled;

export const disableHoverInfo = (editor: Editor) => {
  removeHoverInfo(editor);
  states.set(editor, { disabled: true });
};

export const enableHoverInfo = (editor: Editor) => {
  removeHoverInfo(editor);
};
