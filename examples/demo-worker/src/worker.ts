// Simple JSON LS in Web Worker that provides completion and hover.
// Includes a schema for `tsconfig.json`.
import {
  createProtocolConnection,
  BrowserMessageReader,
  BrowserMessageWriter,
} from "vscode-languageserver-protocol/browser";
import {
  CompletionRequest,
  DidChangeTextDocumentNotification,
  DidOpenTextDocumentNotification,
  HoverRequest,
  InitializeRequest,
  InitializeResult,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol";
import { getLanguageService, TextDocument } from "vscode-json-languageservice";

const jsonService = getLanguageService({
  async schemaRequestService(url: string) {
    const res = await fetch(url);
    return res.text();
  },
});
jsonService.configure({
  schemas: [
    {
      // "name": "tsconfig.json",
      // description: "TypeScript compiler configuration file",
      uri: "https://json.schemastore.org/tsconfig",
      fileMatch: ["tsconfig.json"],
    },
  ],
});

const docs: { [uri: string]: TextDocument } = {};

const worker: Worker = self as any;
const conn = createProtocolConnection(
  new BrowserMessageReader(worker),
  new BrowserMessageWriter(worker)
);
conn.onRequest(
  InitializeRequest.type,
  (params): InitializeResult => {
    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        completionProvider: {
          triggerCharacters: ['"', ":"],
        },
        hoverProvider: true,
      },
    };
  }
);
conn.onNotification(
  DidOpenTextDocumentNotification.type,
  ({ textDocument: { uri, languageId, version, text } }) => {
    docs[uri] = TextDocument.create(uri, languageId, version, text);
  }
);
conn.onNotification(
  DidChangeTextDocumentNotification.type,
  ({ textDocument, contentChanges }) => {
    const doc = docs[textDocument.uri];
    if (doc) {
      docs[textDocument.uri] = TextDocument.update(
        doc,
        contentChanges,
        textDocument.version || 0
      );
    }
  }
);
conn.onRequest(CompletionRequest.type, async ({ textDocument, position }) => {
  const doc = docs[textDocument.uri];
  if (!doc) return null;

  return jsonService.doComplete(
    doc,
    position,
    jsonService.parseJSONDocument(doc)
  );
});
conn.onRequest(HoverRequest.type, async ({ textDocument, position }) => {
  const doc = docs[textDocument.uri];
  if (!doc) return null;

  return jsonService.doHover(doc, position, jsonService.parseJSONDocument(doc));
});
conn.listen();
