# @qualified/codemirror-workspace

## 0.2.7

### Patch Changes

- bfa03b2: Support `completionItem/resolve` request
- bfa03b2: Fix completion lists being unnecessarily recomputed

## 0.2.6

### Patch Changes

- a11d358: Fix signature help not triggered when used with closebrackets addon
- b86fe38: Show first signature help when `activeSignature` is not set

## 0.2.5

### Patch Changes

- 0e3d385: Fix `showSignatureHelp` crashing with undefined `activeSignature`

## 0.2.4

### Patch Changes

- 7d4041f: Adds manual autocompletion shortcut
- d49363e: Improves tooltip experience by closing when mouse leaves editor
- b59e01b: Support `initializationOptions` and `settings`
- 716f79b: Improve completion item scoring
- Updated dependencies [66d3881]
  - @qualified/lsp-connection@0.2.2

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
