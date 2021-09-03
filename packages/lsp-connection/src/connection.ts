import type {
  Message,
  MessageConnection,
  NotificationHandler,
  CancellationToken,
} from "vscode-jsonrpc";
import type {
  InitializeParams,
  ProtocolNotificationType,
  ProtocolRequestType,
  ServerCapabilities,
} from "vscode-languageserver-protocol";

import {
  CodeActionRequest,
  CodeLensRequest,
  CodeLensResolveRequest,
  CompletionRequest,
  CompletionResolveRequest,
  DeclarationRequest,
  DefinitionRequest,
  DidChangeConfigurationNotification,
  DidChangeTextDocumentNotification,
  DidChangeWatchedFilesNotification,
  DidCloseTextDocumentNotification,
  DidOpenTextDocumentNotification,
  DidSaveTextDocumentNotification,
  DocumentColorRequest,
  DocumentHighlightRequest,
  DocumentLinkRequest,
  DocumentLinkResolveRequest,
  DocumentSymbolRequest,
  ExitNotification,
  FoldingRangeRequest,
  HoverRequest,
  ImplementationRequest,
  InitializeRequest,
  InitializedNotification,
  LogMessageNotification,
  PublishDiagnosticsNotification,
  ReferencesRequest,
  RegistrationRequest,
  SelectionRangeRequest,
  ShowMessageNotification,
  ShutdownRequest,
  SignatureHelpRequest,
  TextDocumentSyncKind,
  TypeDefinitionRequest,
  UnregistrationRequest,
  WillSaveTextDocumentNotification,
  WillSaveTextDocumentWaitUntilRequest,
  WorkspaceSymbolRequest,
} from "vscode-languageserver-protocol";

export type LspConnection = ReturnType<typeof createLspConnection>;

/**
 * Wrap JSON RPC `MessageConnection` to provide typed methods for LSP.
 * @param conn
 */
