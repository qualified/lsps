# Examples

Minimal examples of using `@qualified/codemirror-workspace` with different Language Servers. These are used for manual testing and showcasing different features.

The [web-worker](./web-worker) example uses an in-browser Language Server. Others use Language Servers over WebSocket with [`lsp-ws-proxy`].

Examples are [Vite][vite] projects and support HMR. See each example for more information on how to run it.

## Adding Example

> TODO Expand this

1. Create new Vite project with `vanilla-ts` or copy existing example
2. Add dependencies like `codemirror` and `marked`. `@qualified/codemirror-workspace` should have version `workspace:x.y.z` so PNPM will link the local one.
3. Add dev dependencies like `concurrently`
4. Find how to install Language Servers. The sources of Vim plugins are very useful for this:
   - [mattn/vim-lsp-settings](https://github.com/mattn/vim-lsp-settings/tree/master/installer)
   - [williamboman/nvim-lsp-installer](https://github.com/williamboman/nvim-lsp-installer/tree/main/lua/nvim-lsp-installer/servers)
5. Add NPM script (`scripts` in `package.json`) `start-proxy` that starts `lsp-ws-proxy` for the Language Server.
6. Change `dev` script to `concurrently 'vite' 'pnpm start-proxy'`

[`lsp-ws-proxy`]: https://github.com/qualified/lsp-ws-proxy
[vite]: https://vitejs.dev
