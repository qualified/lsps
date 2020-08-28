import type { Editor, EditorChange } from "codemirror";
import {
  CompletionTriggerKind,
  SignatureHelpTriggerKind,
  DiagnosticTag,
} from "vscode-languageserver-protocol";

import { createMessageConnection } from "@qualified/vscode-jsonrpc-ws";
import { createLspConnection, LspConnection } from "@qualified/lsp-connection";

import {
  showDiagnostics,
  removeDiagnostics,
  showHoverInfo,
  removeHoverInfo,
  showHighlights,
  removeHighlights,
  showInvokedCompletions,
  showTriggeredCompletions,
  hideCompletions,
  showSignatureHelp,
  removeSignatureHelp,
} from "./capabilities";
import {
  debounceTime,
  filter,
  fromDomEvent,
  fromEditorEvent,
  map,
  piped,
  skipDuplicates,
  Disposer,
  debouncedBuffer,
} from "./utils/event-stream";
import { lspPosition, lspChange } from "./utils/conversions";

export interface WorkspaceOptions {
  /**
   * The URI of the project root.
   */
  rootUri: string;
  /**
   * Provide Language Server endpoint.
   */
  getServerUri: (id: string) => Promise<string>;
  // Called when jumping to different document.
  // showTextDocument?: (uri: string, line?: number, character?: number) => void;
  // Called on showMeessage notification
  // showMessage?: (message: string, level: "error" | "warning" | "info" | "log") => void;
  // Called on logMeessage notification
  // logMessage?: (message: string, level: "error" | "warning" | "info" | "log") => void;
}

// Manages communications with the Language Server.
export class Workspace {
  // Map of `documentUri` to open editors in the workspace.
  // Used to find the editor to apply actions on event.
  private editors: { [uri: string]: Editor };
  // Map of language id to connection.
  private connections: { [id: string]: LspConnection };
  // Map of `documentUri` to document versions.
  private documentVersions: { [uri: string]: number };
  // Array of Disposers to remove event listeners.
  private editorStreamDisposers: WeakMap<Editor, Disposer[]>;
  // Function to get the server uri for language id when needed.
  private getServerUri: (languageId: string) => Promise<string>;
  // The URI of the project root.
  private rootUri: string;

  /**
   * Create new workspace.
   * @param options
   */
  constructor(options: WorkspaceOptions) {
    this.editors = Object.create(null);
    this.connections = Object.create(null);
    this.documentVersions = Object.create(null);
    this.editorStreamDisposers = new WeakMap();
    this.rootUri = options.rootUri;
    this.getServerUri = (id: string) => options.getServerUri(id);
  }

  /**
   * Dispose the workspace.
   * Close connections and remove references to editors.
   */
  dispose() {
    // TODO shutdown and exit all connections
  }

