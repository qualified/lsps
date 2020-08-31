import type { Editor } from "codemirror";
import { normalizeKeyMap } from "codemirror";
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
  gotoLocation,
} from "./capabilities";
import {
  debounce,
  filter,
  fromDomEvent,
  map,
  piped,
  skipDuplicates,
  Disposer,
  debouncedBuffer,
} from "./utils/event-stream";
import { fromEditorEvent } from "./events";
import { lspPosition, lspChange } from "./utils/conversions";

export interface LanguageAssociation {
  /** Language ID associated with the file. */
  languageId: string;
  /**
   * IDs of language servers to connect to.
   * Currently, only the first value is used.
   */
  languageServerIds: string[];
}

export interface WorkspaceOptions {
  /**
   * The URI of the project root.
   */
  rootUri: string;
  /**
   * Provide Language Server endpoint.
   */
  getServerUri: (this: void, langserverId: string) => Promise<string>;
  /**
   * Provide language association (language id, language server id) for a file with the uri.
   */
  getLanguageAssociation: (
    this: void,
    uri: string
  ) => LanguageAssociation | null | undefined;
  // Called when jumping to different document.
  // showTextDocument?: (uri: string, line?: number, character?: number) => void;
  // Called on showMeessage notification
  // showMessage?: (message: string, level: "error" | "warning" | "info" | "log") => void;
  // Called on logMeessage notification
  // logMessage?: (message: string, level: "error" | "warning" | "info" | "log") => void;
  /**
   * Function to render Markdown to HTML string.
   * If not provided and the server's response contains Markdown, it'll be displayed as is.
   */
  renderMarkdown?: (this: void, markdown: string) => string;
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
  // Function to get the language server's uri when creating new connection.
  private getServerUri: (langserverId: string) => Promise<string>;
  // Function to get the language association from the document uri.
  private getLanguageAssociation: (
    uri: string
  ) => LanguageAssociation | null | undefined;
  // Function to get convert Markdown to HTML string.
  private renderMarkdown: (markdown: string) => string;
  private canHandleMarkdown: boolean;
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
    this.getServerUri = options.getServerUri.bind(void 0);
    this.getLanguageAssociation = options.getLanguageAssociation.bind(void 0);
    this.canHandleMarkdown = typeof options.renderMarkdown === "function";
    const renderMarkdown = options.renderMarkdown || ((x: string) => x);
    this.renderMarkdown = renderMarkdown.bind(void 0);
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
    const assoc = this.getLanguageAssociation(uri);
    if (!assoc) return;
    // TODO Allow connecting to multiple language servers
    const serverId = assoc.languageServerIds[0];
    if (!serverId) return;
    const conn = await this.connect(serverId);
    if (!conn) return;

    this.editors[uri] = editor;
    this.documentVersions[uri] = 0;
    const languageId = assoc.languageId;
    conn.textDocumentOpened({
      textDocument: {
        uri,
        languageId,
        text: editor.getValue(),
        version: ++this.documentVersions[uri],
      },
    });

