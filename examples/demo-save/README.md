# @qualified/codemirror-workspace demo with Sync

This demo shows:

- `textDocument/didSave` writing to disk
- Manipulating remote files
- Using `workspace/didChangeWatchedFiles` notification to notify the Language Server

[`lsp-ws-proxy`] v0.7.0+ is required.

---

Install [`pnpm`] if you don't have it installed:

```
npm i -g pnpm@6
```

Install [`lsp-ws-proxy`] (v0.7.0+) by downloading a binary from [releases][proxy-releases] and moving it in `PATH`.

Install [`rust-analyzer`] by downloading a binary from [releases][analyzer-releases] and moving it in `PATH`.
You can also save the binary to `./bin/rust-analyzer` because `./bin` is prepended to `PATH` when starting the proxy.

Make sure to make the binaries executables with `chmod +x rust-analyzer` if it's not already set.

In project root:

```
pnpm install
```

In this directory:

```
pnpm start
```

[`lsp-ws-proxy`]: https://github.com/qualified/lsp-ws-proxy
[proxy-releases]: https://github.com/qualified/lsp-ws-proxy/releases
[`rust-analyzer`]: https://github.com/rust-analyzer/rust-analyzer
[analyzer-releases]: https://github.com/rust-analyzer/rust-analyzer/releases
[`pnpm`]: https://pnpm.js.org/