  /**
   * Open text document in the workspace to notify the Language Server and
   * enable code intelligence.
   * @param uri The document URI.
   * @param editor CodeMirror Editor instance.
   */
  async openTextDocument(uri: string, editor: Editor) {
    this.editors[uri] = editor;
    this.documentVersions[uri] = 0;
    const languageId = languageIdFromUri(uri);
    const conn = await this.connect(languageId);
    if (!conn) return;

    conn.textDocumentOpened({
      textDocument: {
        uri,
        languageId,
        text: editor.getValue(),
        version: ++this.documentVersions[uri],
      },
    });

    const disposers: Disposer[] = [];
    const changeStream = piped(
      fromEditorEvent<[Editor, EditorChange[]]>(editor, "changes"),
      debouncedBuffer(50),
      map((buffered) => {
        const cm = buffered[0][0];
        // Send incremental contentChanges
        conn.textDocumentChanged({
          textDocument: {
            uri,
            version: ++this.documentVersions[uri],
          },
          contentChanges: conn.syncsIncrementally
            ? buffered.flatMap(([_, cs]) => cs.map(lspChange))
            : [{ text: cm.getValue() }],
        });

        // Only pass the editor and the last change object.
        const lastChanges = buffered[buffered.length - 1][1];
        return [cm, lastChanges[lastChanges.length - 1]] as const;
      }),
      filter(([cm, change]) => {
        // Text removed
        if (
          change.origin === "+delete" ||
          change.text.every((s) => s.length === 0)
        ) {
          hideCompletions(cm);
          removeSignatureHelp(cm);
          return false;
        }
        return true;
      })
    );
    disposers.push(
      changeStream(([cm, change]) => {
        const pos = cm.getCursor();
        const token = cm.getTokenAt(pos);
        if (token.type && /\b(?:variable|property|type)\b/.test(token.type)) {
          // TODO Show both completion and signature help
          removeSignatureHelp(cm);
          conn
            .getCompletion({
              textDocument: { uri },
              position: lspPosition(pos),
              // Completion triggered by typing an identifier or manual invocation.
              context: { triggerKind: CompletionTriggerKind.Invoked },
            })
            .then((items) => {
              if (!items) return;
              // CompletionList to CompletionItem[]
              if (!Array.isArray(items)) items = items.items;
              showInvokedCompletions(cm, items, [
                { line: pos.line, ch: token.start },
                { line: pos.line, ch: token.end },
              ]);
            });
          return;
        }

        // List of characters to trigger completion other than identifiers.
        const completionTriggers = conn.completionTriggers;
        const triggerCharacter = change.text[change.text.length - 1];
        if (completionTriggers.includes(triggerCharacter)) {
          // TODO Show both completion and signature help
          removeSignatureHelp(cm);
          conn
            .getCompletion({
              textDocument: { uri },
              position: lspPosition(pos),
              // Triggered by a trigger character specified by the `triggerCharacters`.
              context: {
                triggerKind: CompletionTriggerKind.TriggerCharacter,
                triggerCharacter,
              },
            })
            .then((items) => {
              if (!items) return;
              // CompletionList to CompletionItem[]
              if (!Array.isArray(items)) items = items.items;
              showTriggeredCompletions(cm, items, pos);
            });
          return;
        }

        const signatureHelpTriggers = conn.signatureHelpTriggers;
        const signatureHelpRetriggers = conn.signatureHelpRetriggers;
        if (
          signatureHelpTriggers.includes(triggerCharacter) ||
          signatureHelpRetriggers.includes(triggerCharacter)
        ) {
          // TODO Show both completion and signature help
          hideCompletions(cm);
          removeSignatureHelp(cm);
          // const getActiveSignatureHelp = getActiveSignatureHelp(cm);
          conn
            .getSignatureHelp({
              textDocument: { uri },
              position: lspPosition(pos),
              context: {
                triggerKind: SignatureHelpTriggerKind.TriggerCharacter,
                triggerCharacter,
                // TODO Look into this
                isRetrigger: false,
                // activeSignatureHelp,
              },
            })
            .then((help) => {
              if (!help || help.signatures.length === 0) return;
              showSignatureHelp(cm, help, pos);
            });

          return;
        }

        hideCompletions(cm);
        removeSignatureHelp(cm);
      })
    );

    // Highlights identifiers matching thw word under cursor
    const cursorActivityStream = piped(
      fromEditorEvent<[Editor]>(editor, "cursorActivity"),
      debounceTime(100),
      map(([cm]) => [cm, cm.getCursor()] as const),
      filter(([cm, pos]) => {
        const token = cm.getTokenAt(pos);
        if (token.type === "variable" || token.type === "property") {
          return true;
        }
        removeHighlights(cm);
        return false;
      })
    );
    disposers.push(
      cursorActivityStream(([cm, pos]) => {
        conn
          .getDocumentHighlight({
            textDocument: { uri },
            position: lspPosition(pos),
          })
          .then((highlights) => {
            removeHighlights(cm);
            if (highlights) showHighlights(cm, highlights);
          });
      })
    );

    // Show hover information on mouseover
    const mouseoverStream = piped(
      fromDomEvent<MouseEvent>(editor.getWrapperElement(), "mouseover"),
      debounceTime(100),
      map((ev) => editor.coordsChar({ left: ev.clientX, top: ev.clientY })),
      // Ignore same position
      skipDuplicates((p1, p2) => {
        if (p1.line !== p2.line) return false;
        if (p1.ch === p2.ch) return true;

        const t1 = editor.getTokenAt(p1);
        const t2 = editor.getTokenAt(p2);
        return (
          t1.string === t2.string && t1.start === t2.start && t1.end === t2.end
        );
      })
    );
    disposers.push(
      mouseoverStream((pos) => {
        removeHoverInfo(editor);
        const token = editor.getTokenAt(pos);
        if (
          token.type === "comment" ||
          token.string.length === 0 ||
          token.type === null
        ) {
          return;
        }

        conn
          .getHoverInfo({
            textDocument: { uri },
            position: lspPosition(pos),
          })
          .then((hover) => {
            if (hover) {
              removeSignatureHelp(editor);
              showHoverInfo(editor, pos, hover);
            }
          });
      })
    );

    this.editorStreamDisposers.set(editor, disposers);
  }

  /**
   * Close text document in the workspace to notify the Language Server and
   * remove everything added by the workspace.
   * @param uri The document URI.
   */
  async closeTextDocument(uri: string) {
    const editor = this.editors[uri];
    if (!editor) return;

    delete this.editors[uri];
    delete this.documentVersions[uri];
    const languageId = languageIdFromUri(uri);
    const conn = this.connections[languageId];
    if (!conn) return;

    const disposers = this.editorStreamDisposers.get(editor);
    if (disposers) {
      for (const dispose of disposers) dispose();
      disposers.length = 0;
      this.editorStreamDisposers.delete(editor);
    }

    removeDiagnostics(editor);
    removeHoverInfo(editor);
    removeHighlights(editor);
    hideCompletions(editor);
    removeSignatureHelp(editor);

    conn.textDocumentClosed({
      textDocument: { uri },
    });
  }

