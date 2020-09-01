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
// import "codemirror/keymap/vim";

import marked from "marked";

import { Workspace } from "@qualified/codemirror-workspace";
import "@qualified/codemirror-workspace/css/default.css";

import addTs from "!!raw-loader!../workspace/add.ts";
import sampleTs from "!!raw-loader!../workspace/source.ts";
import sampleHtml from "!!raw-loader!../workspace/project.html";
import sampleCss from "!!raw-loader!../workspace/style.css";

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

const tsEditorSource = CodeMirror($("#ts-editor-1"), {
  ...config,
  mode: "text/typescript",
  value: sampleTs,
});

const tsEditorAdd = CodeMirror($("#ts-editor-2"), {
  ...config,
  mode: "text/typescript",
  value: addTs,
});

const htmlEditor = CodeMirror($("#html-editor"), {
  ...config,
  mode: "text/html",
  value: sampleHtml,
});

const cssEditor = CodeMirror($("#css-editor"), {
  ...config,
  mode: "text/css",
  value: sampleCss,
});

const rootUri = ROOT_URI;
const workspace = new Workspace({
  rootUri,
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
  getConnectionString: async (id: string) => {
    switch (id) {
      case "typescript-language-server":
        return "ws://localhost:9990";
      case "html-language-server":
        return "ws://localhost:9991";
      case "css-language-server":
        return "ws://localhost:9992";
      default:
        return "";
    }
  },
  // Support Markdown documentation
  renderMarkdown: (markdown) => marked(markdown),
});

workspace.openTextDocument(rootUri + "/add.ts", tsEditorAdd).then(() => {
  // This is necessary to ensure that workspace doesn't try to make more than one connection per file type.
  // Workspace might provide convenience method to open multiple files safely in the future.
  workspace.openTextDocument(rootUri + "/source.ts", tsEditorSource);
});
// No need to wait if using different language servers.
workspace.openTextDocument(rootUri + "/project.html", htmlEditor);
workspace.openTextDocument(rootUri + "/style.css", cssEditor);
