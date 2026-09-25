# Components

Primitivas de UI conhecidas de antemão como necessárias a **qualquer** app
clonado deste boilerplate — não "componentes compartilhados por mais de um
módulo" no sentido literal, já que hoje só existe o módulo `auth`. Essa é uma
exceção documentada à regra do segundo consumidor (ver `ARCHITECTURE.md` e a
Rule 5 do `AGENTS.md`): o "segundo consumidor" aqui é o próximo app, não o
próximo módulo deste repositório.

Duas subpastas desde o primeiro export, não uma organização especulativa:
`inputs/` e `forms/` são categorias genuinamente distintas (UI pura vs.
integração com uma lib de formulário) — o oposto do "começa flat" que ainda
vale para `modules/<m>/components/`. `FormErrorMessage`, `FormScreen` e `SubmitButton`
ficam soltos na raiz pelo mesmo princípio invertido: nenhum dos dois forma
uma categoria própria com só um export cada, então uma subpasta por
componente seria a divisão especulativa que a regra evita.

## Components

| Name | Description |
| ---- | ------------- |
| `FormErrorMessage` | Mensagem de erro de formulário: `message: string \| null`, não renderiza nada quando `null`. |
| `FormScreen` | Raiz de tela com formulário: `KeyboardAvoidingView` + `ScrollView` com `keyboardShouldPersistTaps="handled"`, conteúdo centralizado enquanto cabe. |
| `SubmitButton` | Botão de submit com estado de pending: troca o label por um spinner e desabilita via `isPending`. |
| `TextInput` | Primitiva base: label, `value`/`onChangeText` controlados, `error?`, `className`. Aceita qualquer prop nativa de `TextInput` via passthrough. |
| `EmailInput` | `TextInput` com teclado e autocomplete de e-mail fixados. |
| `PasswordInput` | `TextInput` com `secureTextEntry` e `variant: 'current' \| 'new'` — só o `autoComplete` muda entre os dois. |
| `CodeInput` | `TextInput` com teclado numérico e `one-time-code`; `digits` (o `maxLength`) vem de quem usa. |
| `FormField` | Liga um `Controller` do react-hook-form à primitiva certa, escolhida por `type`. `inputProps` é o escape hatch pra um campo sem componente próprio (ex.: token de reset) — tipado com as props de `TextInput` menos as que o formulário controla (`value`, `onChangeText`, `onBlur`, `label`, `error`), e espalhado antes delas para não poder sobrescrevê-las. |

## Constants

| Name | Description |
| ---- | ------------- |
| `PASSWORD_VARIANTS` | `current` \| `new` — prop `variant` do `PasswordInput`. |
| `FORM_FIELD_TYPES` | `text` \| `email` \| `password` \| `newPassword` \| `code` — prop `type` do `FormField`. |

## Types

| Name | Description |
| ---- | ------------- |
| `PasswordVariant` | União derivada de `PASSWORD_VARIANTS`. |
| `FormFieldType` | União derivada de `FORM_FIELD_TYPES`. |
| `TextInputProps` | Props do `TextInput`, incluindo o passthrough de props nativas. |
