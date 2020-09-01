import CodeMirror from "codemirror";
import "codemirror/mode/javascript/javascript";
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

const sampleJson = JSON.stringify(
  {
    compilerOptions: {
      target: "es2017",
      module: "commonjs",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
  },
  null,
  2
);

marked.setOptions({
  highlight: (code, language) =>
    hljs.highlight(hljs.getLanguage(language) ? language : "plaintext", code)
      .value,
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

const tsEditorAdd = CodeMirror($("#editor"), {
  ...config,
  mode: "application/json",
  value: sampleJson,
});

const JSON_WORKER = "json-worker";
const workspace = new Workspace({
  rootUri: "inmemory://workspace",
  getLanguageAssociation(uri: string) {
    if (uri.endsWith(".json")) {
      return { languageId: "json", languageServerIds: [JSON_WORKER] };
    }
    return null;
  },
  async getServerUri(id: string) {
    switch (id) {
      case JSON_WORKER:
        return "/js/worker.js";
      default:
        return "";
    }
  },
  // Support Markdown documentation
  renderMarkdown: (markdown) => marked(markdown),
});

workspace.openTextDocument("inmemory://workspace/tsconfig.json", tsEditorAdd);
