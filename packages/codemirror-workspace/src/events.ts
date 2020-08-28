import type { Editor, EditorChange } from "codemirror";
import type { Stream } from "./utils/event-stream";

export interface EditorEventMap {
  changes: [cm: Editor, changes: EditorChange[]];
  cursorActivity: [cm: Editor];
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
