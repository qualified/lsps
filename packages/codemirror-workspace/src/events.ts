import type { Editor, EditorChange } from "codemirror";
import { signal as cmSignal } from "codemirror";
import type { Disposer, Stream } from "./utils/event-stream";

export interface EditorEventMap {
  changes: [cm: Editor, changes: EditorChange[]];
  cursorActivity: [cm: Editor];
  contextmenu: [cm: Editor, event: MouseEvent];
  "cmw:contextMenuOpened": [cm: Editor];
  "cmw:contextMenuClosed": [cm: Editor];
  blur: [cm: Editor];
  viewportChange: [cm: Editor, from: number, to: number];
  refresh: [cm: Editor];
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

/**
 * Internal object for tracking individual elements and their event listeners
 */
export interface MouseLeaveAllListenerItem {
  over: boolean;
  element: HTMLElement;
  onEnter: EventListenerOrEventListenerObject;
  onLeave: EventListenerOrEventListenerObject;
}

/**
 * Special class for listening to enter/leave events on a group of elements. When none of those elements are
 * being hovered over, a callback is triggered.
 */
export class MouseLeaveAllListener {
  private listeners: MouseLeaveAllListenerItem[];
  private onMouseLeaveAll: Function;

  /**
   * @param onMouseLeaveAll - Called when none of the tracked elements have a mouse over them.
   */
  constructor(onMouseLeaveAll: Function) {
    this.onMouseLeaveAll = onMouseLeaveAll;
    this.listeners = [];
  }

  /**
   * Adds an element to the list of tracked elements.
   * This element will have mouseenter and mouseleave events tracked.
   * @param element
   */
  addElement(element: HTMLElement) {
    if (this.listeners.find((l) => l.element === element)) return;
    const l = {
      element,
      over: false,
      onEnter: () => {
        l.over = true;
      },
      onLeave: () => {
        l.over = false;
        this.checkHoverState();
      },
    };
    this.listeners.push(l);
    element.addEventListener("mouseenter", l.onEnter);
    element.addEventListener("mouseleave", l.onLeave);
  }

  /**
   * Removes an element from the list of tracked elements.
   * If the element is found, we also remove the event listeners.
   * @param element
   * @return {boolean} - true if the element was found, false otherwise
   */
  removeElement(element: HTMLElement) {
    const idx = this.listeners.findIndex((l) => l.element === element);
    const found = idx !== -1;
    if (found) {
      const l = this.listeners[idx];
      this.listeners.splice(idx, 1);
      l.element.removeEventListener("mouseenter", l.onEnter);
      l.element.removeEventListener("mouseleave", l.onLeave);
      this.checkHoverState();
    }
    return found;
  }

  /**
   * Removes all tracked elements from this class.
   */
  dispose() {
    this.listeners.forEach((l) => {
      this.removeElement(l.element);
    });
  }

  private checkHoverState() {
    window.setTimeout(() => {
      if (this.listeners.every((el) => !el.over)) {
        this.onMouseLeaveAll();
      }
    }, 500);
  }
}