export const createLspConnection = (conn: MessageConnection) => {
  let capabilities: ServerCapabilities;
  // Handle dynamic registrations
  conn.onRequest(RegistrationRequest.type, ({ registrations }) => {
    for (const { method, registerOptions } of registrations) {
      const provider = METHOD_TO_PROVIDER[method];
      if (provider) capabilities[provider] = registerOptions ?? true;
    }
  });
  conn.onRequest(UnregistrationRequest.type, ({ unregisterations }) => {
    for (const { method } of unregisterations) {
      const provider = METHOD_TO_PROVIDER[method];
      if (provider) capabilities[provider] = undefined;
    }
  });

  const maybeReq = <T extends ProtocolRequestType<any, any, any, any, any>>(
    cond: () => boolean,
    type: T
  ) => (
    params: Params<T>,
    token?: CancellationToken
  ): Promise<Result<T> | null> =>
    cond() ? conn.sendRequest(type, params, token) : Promise.resolve(null);

  const maybeNotify = <T extends ProtocolNotificationType<any, any>>(
    cond: () => boolean,
    type: T
  ) => (params: Params<T>): void =>
    cond() ? conn.sendNotification(type, params) : undefined;

  const notifier = <T extends ProtocolNotificationType<any, any>>(type: T) => (
    params: Params<T>
  ): void => conn.sendNotification(type, params);

  const onNotification = <T extends ProtocolNotificationType<any, any>>(
    type: T
  ) => (handler: NotificationHandler<Params<T>>): void => {
    conn.onNotification(type, handler);
  };

  const hasTextDocumentWillSave = () => {
    const c = capabilities.textDocumentSync ?? TextDocumentSyncKind.None;
    return typeof c !== "number" && !!c.willSave;
  };
  const hasTextDocumentWillSaveWaitUntil = () => {
    const c = capabilities.textDocumentSync ?? TextDocumentSyncKind.None;
    return typeof c !== "number" && !!c.willSaveWaitUntil;
  };
  const hasTextDocumentDidSave = () => {
    const c = capabilities.textDocumentSync ?? TextDocumentSyncKind.None;
    return typeof c === "number" ? c !== TextDocumentSyncKind.None : !!c.save;
  };

  return {
    /** Start listening. */
    listen: () => conn.listen(),
    /** Dispose connection. */
    dispose: () => conn.dispose(),

    /**
     * Send initialize request with params and store the server capability.
     */
    initialize: async (params: InitializeParams) => {
      const result = await conn.sendRequest(InitializeRequest.type, params);
      capabilities = result.capabilities;
      // console.log(result.serverInfo);
      // console.log(JSON.stringify(capabilities, null, 2));
      return result;
    },

    /** Notify that the client initialized. */
    initialized: () =>
      // Need to send empty object literal to prevent ParameterStructures error.
      conn.sendNotification(InitializedNotification.type, {}),
    /** Send shutdown request. */
    shutdown: () => conn.sendRequest(ShutdownRequest.type),
    /** Notify exit. */
    exit: () => conn.sendNotification(ExitNotification.type),

    /** Register an error handler. */
    onError: (handler: (err: Error, msg?: Message, code?: number) => void) =>
      conn.onError(([err, msg, code]) => handler(err, msg, code)),
    /** Register a close handler. */
    onClose: (handler: () => void) => conn.onClose(() => handler()),

    /** Register a handler for logMessage notification. */
    onLogMessage: onNotification(LogMessageNotification.type),
    /**
     * Register a handler for showMessage notification.
     * The handler should display the message in the user interface.
     */
    onShowMessage: onNotification(ShowMessageNotification.type),
    /** Register a handler for diagnostics notification. */
    onDiagnostics: onNotification(PublishDiagnosticsNotification.type),

    /**
     * Notify newly opened text document.
     *
     * "open" means the document's truth is now managed by the client and
     * the server must not try to read the document's truth using the document's
     * uri. It doesn't necessarily mean it's presented in an editor.
     *
     * The notification must not be sent more than once without a corresponding
     * close notification sent before.
     */
    textDocumentOpened: notifier(DidOpenTextDocumentNotification.type),
    /**
     * Notify the text document got closed.
     *
     * The document's truth now exists where the document's uri points to
     * and the server is allowed to read it using the document's uri.
     *
     * Requires that the text document is "open".
     */
    textDocumentClosed: notifier(DidCloseTextDocumentNotification.type),
    /**
     * Notify changes to a text document.
     */
    textDocumentChanged: notifier(DidChangeTextDocumentNotification.type),
    /**
     * Notify that the text document will be saved.
     */
    textDocumentWillSave: maybeNotify(
      hasTextDocumentWillSave,
      WillSaveTextDocumentNotification.type
    ),
    /**
     * Get text edits to apply before saving.
     */
    getEditsBeforeSave: maybeReq(
      hasTextDocumentWillSaveWaitUntil,
      WillSaveTextDocumentWaitUntilRequest.type
    ),
    /**
     * Notify that the text document got saved in the client.
     */
    textDocumentSaved: maybeNotify(
      hasTextDocumentDidSave,
      DidSaveTextDocumentNotification.type
    ),
    /**
     * Notify that the client's configuration changed.
     */
    configurationChanged: notifier(DidChangeConfigurationNotification.type),
    /**
     * Notify that the client detected changes to files.
     */
    watchedFilesChanged: notifier(DidChangeWatchedFilesNotification.type),

    /** If supported, request completion at a given text document position. */
    getCompletion: maybeReq(
      () => !!capabilities.completionProvider,
      CompletionRequest.type
    ),
    /** If supported, resolve additional information for a given completion item. */
    getCompletionItemDetails: maybeReq(
      () => !!capabilities.completionProvider?.resolveProvider,
      CompletionResolveRequest.type
    ),
    /** If supported, request hover information at a given text document position. */
    getHoverInfo: maybeReq(
      () => !!capabilities.hoverProvider,
      HoverRequest.type
    ),
    /** If supported, request signature information at a given text document position. */
    getSignatureHelp: maybeReq(
      () => !!capabilities.signatureHelpProvider,
      SignatureHelpRequest.type
    ),
    /** If supported, resolve the type definition locations of a symbol at a given text document position. */
    getDeclaration: maybeReq(
      () => !!capabilities.declarationProvider,
      DeclarationRequest.type
    ),
    /** If supported, resolve the definition location of a symbol at a given text document position. */
    getDefinition: maybeReq(
      () => !!capabilities.definitionProvider,
      DefinitionRequest.type
    ),
    /** If supported, resolve the type definition locations of a symbol at a given text document position. */
    getTypeDefinition: maybeReq(
      () => !!capabilities.typeDefinitionProvider,
      TypeDefinitionRequest.type
    ),
    /** If supported, resolve the implementation locations of a symbol at a given text document position. */
    getImplementation: maybeReq(
      () => !!capabilities.implementationProvider,
      ImplementationRequest.type
    ),
    /** If supported, resolve project-wide references for the symbol denoted by the given text document position. */
    getReferences: maybeReq(
      () => !!capabilities.referencesProvider,
      ReferencesRequest.type
    ),
    /** If supported, resolve a DocumentHighlight for a given text document position. */
    getDocumentHighlight: maybeReq(
      () => !!capabilities.documentHighlightProvider,
      DocumentHighlightRequest.type
    ),
    /** If supported, list all symbols found in a given text document. */
    getDocumentSymbol: maybeReq(
      () => !!capabilities.documentSymbolProvider,
      DocumentSymbolRequest.type
    ),
    /** If supported, get commands for the given text document and range. */
    getCodeAction: maybeReq(
      () => !!capabilities.codeActionProvider,
      CodeActionRequest.type
    ),
    /** If supported, get code lens for the given text document. */
    getCodeLens: maybeReq(
      () => !!capabilities.codeLensProvider,
      CodeLensRequest.type
    ),
    /** If supported, resolve a command for a given code lens. */
    resolveCodeLens: maybeReq(
      () => !!capabilities.codeLensProvider?.resolveProvider,
      CodeLensResolveRequest.type
    ),
    /** If supported, get document links. */
    getDocumentLink: maybeReq(
      () => !!capabilities.documentLinkProvider,
      DocumentLinkRequest.type
    ),
    /** If supported, resolve additional information for a given document link. */
    resolveDocumentLink: maybeReq(
      () => !!capabilities.documentLinkProvider?.resolveProvider,
      DocumentLinkResolveRequest.type
    ),
    /** If supported, list all color symbols found in a given text document. */
    getColorSymbols: maybeReq(
      () => !!capabilities.colorProvider,
      DocumentColorRequest.type
    ),
    /** If supported, get folding ranges in a document. */
    getFoldingRanges: maybeReq(
      () => !!capabilities.foldingRangeProvider,
      FoldingRangeRequest.type
    ),
    /** If supported, get selection ranges in a document. */
    getSelectionRanges: maybeReq(
      () => !!capabilities.selectionRangeProvider,
      SelectionRangeRequest.type
    ),
    /** If supported, list project-wide symbols matching the query string in params. */
    getWorkspaceSymbols: maybeReq(
      () => !!capabilities.workspaceSymbolProvider,
      WorkspaceSymbolRequest.type
    ),

    get syncsIncrementally() {
      let syncCapability =
        capabilities.textDocumentSync ?? TextDocumentSyncKind.None;
      if (typeof syncCapability !== "number") {
        syncCapability = syncCapability.change ?? TextDocumentSyncKind.None;
      }
      return syncCapability === TextDocumentSyncKind.Incremental;
    },
    get completionTriggers() {
      return capabilities.completionProvider?.triggerCharacters || [];
    },
    get signatureHelpTriggers() {
      return capabilities.signatureHelpProvider?.triggerCharacters || [];
    },
    get signatureHelpRetriggers() {
      return capabilities.signatureHelpProvider?.retriggerCharacters || [];
    },
  };
};

