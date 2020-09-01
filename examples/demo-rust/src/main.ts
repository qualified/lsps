import CodeMirror from "codemirror";
import "codemirror/mode/rust/rust";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/idea.css";
// ShowHint addon is required for completion capability.
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/closebrackets";
// import "codemirror/keymap/vim";

import marked from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

import { Workspace } from "@qualified/codemirror-workspace";
import "@qualified/codemirror-workspace/css/default.css";

import sampleRust from "!!raw-loader!../workspace/src/main.rs";

marked.setOptions({
  highlight(code, language) {
    if (language === "no_run") language = "rust";
    return hljs.highlight(
      hljs.getLanguage(language) ? language : "plaintext",
      code
    ).value;
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
};

const rustEditor = CodeMirror($("#rust-editor"), {
  ...config,
  mode: "text/x-rustsrc",
  value: sampleRust,
});

const rootUri = ROOT_URI;
const workspace = new Workspace({
  rootUri,
  getLanguageAssociation: (uri: string) => {
    if (uri.endsWith(".rs")) {
      return {
        languageId: "rust",
        languageServerIds: ["rust-analyzer"],
      };
    }
    return null;
  },
  getServerUri: async (id: string) => {
    switch (id) {
      case "rust-analyzer":
        return "ws://localhost:9999";
      default:
        return "";
    }
  },
  renderMarkdown: (markdown) => marked(markdown),
});

workspace.openTextDocument(rootUri + "/src/main.rs", rustEditor);
