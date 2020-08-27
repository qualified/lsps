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

![demo](./docs/img/demo.gif)

See [examples/demo](./examples/demo).

## Tools

- [`lsp-ws-proxy`]: WebSocketify any Language Server. `lsp-ws-proxy -- langserver --stdio`

## License

[MIT](./LICENSE.md)

[lsp]: https://microsoft.github.io/language-server-protocol/
[`lsp-ws-proxy`]: https://github.com/qualified/lsp-ws-proxy
[`@qualified/vscode-jsonrpc-ws`]: ./packages/vscode-jsonrpc-ws
[`@qualified/lsp-connection`]: ./packages/lsp-connection
[`@qualified/codemirror-workspace`]: ./packages/codemirror-workspace
