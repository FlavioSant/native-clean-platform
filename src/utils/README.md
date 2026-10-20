# Utils

Pure helpers, with no React and no I/O. If a helper needs state, a hook or the
network, it belongs in `src/hooks/` or `src/lib/` instead of here.

## Functions

| Name             | Description                                                           |
| ---------------- | --------------------------------------------------------------------- |
| `classnames(...inputs)`  | Combines class names conditionally and resolves Tailwind conflicts (`classnames('p-2','p-4')` → `'p-4'`). |
