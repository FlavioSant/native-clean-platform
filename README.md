# React Native Boilerplate

Base reutilizável para apps React Native. **Isto não é um app finalizado** — é
o ponto de partida que outros projetos clonam.

**Stack:** Expo SDK 57 (managed) · React Native 0.86 · TypeScript · NativeWind v4
(Tailwind 3.4) · React Navigation 7 · TanStack Query 5 · axios ·
react-hook-form + zod · expo-secure-store · Biome · pnpm

**Status:** estrutura, ferramentas e convenções prontas, mais o módulo `auth`
implementado contra treze dos catorze endpoints de `/auth` de
`api-clean-platform`: cadastro com verificação de e-mail, login, recuperação e
troca de senha, rotação do refresh token, restauração da sessão no boot, logout
neste aparelho ou em todos, sessões ativas, exclusão da conta e gate de
navegação. Só o login com Google está adiado. Há também uma camada de
erros: error boundary de render, toast
global para falhas sem tela dona, copy compartilhada por `code` e queries que
pausam quando o aparelho fica offline. Dark mode está implementado: variáveis
CSS aplicadas em runtime pelo `ThemeProvider`, com o app seguindo o tema do
sistema por padrão e um override manual (`light`/`dark`/`system`) que o
usuário troca na tela de conta.

> **Convenções de código** (como escrever) estão em **[AGENTS.md](AGENTS.md)**.
> **Arquitetura** (o que existe, fronteiras entre módulos, decisões travadas e
> o que ainda falta) está em **[ARCHITECTURE.md](ARCHITECTURE.md)**. Leia os
> dois antes de contribuir.

---

## Começando

Requer pnpm. Se você não tem: `corepack enable pnpm`.

```bash
pnpm install
cp .env.example .env    # e ajuste EXPO_PUBLIC_API_URL se a API não estiver em localhost:3000
pnpm start          # Metro — abre o Expo Go / dev tools
pnpm android        # abre no emulador/dispositivo Android via Expo Go
pnpm ios            # abre no simulador iOS via Expo Go (somente macOS)
pnpm web            # abre no navegador
```

Checagens de qualidade:

```bash
pnpm check              # typecheck + lint — rode antes de cada commit
pnpm typecheck          # tsc --noEmit
pnpm lint               # biome check
pnpm lint:fix           # biome check --write (correções seguras)
pnpm format             # biome format --write
pnpm test               # jest --watchAll --coverage
pnpm test:ci            # jest --ci --coverage
```

---

## Estrutura de pastas

Organizado **por módulo, não por tipo de arquivo**. Um novo módulo é uma
nova pasta autocontida em `src/modules/`, com sua própria API pública,
telas, componentes e hooks. Todo módulo tem seu próprio `README.md`
documentando o que ele exporta — veja
[`src/modules/README.md`](src/modules/README.md) para o detalhamento
completo das convenções.

```
App.tsx              raiz: providers + navegação
biome.json            linter + formatter (substitui ESLint e Prettier)
tailwind.config.js    lê os tokens de src/theme/tokens.js
src/
  components/          primitivas de UI (inputs, FormField, FormScreen, SubmitButton)
  config/               variáveis de ambiente, validadas na carga
  errors/               classificação de erro, copy, toast, boundary, QueryClient do app
  lib/                  cliente HTTP e conectividade — I/O sem React
  screens/              telas sem módulo próprio
  navigation/           React Navigation: stack, rotas, tipos de parâmetro
  modules/              um módulo por pasta — veja src/modules/README.md
  theme/                design tokens (fonte única da verdade)
  utils/                helpers puros (classnames)
```

Nada fora de um módulo importa um arquivo de dentro dele — só o que o
`index.ts` exporta — e módulos não importam uns aos outros. Código
compartilhado sobe para `src/components/` (a partir do segundo consumidor)
ou para um módulo de topo como `src/hooks/`, `src/lib/` ou
`src/store/`, criados apenas quando algo realmente precisar deles — veja
[AGENTS.md](AGENTS.md) para o propósito de cada um.

A árvore completa de hoje, com o papel de cada arquivo, e a tabela da regra
de fronteira entre módulos estão em [ARCHITECTURE.md](ARCHITECTURE.md),
seção 2.

---

## Design tokens

`src/theme/tokens.js` é a **fonte única da verdade**. É CommonJS de propósito:
o mesmo arquivo alimenta o `tailwind.config.js` (Node) e o código TypeScript
(através de `src/theme/index.ts`, com os tipos inferidos do próprio arquivo), então um token
nunca diverge entre os dois.

