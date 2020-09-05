import type { Editor, EditorChange } from "codemirror";
import type { Stream, Disposer } from "./utils/event-stream";
import { signal as cmSignal } from "codemirror";

export interface EditorEventMap {
  changes: [cm: Editor, changes: EditorChange[]];
  cursorActivity: [cm: Editor];
  contextmenu: [cm: Editor, event: MouseEvent];
  "cmw:contextMenuOpened": [cm: Editor];
  "cmw:contextMenuClosed": [cm: Editor];
}

export interface EditorEventTarget<K extends keyof EditorEventMap> {
  on(type: string, handler: (...args: EditorEventMap[K]) => void): void;
  off(type: string, handler: (...args: EditorEventMap[K]) => void): void;
}

export const fromEditorEvent = <K extends keyof EditorEventMap>(
  target: EditorEventTarget<K>,
  type: K
): Stream<EditorEventMap[K]> => {
  return (cb) => {
    const untupled = (...args: EditorEventMap[K]) => {
      cb(args);
    };
    target.on(type, untupled);
    return () => {
      target.off(type, untupled);
    };
  };
};

export const onEditorEvent = <K extends keyof EditorEventMap>(
  target: EditorEventTarget<K>,
  type: K,
  handler: (args: EditorEventMap[K]) => void
): Disposer => fromEditorEvent(target, type)(handler);

/**
 * Typed wrapper around `CodeMirror.signal`.
 * @param editor - Editor instance
 * @param name - Event name
 * @param args - Event parameters
 */
export const signal = <K extends keyof EditorEventMap>(
  editor: Editor,
  name: K,
  ...args: EditorEventMap[K]
) => {
  cmSignal(editor, name, ...args);
};
