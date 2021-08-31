# @qualified/codemirror-workspace

## 0.2.3

### Patch Changes

- 85c28ba: Notify all changes to all active Language Servers
- 49f6c6e: Fix a type using `Number` object

## 0.2.2

### Patch Changes

- a07eeef: Exposes workspace functions to clear popups on an individual editor or all editors
- eda79c2: Add `notifyFilesChanged(changes)` to send `workspace/didChangeWatchedFiles` notification.
- Updated dependencies [964de87]
  - @qualified/lsp-connection@0.2.1

## 0.2.1

### Patch Changes

- 511c8f4: Remove tooltips and other popovers on editor blur and editor changes

## 0.2.0

### Minor Changes

- 86d06f5: Make sure only a single connection is made per server id