Os valores são strings CSS (`'16px'`) porque o NativeWind compila Tailwind
para CSS antes de converter para estilos nativos. Para usar um token fora do
Tailwind:

```ts
import { parsePixels, spacing, useThemeColors } from '@/theme';

const theme = useThemeColors();

<ActivityIndicator color={theme.primary} size={parsePixels(spacing[6])} />;
```

### Cores brutas vs. semânticas

Prefira os aliases semânticos nas telas:

| Use isto                             | Em vez disto          |
| ------------------------------------ | -------------------- |
| `bg-background`, `bg-surface`        | `bg-neutral-50`      |
| `text-content`, `text-content-muted` | `text-neutral-900`   |
| `bg-primary`                         | `bg-brand-500`       |
| `border-border`                      | `border-neutral-200` |

Rebranding e dark mode acontecem então em um único lugar
(`semanticColors`/`semanticColorsDark`) — nenhuma tela precisa ser tocada. O
app segue o tema do sistema por padrão, com um override manual salvo pelo
usuário. Ver [ARCHITECTURE.md](ARCHITECTURE.md), seção 5.

### Adaptando para um novo app

1. Substitua a escala `colors.brand` em `src/theme/tokens.js`.
2. Revise `semanticColors` e `semanticColorsDark` se a marca precisar de
   superfícies ou contraste diferentes nos dois temas.
3. Para uma fonte customizada: carregue com `expo-font`, depois defina `typography.fontFamily.sans`.
4. Atualize `name` e `slug` em `app.json`, e `name` em `package.json`. Defina
   também `ios.bundleIdentifier`, `android.package` e `scheme` — o boilerplate
   não traz valor nenhum de propósito (cada app tem o seu), e sem eles não há
   build de release nem deep link.

Nenhuma tela precisa ser tocada. O porquê de `tokens.js` ser CommonJS e a
regra de estilização (só NativeWind, sem `StyleSheet`) estão detalhados em
[ARCHITECTURE.md](ARCHITECTURE.md), seção 5.

---

## Decisões e porquês

As decisões travadas — por que Biome em vez de ESLint + Prettier, por que
pnpm com `hoisted`, por que NativeWind v4 e não v5, por que React Navigation
e não Expo Router, `noUncheckedIndexedAccess`, sem ordenação de classes
Tailwind — e o porquê de cada uma vivem em
[ARCHITECTURE.md](ARCHITECTURE.md), seção 9. Mantidas só lá para não haver
duas explicações que possam divergir.

---

## Estado atual da navegação

Ver [ARCHITECTURE.md](ARCHITECTURE.md), seção 6 — o composition root que lista
módulos em vez de telas, e o gate que escolhe entre o stack logado e o
deslogado.

---

## Roadmap

> O que falta implementar é rastreado aqui como progresso; o mesmo conteúdo
> aparece em [ARCHITECTURE.md](ARCHITECTURE.md), seção 10, como um registro de
> "isto não existe ainda, não é omissão" — os dois têm propósitos diferentes,
> mas descrevem a mesma lacuna.

- [x] **Setup** — Expo + TS, NativeWind + tokens, estrutura de pastas,
      React Navigation, README.
- [x] **Padrões** — Biome substitui ESLint/Prettier, pnpm, convenções do
      projeto em `AGENTS.md`, código só em inglês, README por módulo,
      sem strings ou números mágicos, testes unitários com jest-expo +
      React Native Testing Library. Sem E2E por enquanto — o Maestro foi
      removido por exigir Android Studio/Simulador iOS configurados
      localmente.
- [x] **Auth** — módulo em `src/modules/auth/` contra `api-clean-platform`:
      cliente HTTP (axios) em `src/lib/`, `useAuth()` / `AuthProvider`,
      refresh token rotativo no `expo-secure-store` (o access token fica só em
      memória), refresh single-flight com repetição automática da request que
      falhou, logout neste aparelho e em todos, cadastro em três passos com
      verificação de e-mail, recuperação e troca de senha, sessões ativas,
      exclusão de conta, e navegação condicional entre o stack logado e o
      deslogado. Falta só o login com Google, adiado.
- [x] **Tema** — design tokens em `src/theme/tokens.js` (fonte única para
      Tailwind e TypeScript), dark mode via variáveis CSS aplicadas em runtime
      pelo `ThemeProvider`, tema do sistema por padrão com override manual
      persistido (`useThemePreference`) e trocado na tela de conta.
- [ ] **Polimento** — guia de adoção do boilerplate.
