import type { Editor } from "codemirror";
import { normalizeKeyMap } from "codemirror";
import {
  DiagnosticTag,
  FileEvent,
  SignatureHelpTriggerKind,
  TextDocumentSaveReason,
} from "vscode-languageserver-protocol";

import { createMessageConnection as createWebSocketMessageConnection } from "@qualified/vscode-jsonrpc-ws";
import { createMessageConnection as createWorkerMessageConnection } from "@qualified/vscode-jsonrpc-ww";
import { createLspConnection, LspConnection } from "@qualified/lsp-connection";

import SturdyWebSocket from "./ws";
import {
  CompletionHandler,
  disableHoverInfo,
  enableHoverInfo,
  gotoLocation,
  hoverInfoEnabled,
  removeDiagnostics,
  removeHighlights,
  removeHoverInfo,
  removeSignatureHelp,
  showDiagnostics,
  showHighlights,
  showHoverInfo,
  showSignatureHelp,
  showSymbolSelector,
} from "./capabilities";
import {
  debounce,
  debouncedBuffer,
  Disposer,
  filter,
  fromDomEvent,
  map,
  piped,
  skipDuplicates,
} from "./utils/event-stream";
import {
  fromEditorEvent,
  MouseLeaveAllListener,
  onEditorEvent,
} from "./events";
import { lspChange, lspPosition } from "./utils/conversions";
import { applyEdits } from "./utils/editor";
import { delay } from "./utils/promise";
import { removeContextMenu, showContextMenu } from "./ui/context-menu";

// Changes stream emits at most once per 50ms.
const CHANGES_FRAME = 50;

/**
 * Describes text document's language association.
 */
export interface LanguageAssociation {
  /**
   * Language ID associated with the file.
   */
  languageId: string;
  /**
   * IDs of language servers to connect to.
   * Accepts multiple IDs for future extension, but currently only the first one is used.
   */
  languageServerIds: string[];
}

/** Configs to use for each server. */
export interface LanguageServerConfigs {
  [serverId: string]: LanguageServerConfig | undefined;
}

// TODO? Replace `languageAssociations` with some methods in config?
/**
 * Server's `initializationOptions` and client `settings`.
 */
export interface LanguageServerConfig {
  // TODO? Provide typed values for commonly used servers?
  /** Custom initialization options for the server. */
  initOptions?: any;
  /** Client settings for the server. */
  settings?: any;
}

/**
 * Options for Workspace.
 */
export interface WorkspaceOptions {
  /**
   * The URI of the project root.
   */
  rootUri: string;
  /**
   * Optional configs for Language Servers.
   */
  configs?: LanguageServerConfigs;
  /**
   * Provide Language Server connection string.
   *
   * The returned string can be either:
   *
   * - URI of a WebSocket proxy of a Language Server (`wss?://`)
   * - Path to a script to start Language Server in Web Worker
   *
   * If the returned string does not start with `wss?://`, it's assumed to be a Worker script.
   */
  getConnectionString: (this: void, langserverId: string) => Promise<string>;
  /**
   * Provide language association (language id, language server id) for a file with the uri.
   */
  getLanguageAssociation: (
    this: void,
    uri: string
  ) => LanguageAssociation | null;
  /**
   * Function to render Markdown to HTML string.
   * If not provided and the server's response contains Markdown, it'll be displayed as is.
   */
  renderMarkdown?: (this: void, markdown: string) => string;
  // Called when jumping to different document.
  // showTextDocument?: (uri: string, line?: number, character?: number) => void;
  // Called on showMeessage notification
  // showMessage?: (message: string, level: "error" | "warning" | "info" | "log") => void;
  // Called on logMeessage notification
  // logMessage?: (message: string, level: "error" | "warning" | "info" | "log") => void;

  /**
   * Optional callback called after a WebSocket connection goes down.
   */
  onDisconnected?: (serverId: string) => void;
  /**
   * Optional callback called after a WebSocket connection reopens and initialization completes.
   */
  onReconnected?: (serverId: string) => Promise<void>;
  /**
   * Optional callback called when a connecting to a Language Server failed.
   * WebSocket connection is retried up to 10 consecutive failures with exponential backoff.
   */
  onConnectionFailed?: (serverId: string) => void;
}

