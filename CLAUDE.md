# CLAUDE.md

Repo rules and development practices for the Technical Rider Editor. Read this before making changes.

## 1. Project overview

A client-side editor for band technical riders: a document made of a header plus a vertical stack of
draggable sections (Channel List, Monitor List, Band Members, Stage Map, Requirements, Equipment,
Contacts, Quick Look). Users add/reorder/edit sections, save/load the document as a local JSON file,
and print/export to PDF via the browser.

A prior design-tool prototype exists at
`/Users/kuuraparkkola/Downloads/Band Technical Raider Editor/Technical Rider Editor.dc.html`. It is
**design reference only** — useful for visual language (fonts, spacing, the `#5980a6` accent, section
layouts, icon sets) and for the feature set it demonstrates. None of its code is a dependency, and
several of its behaviors are explicitly *not* to be copied — see §6.

## 2. Stack

- **TypeScript + Svelte + Vite.** Pure client-side static app — no backend, no server, no database.
- **pnpm** as the package manager.
- `vite dev` / `vite preview` serve the app over localhost; `vite build` produces a static bundle
  deployable anywhere (or opened locally).
- No Python, no uv, anywhere in this repo. The app has no backend features to justify a second
  language/toolchain.

Why no backend: everything the app does — editing a document, saving/loading it, printing it — is a
local, single-user, client-side concern. Adding a server would add deployment and state-sync
complexity with no corresponding feature need.

## 3. Repo structure

```
src/
  lib/
    components/   shared presentational components (buttons, icon picker, drag handles, ...)
    sections/     one folder per section type (channels/, monitors/, members/, stagemap/,
                   requirements/, equipment/, contacts/, quicklook/) — each holds its Svelte
                   component(s) plus any section-specific view logic
    state/         the document store (Svelte store/runes) and mutation actions
    model/         types + pure functions: document/section/row shapes, numbering, pairing,
                   balanced-grid layout, z-order — framework-independent and unit-testable
                   without mounting a component
tests/
  unit/            Vitest specs, mirroring src/lib/model structure
  e2e/             Playwright specs
docs/
  backlog/         epic files (this document's companion planning docs)
```

Any new section type or shared behavior should have an obvious home in this tree before code is
written — if it doesn't fit, that's a signal to reconsider the structure, not to bolt it on.

## 4. Section-type extensibility pattern

New section types are added through **one registry** — a single module mapping section `type` to its
default-data factory, display metadata (label, half-width flag), and component — not by adding a new
branch to a switch/if-chain that's repeated across multiple files.

This is a direct lesson from the prototype: its `buildCellView` function grew one `if (cell.type ===
...)` block per section type in a single 900-line method, mixing view-model construction for every
section together. Anything touching one section type risked touching all of them. The registry pattern
keeps each section type's logic contained to its own file.

## 5. State management rules

- One central document store holds the header and the row/section tree.
- All mutations (add/remove/duplicate/reorder rows, edit a field, toggle a flag, pair sections, etc.)
  go through pure, named functions in `src/lib/model/`, not inline closures built at render time.
- Components call these functions; they do not reimplement mutation logic themselves.

This matters because the prototype's hardest bugs (stereo-channel numbering, stage-map stacking order)
came from logic embedded in per-render closures inside a 900-line view-model builder — nothing about
that logic was unit-testable or reusable, so it was rebuilt-by-hand-in-place in a way that dropped
edge cases silently. Pulling this logic out into named, pure, unit-tested functions is how §6's
invariants stay enforced as the app grows.

## 6. Data-model invariants (lessons from the prototype)

These are directly targeted at four confirmed defects in the reference prototype. Do not reintroduce
their root causes:

