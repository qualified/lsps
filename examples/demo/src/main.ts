import CodeMirror from "codemirror";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/css/css";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/idea.css";
// ShowHint addon is required for completion capability.
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/show-hint";

import { Workspace } from "@qualified/codemirror-workspace";
import "@qualified/codemirror-workspace/css/default.css";

import addTs from "!!raw-loader!../workspace/add.ts";
import sampleTs from "!!raw-loader!../workspace/source.ts";
import sampleHtml from "!!raw-loader!../workspace/project.html";
import sampleCss from "!!raw-loader!../workspace/style.css";

const $ = (sel: string) => {
  const el = document.querySelector(sel);
  if (!el) throw new Error(`No element matching ${sel}`);
  return el as HTMLElement;
};

const tsEditor1 = CodeMirror($("#ts-editor-1"), {
  theme: "idea",
  lineNumbers: true,
  mode: "text/typescript",
  value: addTs,
  gutters: ["cm-lsp-gutter"],
});

const tsEditor2 = CodeMirror($("#ts-editor-2"), {
  theme: "idea",
  lineNumbers: true,
  mode: "text/typescript",
  value: sampleTs,
  gutters: ["cm-lsp-gutter"],
});

const htmlEditor = CodeMirror($("#html-editor"), {
  theme: "idea",
  lineNumbers: true,
  mode: "htmlmixed",
  value: sampleHtml,
  gutters: ["cm-lsp-gutter"],
});

const cssEditor = CodeMirror($("#css-editor"), {
  theme: "idea",
  lineNumbers: true,
  mode: "css",
  value: sampleCss,
  gutters: ["cm-lsp-gutter"],
});

const rootUri = ROOT_URI;
const workspace = new Workspace({
  rootUri,
  async getServerUri(id: string) {
    switch (id) {
      case "javascript":
      case "typescript":
        return "ws://localhost:9990";
      case "html":
        return "ws://localhost:9991";
      case "css":
        return "ws://localhost:9992";
      default:
        return "";
    }
  },
});

workspace.openTextDocument(rootUri + "/add.ts", tsEditor1).then(() => {
  // This is necessary to ensure that workspace doesn't try to make more than one connection per file type.
  // Workspace might provide convenience method to open multiple files safely in the future.
  workspace.openTextDocument(rootUri + "/source.ts", tsEditor2);
});
// No need to wait if using different language servers.
workspace.openTextDocument(rootUri + "/project.html", htmlEditor);
workspace.openTextDocument(rootUri + "/style.css", cssEditor);
