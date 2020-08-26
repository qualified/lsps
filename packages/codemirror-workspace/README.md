# @qualified/codemirror-workspace

Provides intelligence to CodeMirror editors.

`Workspace` is an abstraction to allow CodeMirror editors to use Language Servers.

## Usage

```typescript
import { Workspace } from "@qualified/codemirror-workspace";

const workspace = new Workspace({
  // Project root. Required.
  rootUri: "file:///workspace",
  // Provide server URI so Workspace can make connections. Required.
  async getServerUri(id: string) {
    if (id === "javascript") return "ws://localhost:9990";
    return "";
  },
});
// Open text document in workspace to enable code intelligence.
// `cm` is CodeMirror.Editor instance with contents of the file.
workspace.openTextDocument("file:///workspace/example.js", cm);
```

## Prior Art

- [`lsp-editor-adapter`] by [@wylieconlon]

[`lsp-editor-adapter`]: https://github.com/wylieconlon/lsp-editor-adapter
[@wylieconlon]: https://github.com/wylieconlon
