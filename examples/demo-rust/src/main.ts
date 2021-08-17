import CodeMirror from "codemirror";
import "codemirror/mode/rust/rust";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/idea.css";
// ShowHint addon is required for completion capability.
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/runmode/runmode";
// import "codemirror/keymap/vim";

import marked from "marked";

import { Workspace } from "@qualified/codemirror-workspace";
import "@qualified/codemirror-workspace/css/default.css";

import sampleRust from "!!raw-loader!../workspace/src/lib.rs";

const highlight = (code: string, language: string) => {
  const mode =
    language === "rust" || language === "no_run"
      ? "text/x-rustsrc"
      : "text/plain";
  const tmp = document.createElement("div");
  CodeMirror.runMode(code, mode, tmp, { tabSize: 4 });
  return tmp.innerHTML;
};

marked.use({
  // @ts-ignore renderer can be object literal
  renderer: {
    code(code: string, language: string | undefined) {
      // Some examples are missing language tag, assume Rust.
      if (!language) language = "rust";
      code = highlight(code, language);
      // We need to add a class for the theme (e.g., `cm-s-idea`) on the wrapper.
      // If we're using a custom theme, it can apply its styles to `code[class^="language-"]`
      // and use Marked's default `code` with `highlight` option.
      return `<pre><code class="cm-s-idea language-${language}">${code}</code></pre>`;
    },
  },
});

const $ = (sel: string) => {
  const el = document.querySelector(sel);
  if (!el) throw new Error(`No element matching ${sel}`);
  return el as HTMLElement;
};

const config: CodeMirror.EditorConfiguration = {
  theme: "idea",
  // keyMap: "vim",
  gutters: ["cmw-gutter"],
  lineNumbers: true,
  matchBrackets: true,
  autoCloseBrackets: true,
  indentUnit: 4,
};

const rustEditor = CodeMirror($("#rust-editor"), {
  ...config,
  mode: "text/x-rustsrc",
  value: sampleRust,
});

const workspace = new Workspace({
  // Using relative URI. Requires lsp-ws-proxy v0.4.0+.
  rootUri: "source://",
  getLanguageAssociation: (uri: string) => {
    if (uri.endsWith(".rs")) {
      return {
        languageId: "rust",
        languageServerIds: ["rust-analyzer"],
      };
    }
    return null;
  },
  getConnectionString: async (id: string) => {
    switch (id) {
      case "rust-analyzer":
        return "ws://localhost:9999";
      default:
        return "";
    }
  },
  renderMarkdown: (markdown) => marked(markdown),
});

workspace.openTextDocument("src/lib.rs", rustEditor);
