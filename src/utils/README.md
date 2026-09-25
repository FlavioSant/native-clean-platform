# Utils

Helpers puros, sem React e sem I/O. Se um helper precisa de estado, de um hook
ou de rede, ele pertence a `src/hooks/` ou `src/lib/` em vez daqui.

## Functions

| Name             | Description                                                           |
| ---------------- | --------------------------------------------------------------------- |
| `classnames(...inputs)`  | Combina nomes de classe condicionalmente e resolve conflitos do Tailwind (`classnames('p-2','p-4')` → `'p-4'`). |
