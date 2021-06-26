# LSPs

Monorepo of packages related to [LSP][lsp].

[![Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public.](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)
[![CI](https://github.com/qualified/lsps/workflows/CI/badge.svg)](https://github.com/qualified/lsps/actions?query=workflow%3ACI)
[![License MIT](https://img.shields.io/github/license/qualified/lsps)](./LICENSE.md)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat)](https://github.com/prettier/prettier)

## Packages

- [`@qualified/vscode-jsonrpc-ws`]
  - Create VSCode JSON RPC `MessageConnection` over WebSocket
- [`@qualified/vscode-jsonrpc-ww`]
  - Create VSCode JSON RPC `MessageConnection` to Web Worker
- [`@qualified/lsp-connection`]
  - VSCode JSON RPC `MessageConnection` wrapper for LSP messages
- [`@qualified/codemirror-workspace`]
  - Provides intelligence to CodeMirror editors

## Demo

Example with [Rust Analyzer](https://github.com/rust-analyzer/rust-analyzer):

![demo-rust-analyzer](https://user-images.githubusercontent.com/639336/92679057-430eed00-f2dc-11ea-923e-e5c165157a96.gif)

The styling definitely needs work, but the above shows:

- Realtime diagnostics
- Completion with items from the server
- Fuzzy matching (e.g., `prl` to `println!`)
- Completion items with Markdown docs
- Completion items with icons for each kind
- Hover information with Markdown docs

Simple snippets are supported as well:

![demo-snippet-completion](https://user-images.githubusercontent.com/639336/92679093-58841700-f2dc-11ea-8f27-84e64996d8f3.gif)

See [examples/demo-rust](./examples/demo-rust) to run this locally.

See [examples/demo-save](./examples/demo-save) to run this locally with an ability to save the changes to disk.

See [examples/demo-worker](./examples/demo-worker) for an example with simple JSON Language Server running in Web Worker.
A live demo is also available at https://qualified.github.io/lsps/.

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
  - `willSave` ![meh]
  - `willSaveWaitUntil` ![meh]
  - `didSave` ![meh]
  - `didClose` ![ok]
- `completion`
  - `insertText` ![ok]
  - `additionalTextEdits` ![ok]
  - `textEdit` ![ok]
  - `InsertTextFormat.Snippet` ![meh]
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
- `documentSymbol` ![ok]
- `codeAction` ![no]
- `codeLens` ![no]
- `documentLink` ![no]
- `colorProvider` ![no]
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
[`@qualified/vscode-jsonrpc-ws`]: https://www.npmjs.com/package/@qualified/vscode-jsonrpc-ws
[`@qualified/vscode-jsonrpc-ww`]: https://www.npmjs.com/package/@qualified/vscode-jsonrpc-ww
[`@qualified/lsp-connection`]: https://www.npmjs.com/package/@qualified/lsp-connection
[`@qualified/codemirror-workspace`]: https://www.npmjs.com/package/@qualified/codemirror-workspace
[ok]: ./docs/img/ok.svg
[meh]: ./docs/img/meh.svg
[no]: ./docs/img/no.svg
