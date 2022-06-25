import "./style.css";

import CodeMirror from "codemirror";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/css/css";
import "codemirror/mode/vue/vue";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/idea.css";
// ShowHint addon is required for completion capability.
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/runmode/runmode";
// import "codemirror/keymap/vim";

import { marked } from "marked";

import { Workspace } from "@qualified/codemirror-workspace";
import "@qualified/codemirror-workspace/css/default.css";

import AppVue from "../workspace/App.vue?raw";

const modeMap: { [k: string]: string } = {
  typescript: "text/typescript",
  javascript: "text/javascript",
  html: "text/html",
  css: "text/css",
  vue: "text/x-vue",
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

const workspace = new Workspace({
  rootUri: "source://",
  getLanguageAssociation: (uri: string) => {
    if (uri.endsWith(".vue")) {
      return { languageId: "vue", languageServerIds: ["vue-language-server"] };
    }
    // Workspace will ignore the file if null is returned.
    return null;
  },
  getConnectionString: async (id: string) => {
    return id ? `ws://localhost:9990?name=${id}` : "";
  },
  // Support Markdown documentation
  renderMarkdown: (markdown) => marked(markdown),
  configs: {
    "vue-language-server": {
      initOptions: {
        typescript: {
          serverPath: __TS_SERVER_PATH__,
          localizedPath: null,
        },
        languageFeatures: {
          hover: true,
          signatureHelp: true,
          diagnostics: true,
          references: true,
          implementation: true,
          definition: true,
          typeDefinition: true,
          documentHighlight: true,
          documentLink: true,
          completion: {
            defaultTagNameCase: "both",
            defaultAttrNameCase: "kebabCase",
            getDocumentNameCasesRequest: false,
            getDocumentSelectionRequest: false,
          },
          // schemaRequestService: {
          //   getDocumentContentRequest: true,
          // },
          // callHierarchy: true,
          // rename: true,
          // renameFileRefactoring: true,
          // workspaceSymbol: true,
          // codeLens: { showReferencesNotification: true },
          // semanticTokens: true,
          // codeAction: true,
          // inlayHints: true,
        },
        // documentFeatures: {
        //   selectionRange: true,
        //   foldingRange: true,
        //   linkedEditingRange: true,
        //   documentColor: false,
        //   documentFormatting: true,
        //   documentSymbol: true,
        // },
      },
      settings: {},
    },
  },
});

workspace.openTextDocument(
  "App.vue",
  CodeMirror($("#vue-editor"), {
    ...config,
    mode: "text/x-vue",
    value: AppVue,
  })
);
