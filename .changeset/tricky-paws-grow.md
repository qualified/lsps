---
"@qualified/codemirror-workspace": patch
---

Encapsulate completion logic in `CompletionHandler`

- Fix trigger character ignored while "complete" completion is active
- Cancel pending requests
