import type { Position as CMPosition, EditorChange } from "codemirror";
import type {
  Position,
  Range,
  DiagnosticSeverity,
  DiagnosticTag,
  MarkupContent,
  CompletionItemKind,
  TextDocumentContentChangeEvent,
} from "vscode-languageserver-protocol";

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

export const documentationToString = (doc?: string | MarkupContent) => {
  if (!doc) return "";
  if (typeof doc === "string") return doc;
  // TODO Handle doc.kind === "markdown"
  return doc.value;
};

export const completionItemKindToString = (() => {
  const kinds = [
    "",
    "Text",
    "Method",
    "Function",
    "Constructor",
    "Field",
    "Variable",
    "Class",
    "Interface",
    "Module",
    "Property",
    "Unit",
    "Value",
    "Enum",
    "Keyword",
    "Snippet",
    "Color",
    "File",
    "Reference",
    "Folder",
    "EnumMember",
    "Constant",
    "Struct",
    "Event",
    "Operator",
    "TypeParameter",
  ];

  return (kind?: CompletionItemKind) => kinds[kind ?? 0] || "";
})();
