# @qualified/codemirror-workspace

Provides intelligence to CodeMirror editors.

`Workspace` is an abstraction to allow CodeMirror editors to use Language Servers.

Language Servers can be in-browser (WebWorker) or remote over WebSocket.

## Usage Example

```typescript
import { Workspace } from "@qualified/codemirror-workspace";

const workspace = new Workspace({
  // Project root. Required.
  // Relative URI (`source://`) can be used with https://github.com/qualified/lsp-ws-proxy
  rootUri: "file:///workspace/",

  // Provide language associaton (language id and server ids) for URI. Required.
  getLanguageAssociation: (uri: string) => {
    // javascript, javascriptreact, typescript, typescriptreact
    if (/\.(?:[jt]sx?)$/.test(uri)) {
      const languageId = /\.tsx?$/.test(uri) ? "typescript" : "javascript";
      return {
        languageId: languageId + (uri.endsWith("x") ? "react" : ""),
        languageServerIds: ["typescript-language-server"],
      };
    }

    if (uri.endsWith(".css")) {
      return {
        languageId: "css",
        languageServerIds: ["css-language-server"],
      };
    }

    if (uri.endsWith(".json")) {
      return {
        languageId: "json",
        languageServerIds: ["json-worker"],
      };
    }

    // Return null to let the workspace ignore this file.
    return null;
  },

  // Provide the server's connection string. Required.
  // The returned string can be a URI of WebSocket proxy or
  // a location of Worker script to start Language Server.
  getConnectionString: async (langserverId: string) => {
    switch (langserverId) {
      case "typescript-language-server":
        // Use some API to start remote Language Server and return the WebSocket URI.
        const res = await fetch("/start", { method: "POST" });
        const { uri } = await res.json();
        return uri; // wss://example.com/tsls

      case "css-language-server":
        // Return an endpoint of already running proxy.
        return "ws://localhost:9991";

      case "json-worker":
        // Return a location of a script to start Language Server in Web Worker.
        return "js/json-worker.js";

      default:
        return "";
    }
  },

  // Optional function to return HTML string from Markdown.
  renderMarkdown: (markdown: string): string => markdown,
});
```

Open text document in workspace to enable code intelligence:

```typescript
// `cm` is CodeMirror.Editor instance with contents of the file.
workspace.openTextDocument("example.js", cm);
```

See [examples](https://github.com/qualified/lsps/tree/main/examples) for more.

## Tools

- [`lsp-ws-proxy`]: WebSocketify any Language Server. `lsp-ws-proxy -- langserver --stdio`

## Prior Art

- [`lsp-editor-adapter`] by [@wylieconlon]

[`lsp-ws-proxy`]: https://github.com/qualified/lsp-ws-proxy
[`lsp-editor-adapter`]: https://github.com/wylieconlon/lsp-editor-adapter
[@wylieconlon]: https://github.com/wylieconlon
