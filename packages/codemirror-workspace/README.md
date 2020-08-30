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
  async getServerUri(langserverId: string) {
    switch (langserverId) {
      case "typescript-language-server":
        // const res = await fetch("/start", { method: "POST" });
        // return res.json().uri;
        return "ws://localhost:9990";
      case "css-language-server":
        return "ws://localhost:9991";
      case "html-language-server":
        return "ws://localhost:9992";
      default:
        return "";
    }
  },
  // Provide language associaton (language id and server ids) for URI. Required.
  getLanguageAssociation(uri: string) {
    // javascript, javascriptreact, typescript, typescriptreact
    if (/\.(?:[jt]sx?)$/.test(uri)) {
      const languageServerIds = ["typescript-language-server"];
      const languageId = /\.tsx?$/.test(uri) ? "typescript" : "javascript";
      return {
        languageId: languageId + (uri.endsWith("x") ? "react" : ""),
        languageServerIds,
      };
    }

    const m = uri.match(/\.(css|less|scss|sass)$/);
    if (m !== null) {
      return {
        languageId: m[1],
        languageServerIds: ["css-language-server"],
      };
    }

    if (uri.endsWith(".html")) {
      return {
        languageId: "html",
        languageServerIds: ["html-language-server"],
      };
    }

    // Workspace will ignore the file if null is returned.
    return null;
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