- **A relationship between two rows, if a data model has one at all, must be a first-class link
  between two specific row IDs** — never inferred from array adjacency or a single boolean flag with a
  "skip the next label" counter. The prototype's `numberWithLinks` treated `linked: true` on a row as
  "blank whatever row happens to come next," which breaks the moment rows are reordered, one side of a
  pair is deleted, or a `linked` row has no real partner. Where a two-row link is used (the Monitor
  List's Pair/Unpair), the model must know, explicitly, which two rows are paired, and degrade
  predictably (never silently) when a pairing is incomplete. The Channel List sidesteps this problem
  class entirely: stereo is a `stereo: boolean` on a single row, and a stereo row simply claims two
  consecutive numbers (e.g. "3–4") in `numberChannelRows` — there is no second row to keep in sync, so
  reordering or deleting rows can never desynchronize a pairing that was never created.
- **Stacking/z-order is an explicit field on each item, independent of array or creation order.** The
  prototype always appended new stage-map items to the end of the array and rendered in array order,
  so an item added earlier stayed visually beneath everything added later, permanently — clicking or
  dragging an item never brought it to front. Any freeform/canvas item list needs its own order field
  that a "bring to front" function can update on interaction.
- **Two components that render the same concept must share one presentational component**, not two
  hand-maintained copies. The prototype's Quick Look had separate render paths for "row" topics and
  "table" topics; only the row path rendered an icon, and table topics didn't even carry an `iconKey`
  field, so they drifted apart both visually and structurally. Shared structure belongs in shared code.
- **Layout that needs "balanced" grouping is computed by a pure function, not left to CSS wrapping.**
  The prototype's Band Members grid used plain `flex-wrap`, so row composition was whatever the
  container's pixel width happened to produce. Where the product intent is a specific row-count/
  per-row-count rule (e.g. rows differing by at most one item), that rule must be a named, tested
  function, not an emergent property of CSS.

## 7. Coding standards

- TypeScript strict mode; no `any` (use `unknown` + narrowing, or a proper type).
- Svelte components: typed props, prefer Svelte 5 runes for local/component state; shared/document
  state lives in `src/lib/state/`, not scattered `let` bindings.
- Styling: plain CSS with CSS custom properties for design tokens (colors, spacing, type scale) ported
  from the prototype's visual language. No CSS framework unless a later story justifies the need.
- Keep section components focused on presentation; put branching/derivation logic in `model/`.

## 8. Unit/component testing requirements

- Every pure function in `src/lib/model/` (numbering, pairing, balanced-grid layout, z-order, document
  mutations) needs Vitest unit tests, including edge cases — not just the happy path.
- New logic without a test is not done, regardless of whether the UI "looks right" manually.

## 9. End-to-end testing (Playwright)

E2e testing gets its own standing requirement, separate from unit testing:

- Every section type has at least one Playwright spec that drives it through the real browser UI
  (add the section, edit its fields, remove/reorder), not just a component-level test.
- A standing e2e suite covers full user flows: add/reorder/pair rows, JSON save → load round-trip
  (data survives unchanged), and print-preview layout (via Playwright's print-media emulation).
- The four fixed defects from §6 each get a regression e2e spec exercising them through real
  interaction, not just their unit-level pure functions:
  - stereo-pair numbering survives reorder/deletion in the Channel and Monitor lists
  - Band Members row balance holds at several member counts
  - Stage Map click-to-front ordering works regardless of creation order
  - Quick Look row and table topics render icons consistently
- Any story that touches drag-and-drop, canvas positioning, or a multi-step flow must add or extend
  an e2e spec as part of its definition of done — unit tests alone are not sufficient sign-off for
  that class of change.
- E2e specs run against the Vite **preview** build (`pnpm build` + `pnpm preview`), not the dev
  server, so they verify what actually ships.

## 10. Commands

| Command | Purpose |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start the localhost dev server |
| `pnpm build` | Production static build |
| `pnpm preview` | Serve the production build locally |
| `pnpm typecheck` | `svelte-check` + `tsc --noEmit` |
| `pnpm lint` | ESLint + Prettier check |
| `pnpm test` | Vitest unit/component tests |
| `pnpm test:e2e` | Playwright e2e tests (against the preview build) |

## 11. Git / commit practices

- Conventional-Commits-style messages (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, ...).
- Small, focused commits — one logical change per commit.
- Each epic in `docs/backlog/` is worked on its own branch (e.g. `epic-03-full-width-sections`),
  branched from `main`. Stories within an epic are commits on that branch, not separate branches.
  When the epic's stories are done, open a PR from the epic branch back to `main` for review before
  merging.
- **Commit each story as soon as it's done — do not batch work across stories and split it into
  commits afterward.** Finish a story, run the relevant local checks (§10) against it, commit it,
  then move to the next story. Reconstructing a clean per-story history after the fact (e.g. by
  writing files in one pass then editing them back down to intermediate states just to split the
  diff into commits) is wasted work and wasted usage — the history should be a byproduct of the
  order work actually happened in, not a reenactment of it. This applies inside a single working
  session as much as across sessions: don't treat "the epic branch" as one big change to commit at
  the end.
- No direct pushes to `main` without review, even solo; open a PR against yourself if you want a
  reviewable diff and history. There is no CI gate (see below), so these practices are self-enforced.
- No GitHub Actions / CI pipeline for now. Local scripts (§10) are the only gate — run them before
  committing, since nothing will catch a regression for you otherwise. CI can be added later as its
  own backlog story if the project grows to need it.

## 12. Definition of done

A story is done when:

1. It builds clean (`pnpm build`).
2. It typechecks (`pnpm typecheck`).
3. It lints clean (`pnpm lint`).
4. New logic has Vitest unit tests; new interactive/drag/multi-step flows have Playwright e2e coverage.
5. It has been manually exercised in the browser via the dev server.
6. The acceptance criteria listed in its `docs/backlog/epic-*.md` story are all satisfied.