  /**
   * Private method to connect to the language server if possible.
   * If existing connection exists, it'll be shared.
   *
   * @param languageId
   */
  private async connect(
    languageId: string
  ): Promise<LspConnection | undefined> {
    const existing = this.connections[languageId];
    if (existing) return existing;

    const proxyEndpoint = await this.getServerUri(languageId);
    if (!proxyEndpoint) return;

    // Note that we can support Language Servers in Workers
    // by changing the inner MessageConnection.
    const conn = await createMessageConnection(
      new WebSocket(proxyEndpoint)
    ).then(createLspConnection);
    this.connections[languageId] = conn;
    conn.onClose(() => {
      delete this.connections[languageId];
    });

    conn.listen();

    await conn.initialize({
      capabilities: {
        textDocument: {
          synchronization: {
            dynamicRegistration: true,
            willSave: false,
            didSave: false,
            willSaveWaitUntil: false,
          },
          completion: {
            dynamicRegistration: true,
            completionItem: {
              // TODO Support snippet (completion with placeholders).
              //      Should be possible by providing `hint` method in completion object.
              // Enabling even though we don't support snippet yet because some LS requires this capability
              // to provide completions that uses `textEdit`.
              // Any completion items with `insertTextFormat` of Snippet are currently ignored.
              snippetSupport: true,
              insertReplaceSupport: true,
              // TODO Look into this. Commit character accepts the completion and then get inserted.
              commitCharactersSupport: false,
              // TODO Markdown is currently shown as is. Move "markdown" to first once we fully support it.
              documentationFormat: ["plaintext", "markdown"],
              deprecatedSupport: true,
              preselectSupport: true,
            },
            contextSupport: true,
          },
          hover: {
            dynamicRegistration: true,
            // TODO Markdown is currently shown as is. Move "markdown" to first once we fully support it.
            contentFormat: ["plaintext", "markdown"],
          },
          signatureHelp: {
            dynamicRegistration: true,
            signatureInformation: {
              // TODO Markdown is currently shown as is. Move "markdown" to first once we fully support it.
              documentationFormat: ["plaintext", "markdown"],
              parameterInformation: {
                labelOffsetSupport: true,
              },
              // activeParameterSupport: true,
            },
            contextSupport: true,
          },
          // declaration: {
          //   dynamicRegistration: true,
          //   linkSupport: false,
          // },
          // definition: {
          //   dynamicRegistration: true,
          //   linkSupport: false,
          // },
          // typeDefinition: {
          //   dynamicRegistration: true,
          //   linkSupport: false,
          // },
          // implementation: {
          //   dynamicRegistration: true,
          //   linkSupport: false,
          // },
          // references: {
          //   dynamicRegistration: true,
          // },
          documentHighlight: {
            dynamicRegistration: true,
          },
          // documentSymbol: {
          //   dynamicRegistration: true,
          //   hierarchicalDocumentSymbolSupport: false,
          // },
          // codeAction: {},
          // codeLens: {},
          // documentLink: {
          //   dynamicRegistration: true,
          //   tooltipSupport: false,
          // },
          // colorProvider: {},
          // formatting: {},
          // rangeFormatting: {},
          // onTypeFormatting: {},
          // rename: {},
          // foldingRange: {},
          // selectionRange: {},
          publishDiagnostics: {
            relatedInformation: true,
            tagSupport: {
              valueSet: [DiagnosticTag.Unnecessary, DiagnosticTag.Deprecated],
            },
          },
        },
        workspace: {
          didChangeConfiguration: {
            dynamicRegistration: true,
          },
        },
      },
      // clientInfo: { name: "codemirror-workspace" },
      initializationOptions: null,
      processId: null,
      rootUri: this.rootUri,
      workspaceFolders: null,
    });
    conn.initialized();
    // TODO Allow configuring Language Server
    // conn.configurationChanged({ settings: {} });

    // Add event handlers to pass payload to matching open editors.
    conn.onDiagnostics(({ uri, diagnostics }) => {
      const editor = this.editors[uri];
      if (editor) showDiagnostics(editor, diagnostics);
    });

    return conn;
  }
}

// Renaming file should be done by:
// 1. Close
// 2. Delete
// 3. Create
// 4. Open

// TODO Add option for this. Similar to VSCode's `files.associations`
// https://code.visualstudio.com/docs/languages/overview#_language-id
// We also need a mapping from language id to language server id because some can handle multiple types.
const languageIdFromUri = (uri: string): string => {
  if (uri.endsWith(".ts")) return "typescript";
  if (uri.endsWith(".js")) return "javascript";
  if (uri.endsWith(".css")) return "css";
  if (uri.endsWith(".html")) return "html";
  return "";
};
