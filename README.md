# LSPs

Monorepo of packages related to [LSP][lsp].

## Packages

- [`@qualified/vscode-jsonrpc-ws`]
  - Create VSCode JSON RPC `MessageConnection` over WebSocket
- [`@qualified/lsp-connection`]
  - VSCode JSON RPC `MessageConnection` wrapper for LSP messages
- [`@qualified/codemirror-workspace`]
  - Provides intelligence to CodeMirror editors

## Demo

Example with [Rust Analyzer](https://github.com/rust-analyzer/rust-analyzer):

![demo](./docs/img/demo-rust-analyzer.gif)

The styling definitely needs work, but the above shows:

- Realtime diagnostics
- Completion with items from the server
- Fuzzy matching (e.g., `prl` to `println!`)
- Completion items with Markdown docs
- Completion items with icons for each kind
- Hover information with Markdown docs

See [examples/demo-rust](./examples/demo-rust) to run this locally.

See [examples/demo](./examples/demo) for a simple demo project with TypeScript + CSS + HTML editors.

## Tools

- [`lsp-ws-proxy`]: WebSocketify any Language Server. `lsp-ws-proxy -- langserver --stdio`

## Capabilities

### Text Document

- `synchronization`
  - `didOpen` ![ok]
  - `didChange` ![ok]
    - Full text change ![ok]
    - Incremental text change ![ok]
  - `willSave` ![no]
  - `willSaveWaitUntil` ![no]
  - `didSave` ![no]
  - `didClose` ![ok]
- `completion`
  - `insertText` ![ok]
  - `additionalTextEdits` ![no]
  - `textEdit` ![ok]
  - `InsertTextFormat.Snippet` ![no]
  - `documentation` ![meh]
  - `command` ![no]
  - `tags` ![no]
- `hover` ![meh]
- `signatureHelp` ![meh]
- Goto
  - `declaration` ![meh]
  - `definition` ![meh]
  - `typeDefinition` ![meh]
  - `implementation` ![meh]
- `references` ![meh]
- `documentHighlight` ![ok]
- `documentSymbol` ![no]
- `codeAction` ![no]
- `codeLens` ![no]
- `documentLink` ![no]
- `colorProvier` ![no]
- Formatting
  - `formatting` ![no]
  - `rangeFormatting` ![no]
  - `onTypeFormatting` ![no]
- `rename` ![no]
- `foldingRange` ![no]
- `selectionRange` ![no]
- `publishDiagnostics` ![meh]
- `callHierarchy` ![no]

### Workspace

- `applyEdit` ![no]
- `workspaceEdit` ![no]
- `didChangeConfiguration` ![no]
- `didChangeWatchedFiles` ![no]
- `symbol` ![no]
- `executeCommand` ![no]

### Window

- `workDoneProgress` ![no]

## License

[MIT](./LICENSE.md)

[lsp]: https://microsoft.github.io/language-server-protocol/
[`lsp-ws-proxy`]: https://github.com/qualified/lsp-ws-proxy
[`@qualified/vscode-jsonrpc-ws`]: ./packages/vscode-jsonrpc-ws
[`@qualified/lsp-connection`]: ./packages/lsp-connection
[`@qualified/codemirror-workspace`]: ./packages/codemirror-workspace
[ok]: ./docs/img/ok.svg
[meh]: ./docs/img/meh.svg
[no]: ./docs/img/no.svg
