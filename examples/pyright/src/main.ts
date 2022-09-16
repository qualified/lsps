import "./style.css";

import CodeMirror from "codemirror";
import "codemirror/mode/python/python";
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

import preloadedPy from "../workspace/preloaded.py?raw";
import solutionPy from "../workspace/solution.py?raw";
import solutionTestPy from "../workspace/tests/test_solution.py?raw";

const modeMap: { [k: string]: string } = {
  python: "python",
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
  indentUnit: 4,
};

const workspace = new Workspace({
  rootUri: "source://",
  getLanguageAssociation: (uri: string) => {
    if (uri.endsWith(".py")) {
      return {
        languageId: "python",
        languageServerIds: ["pyright-langserver"],
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
  configs: {
    "pyright-langserver": {
      settings: {
        python: {
          analysis: {
            autoSearchPaths: true,
            useLibraryCodeForTypes: true,
            diagnosticMode: "openFiles",
          },
        },
      },
    },
  },
});

workspace.openTextDocument(
  "preloaded.py",
  CodeMirror($("#preloaded-editor"), {
    ...config,
    mode: "python",
    value: preloadedPy,
  })
);

workspace.openTextDocument(
  "solution.py",
  CodeMirror($("#solution-editor"), {
    ...config,
    mode: "python",
    value: solutionPy,
  })
);

workspace.openTextDocument(
  "tests/solution_test.py",
  CodeMirror($("#test-editor"), {
    ...config,
    mode: "python",
    value: solutionTestPy,
  })
);