/**
 * Workspace provides code intelligence to CodeMirror editors by managing
 * communications with Language Servers and adding event handlers.
 */
export class Workspace {
  // Map of `documentUri` to open editors in the workspace.
  // Used to find the editor to apply actions on event.
  private editors: { [uri: string]: Editor };
  // Map of Language Server ID to a promise that resolves with a connection or null.
  // This is to ensure single connection per server.
  private connectionPromises: { [id: string]: Promise<LspConnection | null> };
  // Map of Language Server ID to connection.
  private connections: { [id: string]: LspConnection };
  // Map of `documentUri` to document versions.
  private documentVersions: { [uri: string]: number };
  // Array of Disposers to remove event listeners.
  private subscriptionDisposers: WeakMap<Editor, Disposer[]>;
  // Function to get the language server's connection string when creating new connection.
  private getConnectionString: (langserverId: string) => Promise<string>;
  // Function to get the language association from the document uri.
  private getLanguageAssociation: (uri: string) => LanguageAssociation | null;
  // Function to get convert Markdown to HTML string.
  private renderMarkdown: (markdown: string) => string;
  private canHandleMarkdown: boolean;
  // The URI of the project root.
  private rootUri: string;
  private configs: LanguageServerConfigs;
  private completionHandlers: WeakMap<Editor, CompletionHandler>;
  private popupsEnabled: boolean;
  private onDisconnected: (id: string) => void;
  private onReconnected: (id: string) => Promise<void>;
  private onConnectionFailed: (id: string) => void;
  // Maps from conn to document uris. Used to find editors using the connection.
  private connectionToUris: WeakMap<LspConnection, Set<string>> = new WeakMap();

  /**
   * Create new workspace.
   * @param options
   */
  constructor(options: WorkspaceOptions) {
    this.editors = Object.create(null);
    this.connectionPromises = Object.create(null);
    this.connections = Object.create(null);
    this.documentVersions = Object.create(null);
    this.subscriptionDisposers = new WeakMap();
    this.completionHandlers = new WeakMap();
    this.configs = options.configs || {};
    this.rootUri =
      options.rootUri + (!options.rootUri.endsWith("/") ? "/" : "");
    this.getConnectionString = options.getConnectionString.bind(void 0);
    this.getLanguageAssociation = options.getLanguageAssociation.bind(void 0);
    this.canHandleMarkdown = typeof options.renderMarkdown === "function";
    const renderMarkdown = options.renderMarkdown || ((x: string) => x);
    this.renderMarkdown = renderMarkdown.bind(void 0);
    this.popupsEnabled = true;
    this.onDisconnected = options.onDisconnected?.bind(void 0) || ((_) => {});
    this.onReconnected =
      options.onReconnected?.bind(void 0) || ((_) => Promise.resolve());
    this.onConnectionFailed =
      options.onConnectionFailed?.bind(void 0) || ((_id) => {});
  }

  enablePopups(enabled = true) {
    this.popupsEnabled = enabled;
    if (!enabled) {
      this.hideAllPopups();
    }
  }

  /**
   * Dispose the workspace.
   * Close connections and remove references to editors.
   */
  dispose() {
    for (const editor of Object.values(this.editors)) {
      this.removeEventHandlers(editor);
    }
    this.editors = Object.create(null);
    this.documentVersions = Object.create(null);
    for (const conn of Object.values(this.connections)) {
      conn.dispose();
      this.connectionToUris.delete(conn);
    }
    this.connections = Object.create(null);
    this.connectionPromises = Object.create(null);
  }

  /**
   * Open text document in the workspace to notify the Language Server and
   * enable code intelligence.
   * @param path - The file path relative to the project root.
   * @param editor - CodeMirror Editor instance.
   */
  async openTextDocument(path: string, editor: Editor) {
    const uri = this.getDocumentUri(path);
    const assoc = this.getLanguageAssociation(uri);
    if (!assoc) return;
    // TODO Allow connecting to multiple language servers
    const serverId = assoc.languageServerIds[0];
    if (!serverId) return;

    const conn = await this.getConnection(serverId);
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

    this.connectionToUris.get(conn)?.add(uri);
    this.addEventHandlers(uri, editor, conn);
  }