    this.addEventHandlers(uri, editor, conn);
  }

  // TODO Clean up. Workspace should signal custom events for providers to react
  private addEventHandlers(uri: string, editor: Editor, conn: LspConnection) {
    const disposers: Disposer[] = [];
    const changeStream = piped(
      fromEditorEvent(editor, "changes"),
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
          // TODO Make minimum characters configurable
          // if (token.string.length < 3) return;
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
              showInvokedCompletions(
                cm,
                items,
                [
                  { line: pos.line, ch: token.start },
                  { line: pos.line, ch: token.end },
                ],
                this.renderMarkdown
              );
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
              showTriggeredCompletions(cm, items, pos, this.renderMarkdown);
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
              showSignatureHelp(cm, help, pos, this.renderMarkdown);
            });

          return;
        }

        hideCompletions(cm);
        removeSignatureHelp(cm);
      })
    );

    // Highlights identifiers matching the word under cursor
    const cursorActivityStream = piped(
      fromEditorEvent(editor, "cursorActivity"),
      debounce(100),
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
      fromDomEvent(editor.getWrapperElement(), "mouseover"),
      debounce(100),
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
              showHoverInfo(editor, pos, hover, this.renderMarkdown);
            }
          });
      })
    );

    // Add some keymaps for jumping to various locations.
    // TODO Show a menu when right clicked on symbol
    const keyMap = normalizeKeyMap({
      // TODO Make this configurable
      // Go to Definition
      "Alt-G D": (cm: Editor) => {
        conn
          .getDefinition({
            textDocument: { uri },
            position: lspPosition(cm.getCursor()),
          })
          .then((location) => {
            if (location) gotoLocation(cm, uri, location);
          });
      },
      // Go to Declaration
      "Alt-G H": (cm: Editor) => {
        conn
          .getDeclaration({
            textDocument: { uri },
            position: lspPosition(cm.getCursor()),
          })
          .then((location) => {
            if (location) gotoLocation(cm, uri, location);
          });
      },
      // Go to TypeDefinition
      "Alt-G T": (cm: Editor) => {
        conn
          .getTypeDefinition({
            textDocument: { uri },
            position: lspPosition(cm.getCursor()),
          })
          .then((location) => {
            if (location) gotoLocation(cm, uri, location);
          });
      },
      // Go to Implementations
      "Alt-G I": (cm: Editor) => {
        conn
          .getImplementation({
            textDocument: { uri },
            position: lspPosition(cm.getCursor()),
          })
          .then((location) => {
            if (location) gotoLocation(cm, uri, location);
          });
      },
      // Go to References
      "Alt-G R": (cm: Editor) => {
        conn
          .getReferences({
            textDocument: { uri },
            position: lspPosition(cm.getCursor()),
            context: {
              includeDeclaration: true,
            },
          })
          .then((location) => {
            if (location) gotoLocation(cm, uri, location);
          });
      },
    });
    editor.addKeyMap(keyMap);
    disposers.push(() => {
      editor.removeKeyMap(keyMap);
    });

    this.editorStreamDisposers.set(editor, disposers);
  }

  /**
   * Close text document in the workspace to notify the Language Server and
   * remove everything added by the workspace.
   * @param uri The document URI.
   */
  async closeTextDocument(uri: string) {
    const assoc = this.getLanguageAssociation(uri);
    if (!assoc) return;
    const serverId = assoc.languageServerIds[0];
    if (!serverId) return;
    const conn = this.connections[serverId];
    if (!conn) return;

    const editor = this.editors[uri];
    delete this.editors[uri];
    delete this.documentVersions[uri];
    this.removeEventHandlers(editor);
    conn.textDocumentClosed({
      textDocument: { uri },
    });
  }

  private removeEventHandlers(editor: Editor) {
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
  }

  /**
   * Private method to connect to the language server if possible.
   * If existing connection exists, it'll be shared.
   *
   * @param serverId - ID of the language server.
   */
  private async connect(serverId: string): Promise<LspConnection | undefined> {
    const existing = this.connections[serverId];
    if (existing) return existing;

    const proxyEndpoint = await this.getServerUri(serverId);
    if (!proxyEndpoint) return;

    // Note that we can support Language Servers in Workers
    // by changing the inner MessageConnection.
    const conn = await createMessageConnection(
      new WebSocket(proxyEndpoint)
    ).then(createLspConnection);
    this.connections[serverId] = conn;
    conn.onClose(() => {
      delete this.connections[serverId];
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
              documentationFormat: this.canHandleMarkdown
                ? ["markdown", "plaintext"]
                : ["plaintext"],
              deprecatedSupport: true,
              preselectSupport: true,
            },
            contextSupport: true,
          },
          hover: {
            dynamicRegistration: true,
            contentFormat: this.canHandleMarkdown
              ? ["markdown", "plaintext"]
              : ["plaintext"],
          },
          signatureHelp: {
            dynamicRegistration: true,
            signatureInformation: {
              documentationFormat: this.canHandleMarkdown
                ? ["markdown", "plaintext"]
                : ["plaintext"],
              parameterInformation: {
                labelOffsetSupport: true,
              },
              // activeParameterSupport: true,
            },
            contextSupport: true,
          },
          declaration: {
            dynamicRegistration: true,
            linkSupport: false,
          },
          definition: {
            dynamicRegistration: true,
            linkSupport: true,
          },
          typeDefinition: {
            dynamicRegistration: true,
            linkSupport: true,
          },
          implementation: {
            dynamicRegistration: true,
            linkSupport: true,
          },
          references: {
            dynamicRegistration: true,
          },
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
