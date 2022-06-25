import { defineConfig } from "vite";

export default defineConfig({
  define: {
    // For `typescript.serverPath` in initialization option
    __TS_SERVER_PATH__: JSON.stringify(
      __dirname + "/node_modules/typescript/lib/tsserverlibrary.js"
    ),
  },
});