  // TODO Clean up. Workspace should signal custom events for providers to react
  private addEventHandlers(uri: string, editor: Editor, conn: LspConnection) {
    const completion = new CompletionHandler({
      uri,
      editor,
      conn,
      renderMarkdown: this.renderMarkdown,
    });
    this.completionHandlers.set(editor, completion);
    const disposers: Disposer[] = [];

    // create a listener to track whether the mouse is over the editor and/or any of it's tooltips
    const mouseLeaveAllListener = new MouseLeaveAllListener(() => {
      this.hideTooltips(editor);
    });
    mouseLeaveAllListener.addElement(editor.getWrapperElement());
    disposers.push(() => {
      mouseLeaveAllListener.dispose();
    });

    const requestCompletion = (cm: Editor) => {
      removeSignatureHelp(cm);
      completion.invoke();
    };

    const changeStream = piped(
      fromEditorEvent(editor, "changes"),
      debouncedBuffer(CHANGES_FRAME),
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
          completion.close();
          removeSignatureHelp(cm);
          return false;
        }

        // Text completed
        if (change.origin === "complete" || change.origin === "+complete") {
          return false;
        }

        return true;
      })
    );
    disposers.push(
      // Trigger completion or signature help or hide them
      changeStream(([cm, _change]) => {
        if (!this.popupsEnabled || completion.onChange()) return;

        const pos = cm.getCursor();
        if (pos.ch === 0) return;
        const triggerCharacter = cm.getLine(pos.line)[pos.ch - 1];
        if (
          conn.signatureHelpTriggers.includes(triggerCharacter) ||
          conn.signatureHelpRetriggers.includes(triggerCharacter)
        ) {
          completion.close();
          removeSignatureHelp(cm);
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
              showSignatureHelp(
                cm,
                mouseLeaveAllListener,
                help,
                pos,
                this.renderMarkdown
              );
            });

          return;
        }

        completion.close();
        removeSignatureHelp(cm);
      })
    );

    // Highlights identifiers matching the word under cursor
    // Note that `cursorActivity` is also emitted when content changes.
    const cursorActivityStream = piped(
      fromEditorEvent(editor, "cursorActivity"),
      debounce(100),
      map(([cm]) => [cm, cm.getCursor()] as const)
    );
    disposers.push(
      cursorActivityStream(([cm, pos]) => {
        const type = this.popupsEnabled && cm.getTokenTypeAt(pos);
        if (type && /\b(?:variable|property)\b/.test(type)) {
          conn
            .getDocumentHighlight({
              textDocument: { uri },
              position: lspPosition(pos),
            })
            .then((highlights) => {
              removeHighlights(cm);
              if (highlights) showHighlights(cm, highlights);
            });
        } else {
          removeHighlights(cm);

          if (pos.ch > 0) {
            const triggerCharacter = cm.getLine(pos.line)[pos.ch - 1];
            if (
              !conn.signatureHelpTriggers.includes(triggerCharacter) &&
              !conn.signatureHelpRetriggers.includes(triggerCharacter)
            ) {
              removeSignatureHelp(cm);
            }
          } else {
            removeSignatureHelp(cm);
          }
        }
      })
    );

    // Show hover information on mouseover
    const mouseoverStream = piped(
      fromDomEvent(editor.getWrapperElement(), "mouseover"),
      filter(() => hoverInfoEnabled(editor)),
      debounce(100),
      map((ev) => editor.coordsChar({ left: ev.pageX, top: ev.pageY }, "page")),
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
          token.type === null ||
          !this.popupsEnabled
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
              showHoverInfo(
                editor,
                mouseLeaveAllListener,
                pos,
                hover,
                this.renderMarkdown
              );
            }
          });
      })
    );

    const hideAllPopups = ([cm]: [Editor, ...any]) => {
      this.hideAllPopups(cm);
    };

    const hideTooltips = ([cm]: [Editor, ...any]) => {
      this.hideTooltips(cm);
    };

    disposers.push(
      onEditorEvent(editor, "cmw:contextMenuOpened", ([cm]) => {
        disableHoverInfo(cm);
        completion.close();
        removeSignatureHelp(cm);
      }),
      onEditorEvent(editor, "cmw:contextMenuClosed", ([cm]) => {
        enableHoverInfo(cm);
      }),

      // if the editor loses focus, or gets completely reset, hide all overlays, because they are no longer valid
      onEditorEvent(editor, "refresh", hideAllPopups),
      // For `blur`, just remove tooltips.
      // ContextMenu should not be closed on `blur` because that happens when you click the menu.
      // Completion is closed on `blur` alreaady with the default `closeOnUnfocus: true` option after 100ms without focus.
      onEditorEvent(editor, "blur", hideTooltips),

      // if we type something, or modify the viewport, hide any tooltips, because they no longer line up correctly
      onEditorEvent(editor, "changes", hideTooltips),
      onEditorEvent(editor, "viewportChange", hideTooltips)
    );

    const gotoDefinition = (cm: Editor, pos = cm.getCursor()) => {
      conn
        .getDefinition({
          textDocument: { uri },
          position: lspPosition(pos),
        })
        .then((location) => {
          if (location) gotoLocation(cm, uri, location);
        });
    };
    const gotoDeclaration = (cm: Editor, pos = cm.getCursor()) => {
      conn
        .getDeclaration({
          textDocument: { uri },
          position: lspPosition(pos),
        })
        .then((location) => {
          if (location) gotoLocation(cm, uri, location);
        });
    };
    const gotoTypeDefinition = (cm: Editor, pos = cm.getCursor()) => {
      conn
        .getTypeDefinition({
          textDocument: { uri },
          position: lspPosition(pos),
        })
        .then((location) => {
          if (location) gotoLocation(cm, uri, location);
        });
    };
    const gotoReferences = (cm: Editor, pos = cm.getCursor()) => {
      conn
        .getReferences({
          textDocument: { uri },
          position: lspPosition(pos),
          context: {
            includeDeclaration: true,
          },
        })
        .then((location) => {
          if (location) gotoLocation(cm, uri, location);
        });
    };
    const gotoImplementations = (cm: Editor, pos = cm.getCursor()) => {
      conn
        .getImplementation({
          textDocument: { uri },
          position: lspPosition(pos),
        })
        .then((location) => {
          if (location) gotoLocation(cm, uri, location);
        });
    };

    disposers.push(
      onEditorEvent(editor, "contextmenu", ([cm, e]) => {
        e.preventDefault();
        const pos = cm.coordsChar({ left: e.pageX, top: e.pageY }, "page");
        // TODO Disable items if the server doesn't support it.
        showContextMenu(cm, e.pageX, e.pageY, [
          [
            {
              label: "Go to Definition",
              handler: () => {
                gotoDefinition(cm, pos);
              },
            },
            {
              label: "Go to Type Definition",
              handler: () => {
                gotoTypeDefinition(cm, pos);
              },
            },
            {
              label: "Go to Implementations",
              handler: () => {
                gotoImplementations(cm, pos);
              },
            },
            {
              label: "Go to References",
              handler: () => {
                gotoReferences(cm, pos);
              },
            },
            {
              label: "Go to Symbol...",
              handler: () => {
                conn
                  .getDocumentSymbol({
                    textDocument: { uri },
                  })
                  .then((symbols) => {
                    if (symbols) showSymbolSelector(cm, uri, symbols);
                  });
              },
            },
          ],
          // TODO Handle Copy and Cut because we won't show the browser's context menu.
          // Paste requires explicit permission.
          [
            {
              label: "Copy",
            },
            {
              label: "Cut",
            },
          ],
        ]);
      })
    );

    // Add some keymaps for jumping to various locations.
    const keyMap = normalizeKeyMap({
      // TODO Make this configurable
      "Ctrl-Space": (cm: Editor) => {
        requestCompletion(cm);
      },
      "Alt-G D": (cm: Editor) => {
        gotoDefinition(cm);
      },
      "Alt-G H": (cm: Editor) => {
        gotoDeclaration(cm);
      },
      "Alt-G T": (cm: Editor) => {
        gotoTypeDefinition(cm);
      },
      "Alt-G I": (cm: Editor) => {
        gotoImplementations(cm);
      },
      "Alt-G R": (cm: Editor) => {
        gotoReferences(cm);
      },
    });
    editor.addKeyMap(keyMap);
    disposers.push(() => {
      editor.removeKeyMap(keyMap);
    });

    this.subscriptionDisposers.set(editor, disposers);
  }

  hideAllPopups(cm?: Editor) {
    if (cm) {
      this.hideTooltips(cm);
      const completion = this.completionHandlers.get(cm);
      if (completion) completion.close();
      removeContextMenu(cm);
    } else {
      Object.values(this.editors).forEach((cm) => this.hideAllPopups(cm));
    }
  }

  hideTooltips(cm?: Editor) {
    if (cm) {
      removeHoverInfo(cm);
      removeSignatureHelp(cm);
    } else {
      Object.values(this.editors).forEach((cm) => this.hideTooltips(cm));
    }
  }

  /**
   * Close text document in the workspace to notify the Language Server and
   * remove everything added by the workspace.
   * @param path - The file path relative to the project root.
   */
  async closeTextDocument(path: string) {
    const uri = this.getDocumentUri(path);
    const assoc = this.getLanguageAssociation(uri);
    if (!assoc) return;
    const serverId = assoc.languageServerIds[0];
    if (!serverId) return;
    const conn = await this.getConnection(serverId);
    if (!conn) return;

    this.detachEditor(uri);
    conn.textDocumentClosed({
      textDocument: { uri },
    });
    this.connectionToUris.get(conn)?.delete(uri);
  }

  private detachEditor(uri: string) {
    const editor = this.editors[uri];
    delete this.editors[uri];
    delete this.documentVersions[uri];
    this.removeEventHandlers(editor);
  }

  /**
   * Notify the Language Server that the text document was saved.
   *
   * If connected to a WebSocket proxy with synchronization enabled,
   * the contents of the file will be written to disk.
   * @param path - The file path relative to the project root.
   */
  async saveTextDocument(path: string) {
    const uri = this.getDocumentUri(path);
    // TODO Support `willSave` with `reason` and `willSaveWaitUntil`
    const assoc = this.getLanguageAssociation(uri);
    if (!assoc) return;

    const serverId = assoc.languageServerIds[0];
    if (!serverId) return;

    const conn = await this.getConnection(serverId);
    if (!conn) return;

    const editor = this.editors[uri];
    if (!editor) return;

    // TODO Find Language Server supporting these to test
    conn.textDocumentWillSave({
      textDocument: { uri },
      reason: TextDocumentSaveReason.Manual,
    });
    const edits = await conn.getEditsBeforeSave({
      textDocument: { uri },
      reason: TextDocumentSaveReason.Manual,
    });
    if (edits) {
      applyEdits(editor, edits, "beforeSave");
      await delay(CHANGES_FRAME * 1.5);
    }
    conn.textDocumentSaved({
      textDocument: { uri },
      text: editor.getValue(),
    });
  }

  /**
   * Send `workspace/didChangeWatchedFiles` notification to all active Language Servers.
   *
   * Note that `FileEvent` must have a valid `uri` starting with `rootUri`.
   * @param changes
   */
  async notifyFilesChanged(changes: FileEvent[]) {
    for (const conn of Object.values(this.connections)) {
      conn.watchedFilesChanged({ changes });
    }
  }

  private getConnection(serverId: string): Promise<LspConnection | null> {
    if (!this.connectionPromises[serverId]) {
      this.connectionPromises[serverId] = (async () => {
        const connectionString = await this.getConnectionString(serverId);
        if (!connectionString) return null;

        this.connections[serverId] = await this.openConnection(
          serverId,
          connectionString,
          async (conn, reopen) => {
            await this.initConnection(conn, this.configs[serverId], reopen);
          }
        );
        return this.connections[serverId];
      })();
    }
    return this.connectionPromises[serverId];
  }

  private removeEventHandlers(editor: Editor) {
    const disposers = this.subscriptionDisposers.get(editor);
    if (disposers) {
      for (const dispose of disposers) dispose();
      disposers.length = 0;
      this.subscriptionDisposers.delete(editor);
    }

    removeDiagnostics(editor);
    removeHoverInfo(editor);
    removeHighlights(editor);
    removeSignatureHelp(editor);

    const completion = this.completionHandlers.get(editor);
    if (completion) {
      completion.close();
      this.completionHandlers.delete(editor);
    }
  }

  private async initConnection(
    conn: LspConnection,
    config: LanguageServerConfig | undefined,
    reopen: boolean
  ): Promise<LspConnection> {
    if (!reopen) conn.listen();
    // Initialize request must be sent on reopen as well
    await conn.initialize({
      capabilities: {
        textDocument: {
          synchronization: {
            dynamicRegistration: true,
            willSave: true,
            willSaveWaitUntil: true,
            didSave: true,
          },
          completion: {
            dynamicRegistration: true,
            completionItem: {
              snippetSupport: true,
              insertReplaceSupport: true,
              // TODO Commit characters cannot be supported with show-hint addon because by the time the
              //      commit character is detected, the Widget is updated and selected item is gone.
              //      Maybe assign it somewhere inside `select` event.
              commitCharactersSupport: false,
              documentationFormat: this.canHandleMarkdown
                ? ["markdown", "plaintext"]
                : ["plaintext"],
              deprecatedSupport: true,
              preselectSupport: true,
              resolveSupport: { properties: ["documentation", "detail"] },
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
          documentSymbol: {
            dynamicRegistration: true,
            hierarchicalDocumentSymbolSupport: true,
          },
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
          moniker: {},
        },
        workspace: {
          didChangeConfiguration: {
            dynamicRegistration: true,
          },
          didChangeWatchedFiles: {
            dynamicRegistration: false,
          },
        },
      },
      // clientInfo: { name: "codemirror-workspace" },
      initializationOptions: config?.initOptions ?? null,
      processId: null,
      rootUri: this.rootUri,
      workspaceFolders: null,
    });
    conn.initialized();

    const settings = config?.settings;
    if (settings) conn.configurationChanged({ settings });

    // Add event handlers to pass payload to matching open editors.
    if (!reopen) {
      conn.onDiagnostics(({ uri, diagnostics }) => {
        const editor = this.editors[uri];
        if (editor) showDiagnostics(editor, diagnostics);
      });
    }

    return conn;
  }

  private getDocumentUri(path: string) {
    return path.startsWith(this.rootUri)
      ? path
      : this.rootUri + path.replace(/^\/+/, "");
  }

  private async openConnection(
    serverId: string,
    connectionString: string,
    initialize: (conn: LspConnection, reopen: boolean) => Promise<void>
  ): Promise<LspConnection> {
    // If we got some string that doesn't start with Web Socket protocol, assume
    // it's the worker's location.
    if (/^wss?:\/\//.test(connectionString)) {
      const ws = new SturdyWebSocket(connectionString, {
        maxReconnectAttempts: 10,
        debug: true,
      });
      const mconn = await createWebSocketMessageConnection(ws);
      const conn = createLspConnection(mconn);
      // Keeps track of open editors attached to this connection
      const toReopen: [uri: string, editor: Editor][] = [];
      let isDown = false;
      await initialize(conn, false);

      this.connectionToUris.set(conn, new Set());
      ws.addEventListener("down", (_closeEvent) => {
        if (isDown) {
          // Failed to reopen connection
          console.debug(`cmw:ws:${serverId} connection is still down`);
        } else {
          isDown = true;
          console.debug(`cmw:ws:${serverId} connection went down`);
          // Remove event handlers for this connection to prevent sending messages while it's down.
          // Store them to reattach when it's back up.
          const uris = this.connectionToUris.get(conn)!;
          for (const uri of uris) {
            const editor = this.editors[uri];
            if (editor) {
              this.detachEditor(uri);
              toReopen.push([uri, editor]);
            }
          }
          uris.clear();
          this.onDisconnected(serverId);
        }
      });
      ws.addEventListener("reopen", () => {
        isDown = false;
        console.debug(`cmw:ws:${serverId} connection reopened, reinitializing`);
        initialize(conn, true).then(async () => {
          await this.onReconnected(serverId);
          // Reopen text documents after initialized to reattach event listeners
          for (const [uri, editor] of toReopen) {
            this.openTextDocument(uri, editor);
          }
          toReopen.length = 0;
        });
      });
      ws.addEventListener("close", (event) => {
        toReopen.length = 0;
        if (event && event.code !== 1000) {
          console.warn(`cmw:ws:${serverId} connection failed`);
          this.onConnectionFailed(serverId);
        }
      });
      return conn;
    } else {
      const mconn = await createWorkerMessageConnection(
        new Worker(connectionString)
      );
      const conn = createLspConnection(mconn);
      await initialize(conn, false);
      return conn;
    }
  }
}