type Provider = keyof ServerCapabilities;
const METHOD_TO_PROVIDER: { [m: string]: Provider } = {
  "textDocument/codeAction": "codeActionProvider",
  "textDocument/codeLens": "codeLensProvider",
  "textDocument/color": "colorProvider",
  "textDocument/completion": "completionProvider",
  "textDocument/declaration": "declarationProvider",
  "textDocument/definition": "definitionProvider",
  "textDocument/documentFormatting": "documentFormattingProvider",
  "textDocument/documentHighlight": "documentHighlightProvider",
  "textDocument/documentLink": "documentLinkProvider",
  "textDocument/documentOnTypeFormatting": "documentOnTypeFormattingProvider",
  "textDocument/documentRangeFormatting": "documentRangeFormattingProvider",
  "textDocument/documentSymbol": "documentSymbolProvider",
  "textDocument/executeCommand": "executeCommandProvider",
  "textDocument/foldingRange": "foldingRangeProvider",
  "textDocument/hover": "hoverProvider",
  "textDocument/implementation": "implementationProvider",
  "textDocument/references": "referencesProvider",
  "textDocument/rename": "renameProvider",
  "textDocument/signatureHelp": "signatureHelpProvider",
  "textDocument/typeDefinition": "typeDefinitionProvider",
  "textDocument/workspaceSymbol": "workspaceSymbolProvider",
};

type Params<T> = T extends ProtocolRequestType<infer P, any, any, any, any>
  ? P
  : T extends ProtocolNotificationType<infer P, any>
  ? P
  : never;
type Result<T> = T extends ProtocolRequestType<any, infer R, any, any, any>
  ? R
  : never;
