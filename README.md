# Technical Rider Editor

A client-side editor for band technical riders — a document made of a header plus a draggable stack
of sections (Channel List, Monitor List, Band Members, Stage Map, Requirements, Equipment, Contacts,
Quick Look). Add, reorder, and edit sections, save/load the document as a local JSON file, and
print/export to PDF via the browser. Pure client-side static app — no backend.

## Prerequisites

- [Node.js](https://nodejs.org/) (v22 or later recommended)
- [pnpm](https://pnpm.io/) — install via [Corepack](https://nodejs.org/api/corepack.html)
  (`corepack enable`) or `npm install -g pnpm`

## Install

```bash
pnpm install
```

## Develop

```bash
pnpm dev
```

Serves the app on localhost with hot module reload.

## Build

```bash
pnpm build      # production static build into dist/
pnpm preview    # serve the production build locally
```

## Test

```bash
pnpm typecheck  # svelte-check + tsc --noEmit
pnpm lint       # ESLint + Prettier check
pnpm test       # Vitest unit/component tests
pnpm test:e2e   # Playwright e2e tests, against the built preview (not the dev server)
```

## Learn more

- [`CLAUDE.md`](./CLAUDE.md) — repo rules, architecture, and development practices
- [`docs/backlog/`](./docs/backlog/) — feature roadmap, organized as epics and stories
