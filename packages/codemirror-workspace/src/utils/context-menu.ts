import type { Editor } from "codemirror";
import { signal } from "../events";

export interface MenuItem {
  label: string;
  handler?: (this: void) => void;
  // TODO Show mapped key
  // TODO Submenu
}

interface ContextMenuState {
  menu?: HTMLElement;
  callback?: (this: void) => void;
}
const states = new WeakMap<Editor, ContextMenuState>();

export const showContextMenu = (
  cm: Editor,
  x: number,
  y: number,
  itemGroups: MenuItem[][]
) => {
  if (states.has(cm)) removeContextMenu(cm);

  const menu = document.createElement("div");
  menu.className = "cmw-context-menu";
  menu.style.cssText = [
    "z-index: 10;",
    "position: absolute;",
    "white-space: nowrap;",
    "transition: opacity 200ms;",
  ].join("");

  for (let i = 0; i < itemGroups.length; ++i) {
    const items = itemGroups[i];
    for (const { label, handler } of items) {
      const menuItem = menu.appendChild(document.createElement("div"));
      menuItem.className = "cmw-context-menu-item";
      menuItem.appendChild(document.createTextNode(label));
      if (!handler) {
        menuItem.setAttribute("disabled", "");
      } else {
        menuItem.addEventListener("click", (e) => {
          e.preventDefault();
          removeContextMenu(cm);
          handler();
        });
      }
    }
    if (i + 1 < itemGroups.length) {
      const sep = menu.appendChild(document.createElement("hr"));
      sep.className = "cmw-context-menu-item-separator";
    }
  }

  menu.style.opacity = "0";
  document.body.appendChild(menu);
  const menuWidth = menu.offsetWidth + 10;
  const menuHeight = menu.offsetHeight + 10;
  menu.style.left = Math.min(x, window.innerWidth - menuWidth) + "px";
  menu.style.top = Math.min(y, window.innerHeight - menuHeight) + "px";
  menu.style.opacity = "1";
  signal(cm, "cmw:contextMenuOpened", cm);

  const onMousedownOutside = (e: MouseEvent) => {
    if (!(e.target instanceof Node) || !menu.contains(e.target)) {
      removeContextMenu(cm);
      document.removeEventListener("mousedown", onMousedownOutside);
    }
  };
  document.addEventListener("mousedown", onMousedownOutside);

  states.set(cm, { menu });
};

export const removeContextMenu = (cm: Editor) => {
  const state = states.get(cm);
  if (!state) return;

  if (state.menu) state.menu.remove();
  states.delete(cm);
  signal(cm, "cmw:contextMenuClosed", cm);
};
