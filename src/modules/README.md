# Modules

Organised **by module, not by file type**. Each folder here is a
self-contained module — screens, hooks, API calls, types — that exposes its
public surface through an `index.ts`.

```
modules/<name>/
  api/          calls to this module's backend
  components/   components specific to this module
  context/      this module's React Contexts, each with its provider
  hooks/        hooks specific to this module
  navigation/   this module's navigator and the param types of its routes
  screens/      screens belonging to this module
  utils/        this module's pure helpers — no React, no I/O
  validations/  validation schemas for this module's forms
  constants.ts  constants shared within the module
  types.ts
  index.ts      the ONLY entry point other modules may import
  README.md     mandatory — see AGENTS.md, includes a `## Flow` section with a
                Mermaid diagram (screens → hooks → API, and the connection to the outside)
```

## Modules

| Name   | Description                                                          |
| ------ | ---------------------------------------------------------------------- |
| `auth` | The app's session: sign-up, sign-in, restore on boot, sign-out and the state navigation consults. |
