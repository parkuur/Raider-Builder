# Epic 01 — Project Setup

## Goal

Stand up the repo and toolchain so every later epic can start writing app code against a working,
lint-clean, type-checked, tested build. No rider-editing features exist yet at the end of this epic.

## Scope

- Git repository initialization
- Vite + Svelte + TypeScript scaffold
- pnpm, TypeScript strict config, ESLint/Prettier, svelte-check
- Vitest and Playwright configured with a trivial smoke test each
- Folder structure from `CLAUDE.md` §3
- Base design tokens/CSS ported from the prototype's visual language
- README

## Non-goals

- Any document/section functionality (starts in epic 02)
- CI (explicitly deferred — see `CLAUDE.md` §11)

## Stories

### Story: Initialize the git repository

Turn the empty project directory into a git repo with a sensible baseline `.gitignore`.

**Acceptance criteria**
- `git init` has been run and an initial commit exists.
- `.gitignore` excludes `node_modules/`, `dist/`, `.DS_Store`, editor/OS cruft, and Playwright/Vitest
  output directories (e.g. `playwright-report/`, `test-results/`, `coverage/`).

### Story: Scaffold the Vite + Svelte + TypeScript project

Create the app skeleton using the official Vite Svelte-TS template, managed with pnpm.

**Acceptance criteria**
- `pnpm create vite` (Svelte + TypeScript template) has been run at the repo root.
- `pnpm install` succeeds; `pnpm dev` serves a working page on localhost.
- `pnpm build` produces a static `dist/` bundle; `pnpm preview` serves it.
- `package.json` scripts include `dev`, `build`, `preview`, matching `CLAUDE.md` §10.

### Story: Configure strict TypeScript, linting, and formatting

Lock in the code-quality baseline before any feature code is written.

**Acceptance criteria**
- `tsconfig.json` has `strict: true` (and related strictness flags) enabled for the whole project.
- ESLint is configured with `typescript-eslint` and `eslint-plugin-svelte`; Prettier is configured and
  wired into ESLint so there's a single source of truth for formatting.
- `svelte-check` is installed and runs cleanly against the scaffold.
- `pnpm typecheck` runs `svelte-check` + `tsc --noEmit`; `pnpm lint` runs ESLint (+ Prettier check).
  Both scripts pass on the untouched scaffold.

### Story: Configure Vitest and Playwright with smoke tests

Prove out both test pipelines described in `CLAUDE.md` §8-9 before real logic exists to test.

**Acceptance criteria**
- Vitest is configured for the project (including Svelte component testing support); `pnpm test` runs
  and passes one trivial unit test (e.g. a placeholder pure function in `src/lib/model/`).
- Playwright is configured with a `pnpm test:e2e` script that runs against the **preview** build
  (`pnpm build && pnpm preview`, per `CLAUDE.md` §9), not the dev server.
- One trivial Playwright spec passes (e.g. the scaffolded page loads and shows expected text).
- `tests/unit/` and `tests/e2e/` exist as the homes for these suites, per `CLAUDE.md` §3.

### Story: Establish the source folder structure

Create the directory skeleton from `CLAUDE.md` §3 so later epics have an obvious place to put code.

**Acceptance criteria**
- `src/lib/components/`, `src/lib/sections/`, `src/lib/state/`, `src/lib/model/` exist (each with a
  placeholder/barrel file or `.gitkeep` as needed so git tracks the empty structure).
- Structure matches `CLAUDE.md` §3 exactly; any deviation is reflected back into `CLAUDE.md` in the
  same commit.

### Story: Port base design tokens and global styles

Establish the visual foundation (fonts, colors, spacing) referenced throughout `CLAUDE.md`, based on
the prototype's visual language, so section work in later epics doesn't invent its own palette.

**Acceptance criteria**
- Global CSS custom properties exist for the core palette (background `#f2f2f3`, text `#1d1f20`,
  accent `#5980a6`), the Barlow / Barlow Condensed font pairing, and a base spacing scale.
- Tokens are defined once (e.g. `src/app.css` or a dedicated `tokens.css`) and imported globally, not
  redefined per component.

### Story: Write the README

Document how to get the project running for a future contributor (including future-you).

**Acceptance criteria**
- `README.md` covers: prerequisites (Node, pnpm/corepack), install, `pnpm dev`, `pnpm build`, running
  tests (`pnpm test`, `pnpm test:e2e`), and a one-line project description.
- Links to `CLAUDE.md` for development practices and `docs/backlog/` for the feature roadmap.
