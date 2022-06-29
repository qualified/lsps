import "./style.css";

import CodeMirror from "codemirror";
import "codemirror/mode/javascript/javascript";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/idea.css";
// ShowHint addon is required for completion capability.
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/runmode/runmode";

import { marked } from "marked";

import { Workspace } from "@qualified/codemirror-workspace";
import "@qualified/codemirror-workspace/css/default.css";

const JSON_WORKER = "json-worker";
const workspace = new Workspace({
  rootUri: "inmemory://workspace/",
  getLanguageAssociation: (uri: string) => {
    if (uri.endsWith(".json")) {
      return { languageId: "json", languageServerIds: [JSON_WORKER] };
    }
    return null;
  },
  getConnectionString: async (id: string) => {
    switch (id) {
      case JSON_WORKER:
        return "worker.js";
      default:
        return "";
    }
  },
  // Support Markdown documentation
  renderMarkdown: (markdown) => marked(markdown),
});

const editor = CodeMirror(document.getElementById("editor")!, {
  theme: "idea",
  gutters: ["cmw-gutter"],
  lineNumbers: true,
  matchBrackets: true,
  autoCloseBrackets: true,
  mode: "application/json",
  value: JSON.stringify(
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
  ),
});

workspace.openTextDocument("tsconfig.json", editor);
