# LSPs

Monorepo of packages related to [LSP][lsp], especially in browser.

## Packages

- `@qualified/vscode-jsonrpc-ws`
  - Create VSCode JSON RPC `MessageConnection` over WebSocket
- `@qualified/lsp-connection`
  - VSCode JSON RPC `MessageConnection` wrapper for LSP messages
- `@qualified/codemirror-workspace`
  - Provides intelligence to CodeMirror editors

## Demo

See [examples/demo](./examples/demo).

## Tools

- [`lsp-ws-proxy`]: WebSocketify any Language Server. `lsp-ws-proxy -- langserver --stdio`

## Prior Art

- [`lsp-editor-adapter`] by [@wylieconlon]
- [`jsonrpc-ws-proxy`] by [@wylieconlon]

## License

[MIT](./LICENSE.md)

[lsp]: https://microsoft.github.io/language-server-protocol/
[`lsp-ws-proxy`]: https://github.com/qualified/lsp-ws-proxy
[`lsp-editor-adapter`]: https://github.com/wylieconlon/lsp-editor-adapter
[`jsonrpc-ws-proxy`]: https://github.com/wylieconlon/jsonrpc-ws-proxy
[@wylieconlon]: https://github.com/wylieconlon
