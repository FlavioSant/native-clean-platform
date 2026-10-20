# Components

UI primitives known in advance to be needed by **any** app cloned from this
boilerplate — not "components shared by more than one module" in the literal
sense, since only the `auth` module exists today. This is a documented
exception to the second-consumer rule (see `ARCHITECTURE.md` and Rule 5 of
`AGENTS.md`): the "second consumer" here is the next app, not the next module
in this repository.

Two subfolders from the first export, not a speculative organisation:
`inputs/` and `forms/` are genuinely distinct categories (pure UI vs.
integration with a form lib) — the opposite of the "start flat" that still
holds for `modules/<m>/components/`. `FormErrorMessage`, `FormScreen` and `SubmitButton`
sit loose at the root by the same inverted principle: neither of the two forms
a category of its own with a single export each, so one subfolder per
component would be the speculative split the rule avoids.

## Components

| Name | Description |
| ---- | ------------- |
| `FormErrorMessage` | Form error message: `message: string \| null`, renders nothing when `null`. |
| `FormScreen` | Form screen root: `KeyboardAvoidingView` + `ScrollView` with `keyboardShouldPersistTaps="handled"`, content centred while it fits. |
| `SubmitButton` | Submit button with a pending state: swaps the label for a spinner and disables itself via `isPending`. |
| `TextInput` | Base primitive: label, controlled `value`/`onChangeText`, `error?`, `className`. Accepts any native `TextInput` prop via passthrough. |
| `EmailInput` | `TextInput` with the email keyboard and autocomplete fixed. |
| `PasswordInput` | `TextInput` with `secureTextEntry` and `variant: 'current' \| 'new'` — only the `autoComplete` changes between the two. |
| `CodeInput` | `TextInput` with a numeric keyboard and `one-time-code`; `digits` (the `maxLength`) comes from the caller. |
| `FormField` | Binds a react-hook-form `Controller` to the right primitive, chosen by `type`. `inputProps` is the escape hatch for a field with no component of its own (e.g. a reset token) — typed with `TextInput`'s props minus the ones the form controls (`value`, `onChangeText`, `onBlur`, `label`, `error`), and spread before them so it cannot override them. |

## Constants

| Name | Description |
| ---- | ------------- |
| `PASSWORD_VARIANTS` | `current` \| `new` — `PasswordInput`'s `variant` prop. |
| `FORM_FIELD_TYPES` | `text` \| `email` \| `password` \| `newPassword` \| `code` — `FormField`'s `type` prop. |

## Types

| Name | Description |
| ---- | ------------- |
| `PasswordVariant` | Union derived from `PASSWORD_VARIANTS`. |
| `FormFieldType` | Union derived from `FORM_FIELD_TYPES`. |
| `TextInputProps` | `TextInput`'s props, including the passthrough of native props. |
