import type { Editor, TextMarker } from "codemirror";
import type { SymbolKind, Location } from "vscode-languageserver-protocol";
import {
  DocumentSymbol,
  SymbolInformation,
} from "vscode-languageserver-protocol";

import { gotoLocation } from "./goto";
import { cmRange, symbolKindToString } from "../utils/conversions";
import { attachTypeahead } from "../ui/typeahead-input";
import { escapeRegExp } from "../utils/regexp";

type SymbolMenuItem = {
  label: string;
  kind: SymbolKind;
  location: Location;
};

export const showSymbolSelector = (
  editor: Editor,
  uri: string,
  symbols: DocumentSymbol[] | SymbolInformation[]
) => {
  if (symbols.length === 0) return;

  let mark: TextMarker | null = null;
  const items = isDocumentSymbols(symbols)
    ? symbols.flatMap((s) => [
        documentSymbolToItem(s, uri),
        ...(s.children || []).map((c) => documentSymbolToItem(c, uri)),
      ])
    : symbols.map((s) => symbolInfoToItem(s, uri));

  const wrapper = editor.getWrapperElement();
  const dialog = wrapper.appendChild(document.createElement("div"));
  const input = dialog.appendChild(document.createElement("input"));
  dialog.className = "cmw-document-symbols";
  input.className = "cmw-document-symbols-input";

  const disposeTypeahead = attachTypeahead<SymbolMenuItem>(input, {
    className: "cmw-document-symbols-list",
    getSuggestions: async (text) => {
      if (text === "") return items.slice();

      const scores = items.reduce((o, item) => {
        o[item.label] = substringScore(item.label, text);
        return o;
      }, {} as { [k: string]: number });
      return items
        .slice()
        .filter((a) => scores[a.label] > 0)
        .sort((a, b) => scores[b.label] - scores[a.label]);
    },
    render: (item, value) => {
      const div = document.createElement("div");
      // TODO Specify color in CSS once we have proper icons
      const icon = div.appendChild(document.createElement("div"));
      const hue = Math.floor(((item.kind || 0) / 30) * 180 + 180);
      icon.style.color = `hsl(${hue}, 75%, 50%)`;
      icon.className = `cmw-icon cmw-icon--${symbolKindToString(item.kind)}`;
      div.insertAdjacentHTML(
        "beforeend",
        item.label.replace(
          new RegExp("(" + escapeRegExp(value) + ")", "i"),
          `<span class="matched">$1</span>`
        )
      );
      return div;
    },
    onSelect: (item) => {
      close();
      gotoLocation(editor, uri, item.location);
    },
    onUpdate: (item) => {
      if (mark) mark.clear();

      const location = item.location;
      if (location.uri !== uri) return;
      mark = editor.markText(...cmRange(location.range), {
        className: "cmw-highlight",
      });
    },
    onCancel: () => {
      input.blur();
      close();
    },
  });

  let closed = false;
  const close = () => {
    if (closed) return;

    closed = true;
    if (mark) mark.clear();
    disposeTypeahead();
    dialog.remove();
    editor.focus();
  };
  dialog.addEventListener("focusout", (e) => {
    if (e.relatedTarget !== null) close();
  });
  input.focus();
};

const isDocumentSymbols = (symbols: any[]): symbols is DocumentSymbol[] =>
  symbols.every((symbol) => DocumentSymbol.is(symbol));

const symbolInfoToItem = (
  symbol: SymbolInformation,
  uri: string
): SymbolMenuItem => {
  return {
    label: symbol.name,
    kind: symbol.kind,
    // TODO Handle locations in other document
    // symbol.location.uri !== uri
    location: symbol.location,
  };
};

const documentSymbolToItem = (
  symbol: DocumentSymbol,
  uri: string
): SymbolMenuItem => {
  return {
    label: symbol.name,
    kind: symbol.kind,
    location: {
      uri,
      range: symbol.range,
    },
  };
};

// Simple score based on substrings
const substringScore = (item: string, typed: string): number => {
  const itemLower = item.toLowerCase();
  const textLower = typed.toLowerCase();
  const ii = itemLower.includes(textLower) ? 1 : 0;
  const ci = item.includes(typed) ? 1 : 0;
  const is = itemLower.startsWith(textLower) ? 2 : 0;
  const cs = item.startsWith(typed) ? 3 : 0;
  return ii + ci + is + cs;
};
