import type { Position as CMPosition, EditorChange } from "codemirror";
import type {
  Position,
  Range,
  DiagnosticSeverity,
  DiagnosticTag,
  CompletionItem,
  CompletionList,
  CompletionItemKind,
  SymbolKind,
  TextDocumentContentChangeEvent,
} from "vscode-languageserver-protocol";
import { MarkupContent, MarkedString } from "vscode-languageserver-protocol";

import { escapeHtml } from "./string";

export const lspPosition = ({ line, ch }: CMPosition): Position => ({
  line,
  character: ch,
});

export const lspRange = (start: CMPosition, end: CMPosition): Range => ({
  start: lspPosition(start),
  end: lspPosition(end),
});

export const lspChange = (
  change: EditorChange
): TextDocumentContentChangeEvent => ({
  range: lspRange(change.from, change.to),
  text: change.text.join("\n"),
});

export const cmPosition = ({ line, character }: Position): CMPosition => ({
  line,
  ch: character,
});

export const cmRange = ({ start, end }: Range): [CMPosition, CMPosition] => [
  cmPosition(start),
  cmPosition(end),
];

export const diagnosticSeverityName = (
  severity: DiagnosticSeverity
): string => {
  switch (severity) {
    case 1 /* DiagnosticSeverity.Error */:
      return "error";
    case 2 /* DiagnosticSeverity.Warning */:
      return "warning";
    case 3 /* DiagnosticSeverity.Information */:
      return "information";
    case 4 /* DiagnosticSeverity.Hint */:
      return "hint";
  }
};

export const diagnosticTagName = (tag: DiagnosticTag): string => {
  switch (tag) {
    case 1 /* DiagnosticTag.Unnecessary */:
      // Style this with faded text.
      return "unnecessary";
    case 2 /* DiagnosticTag.Deprecated */:
      // Style this with strike through.
      return "deprecated";
  }
};

export const documentationToString = (
  doc?: string | MarkupContent,
  renderMarkdown: (x: string) => string = (x) => x
) => {
  if (!doc) return "";
  if (typeof doc === "string") return escapeHtml(doc);
  return markupContentToString(doc, renderMarkdown);
};

export const hoverContentsToString = (
  contents: MarkupContent | MarkedString | MarkedString[],
  renderMarkdown: (x: string) => string
): string => {
  // Note that MarkedString is considereed deprecated
  // MarkedString[]
  if (Array.isArray(contents)) {
    return contents
      .map((c) => markedStringToString(c, renderMarkdown))
      .join("\n");
  }
  if (MarkedString.is(contents)) {
    return markedStringToString(contents, renderMarkdown);
  }

  return markupContentToString(contents, renderMarkdown);
};

const markupContentToString = (
  content: MarkupContent,
  renderMarkdown: (x: string) => string
): string =>
  content.kind === "markdown"
    ? renderMarkdown(content.value)
    : escapeHtml(content.value);

// Markdown string or code-block with language identifier
const markedStringToString = (
  m: MarkedString,
  render: (x: string) => string
) => {
  if (typeof m === "string") return render(m);

  // To Markdown code block
  return render(["```" + m.language, m.value, "```"].join("\n"));
};

export const completionItemKindToString = (() => {
  const kinds = [
    "",
    "text",
    "method",
    "function",
    "constructor",
    "field",
    "variable",
    "class",
    "interface",
    "module",
    "property",
    "unit",
    "value",
    "enum",
    "keyword",
    "snippet",
    "color",
    "file",
    "reference",
    "folder",
    "enum-member",
    "constant",
    "struct",
    "event",
    "operator",
    "type-parameter",
  ];

  return (kind?: CompletionItemKind) => kinds[kind ?? 0] || "unknown";
})();

export const symbolKindToString = (() => {
  const kinds = [
    "",
    "file",
    "module",
    "namespace",
    "package",
    "class",
    "method",
    "property",
    "field",
    "constructor",
    "enum",
    "interface",
    "function",
    "variable",
    "constant",
    "string",
    "number",
    "boolean",
    "array",
    "object",
    "key",
    "null",
    "enum-member",
    "struct",
    "event",
    "operator",
    "type-parameter",
  ];

  return (kind?: SymbolKind): string => kinds[kind ?? 0] || "unknown";
})();

// > If a `CompletionItem[]` is provided it is interpreted to be complete.
// > So it is the same as `{ isIncomplete: false, items }`
export const completionItemsToList = (
  items: CompletionItem[]
): CompletionList => ({
  items,
  isIncomplete: false,
});
