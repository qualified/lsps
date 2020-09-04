import type { Editor } from "codemirror";
import CodeMirror from "codemirror";

type KeyEvent = "keypress" | "keydown" | "keyup";
type KeyInfo = {
  keyCode: number;
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
};

export const fakeKeyInput = (cm: Editor, keyString: string) => {
  const keyInfo = getKeyInfo(keyString);
  if (keyInfo) {
    if (triggerFakeKeyEvent(cm, "keydown", keyInfo)) return;
    if (triggerFakeKeyEvent(cm, "keypress", keyInfo)) return;
  }

  cm.replaceSelection(keyString);

  if (keyInfo) {
    triggerFakeKeyEvent(cm, "keyup", keyInfo);
  }
};

const getKeyInfo = (keyString: string): KeyInfo | null => {
  let altKey = false;
  let ctrlKey = false;
  let shiftKey = false;
  const key = keyString.replace(/(?:Alt|Ctrl|Shift)-/g, (m) => {
    if (m === "Ctrl-") ctrlKey = true;
    else if (m === "Alt-") altKey = true;
    else if (m === "Shift-") shiftKey = true;
    return "";
  });

  // @ts-ignore
  const keyNames: { [k: string]: string } = CodeMirror.keyNames;
  for (const c of Object.keys(keyNames)) {
    if (keyNames[c] === key) {
      return { keyCode: parseInt(c, 10), ctrlKey, shiftKey, altKey };
    }
  }
  return null;
};

const triggerFakeKeyEvent = (cm: Editor, type: KeyEvent, keyInfo: KeyInfo) => {
  const e = fakeKeyEvent(type, keyInfo);
  switch (type) {
    case "keydown":
      // @ts-ignore Undocument method that exists for testing
      cm.triggerOnKeyDown(e);
      break;
    case "keypress":
      // @ts-ignore Undocument method that exists for testing
      cm.triggerOnKeyPress(e);
      break;
    case "keyup":
      // @ts-ignore Undocument method that exists for testing
      cm.triggerOnKeyUp(e);
      break;
  }
  return e._handled;
};

const fakeKeyEvent = (type: KeyEvent, keyInfo: KeyInfo) => {
  return {
    type,
    ...keyInfo,
    preventDefault: function () {
      this._handled = true;
    },
    stopPropagation: function () {},
    _handled: false,
  };
};
