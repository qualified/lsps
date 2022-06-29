# @qualified/codemirror-workspace

## 0.5.0

### Minor Changes

- 27d336c: Update vscode-languageserver-protocol to 3.17.1

### Patch Changes

- 8a1bd9a: Fix overflowing tooltip
- Updated dependencies [27d336c]
- Updated dependencies [27d336c]
  - @qualified/lsp-connection@0.3.0
  - @qualified/vscode-jsonrpc-ws@0.4.0
  - @qualified/vscode-jsonrpc-ww@0.3.0

## 0.4.2

### Patch Changes

- b7b96ee: Fix `MarkedString` rendered as plain text

## 0.4.1

### Patch Changes

- 90dcd05: Fix undefined error with Worker connection

## 0.4.0

### Minor Changes

- 24a585a: Reconnect WebSocket connection on abnormal closures and implement `dispose()`

### Patch Changes

- Updated dependencies [841f39a]
  - @qualified/vscode-jsonrpc-ws@0.3.0

## 0.3.0

### Minor Changes

- 50a7f26: Added the ability to disable all popups temporarily
- 81bb615: Added close button to tooltips

## 0.2.9

### Patch Changes

- 5c4bb54: Fix context menu closing before click
- 0309a75: Fix completion with simple insertion within a string

## 0.2.8

### Patch Changes

- 68a2cb6: Fix HTML completion

  - Fix closing tag completion keeping extra `/`
  - Fix attributes completion

- 2a66aa7: Fix completion item with `textEdit` not completed correctly when the completion list is complete and not recomputed on further typing.
- 4c1b3e9: Update minimum `codemirror` version to 5.59.2. CMW depends on `show-hint` addon's `updateOnCursorActivity` option to prevent unnecessary updates.
- c83c05a: Encapsulate completion logic in `CompletionHandler`

  - Fix trigger character ignored while "complete" completion is active
  - Cancel pending requests

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
