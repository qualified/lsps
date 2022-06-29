import "./style.css";

import CodeMirror from "codemirror";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/css/css";
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

import addTs from "../workspace/add.ts?raw";
import sourceTs from "../workspace/source.ts?raw";
import projectHtml from "../workspace/project.html?raw";
import styleCss from "../workspace/style.css?raw";

const modeMap: { [k: string]: string } = {
  typescript: "text/typescript",
  javascript: "text/javascript",
  html: "text/html",
  css: "text/css",
};

const highlight = (code: string, language: string) => {
  const mode = modeMap[language] || "text/plain";
  const tmp = document.createElement("div");
  CodeMirror.runMode(code, mode, tmp, { tabSize: 4 });
  return tmp.innerHTML;
};

marked.use({
  // @ts-ignore renderer can be object literal
  renderer: {
    code(code: string, language: string | undefined) {
      if (!language) language = "text";
      code = highlight(code, language);
      // We need to add a class for the theme (e.g., `cm-s-idea`) on the wrapper.
      // If we're using a custom theme, it can apply its styles to `code[class^="language-"]`
      // and use Marked's default `code` with `highlight` option.
      return `<pre><code class="cm-s-idea language-${language}">${code}</code></pre>`;
    },
  },
});

const createEditor = (id: string, value: string, mode: string) =>
  CodeMirror(document.getElementById(id)!, {
    theme: "idea",
    gutters: ["cmw-gutter"],
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    mode,
    value,
  });

const workspace = new Workspace({
  rootUri: "source://",
  getLanguageAssociation: (uri: string) => {
    // javascript, javascriptreact, typescript, typescriptreact
    if (/\.(?:[jt]sx?)$/.test(uri)) {
      const languageId = /\.tsx?$/.test(uri) ? "typescript" : "javascript";
      return {
        languageId: languageId + (uri.endsWith("x") ? "react" : ""),
        languageServerIds: ["typescript-language-server"],
      };
    }

    const styles = uri.match(/\.(css|less|s[ac]ss)$/);
    if (styles !== null) {
      return {
        languageId: styles[1],
        languageServerIds: ["css-languageserver"],
      };
    }

    if (uri.endsWith(".html")) {
      return {
        languageId: "html",
        languageServerIds: ["html-languageserver"],
      };
    }

    // Workspace will ignore the file if null is returned.
    return null;
  },
  getConnectionString: async (id: string) => {
    return id ? `ws://localhost:9990?name=${id}` : "";
  },
  // Support Markdown documentation
  renderMarkdown: (markdown) => marked(markdown),
});

// `source.ts` imports `add.ts`
// The files are in the same workspace and shares the same connection.
workspace.openTextDocument(
  "source.ts",
  createEditor("ts-editor-1", sourceTs, "text/typescript")
);
workspace.openTextDocument(
  "add.ts",
  createEditor("ts-editor-2", addTs, "text/typescript")
);
workspace.openTextDocument(
  "project.html",
  createEditor("html-editor", projectHtml, "text/html")
);
workspace.openTextDocument(
  "style.css",
  createEditor("css-editor", styleCss, "text/css")
);

const enablePopupsButton = document.getElementById("enablePopups")!;
enablePopupsButton.addEventListener("click", () => {
  workspace.enablePopups(true);
});
const disablePopupsButton = document.getElementById("disablePopups")!;
disablePopupsButton.addEventListener("click", () => {
  workspace.enablePopups(false);
});
