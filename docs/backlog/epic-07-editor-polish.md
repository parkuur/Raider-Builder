# Epic 07 — Editor Polish

## Goal

A batch of small, mostly-unrelated fixes and improvements accumulated during use of the editor: a
branding tweak, a print-layout bug, pair-badge polish, a couple of UI/visual refinements, a pairing
restriction fix, two Stage Map marker fixes, and two new section types. Grouped into one epic because
each item is too small to justify its own epic, not because they share a theme.

## Scope

- Header logo: swap image asset, move it into the sticky top bar
- Print-only layout bug: hidden sections leaving a dangling pair divider or blank row space
- Pair badge: spacing off the end of the divider, no content overlap, hidden from print
- Add Section menu: replace the "(half)" text tag with an icon
- Section title font size
- Allow copying a solo half-width section to pair with a copy of itself
- Stage Map: rectangular (half-height) XLR/DI markers
- Stage Map: new "Name" marker category with an editable, auto-fitting center label
- New section type: Page Break
- New section type: Text (including half-width support)

## Non-goals

- Any other section type's content/behavior beyond what's listed above
- Broader print-layout rework beyond the specific hidden-section/pair-divider bug

## Stories

### Story: Move the header logo into the top bar

Swap the header logo image asset and relocate it from the document header into the sticky top bar,
alongside the save/load/print controls.

**Acceptance criteria**
- The new logo image renders in the top bar, not the document header.
- The logo keeps its existing external link/label.
- Manually verified at desktop and mobile widths.

### Story: Fix print artifacts on hidden/paired sections

Hiding a section must not leave a dangling pair-divider line on its still-visible former partner, and a
row whose sections are all hidden must not occupy blank space in print.

**Acceptance criteria**
- In print, a paired section whose partner is hidden shows no leftover divider border.
- In print, a row with no visible sections (solo hidden, or both sides of a pair hidden) contributes no
  space.
- Regression covered by a Playwright print-media spec.

### Story: Pair badge spacing, overlap, and print visibility

The link badge between paired sections sits with a small gap from the end of the divider, never
overlaps either section's content, and never appears in print.

**Acceptance criteria**
- The badge sits ~5mm short of the divider's end rather than flush at the corner.
- The badge does not visually overlap live content in either paired section, including when the two
  sections differ significantly in height.
- The badge carries `no-print` and never appears in print output, regardless of hidden state.

### Story: Replace the "(half)" text tag with an icon

The Add Section menu's half-width indicator becomes a Phosphor icon instead of literal "(half)" text.

**Acceptance criteria**
- Half-width entries in the Add Section menu show the `SquareSplitHorizontal` icon instead of text.
- The icon carries an accessible label for screen readers.

### Story: Bigger section titles

Section titles render at a larger, more prominent size.

**Acceptance criteria**
- The shared section-title font-size token is increased from 18px to 22px, applying uniformly across
  every section type.

### Story: Allow copying a solo half-width section to pair with itself

A lone half-width section can be copied and the copy paired directly next to the original in the same
row.

**Acceptance criteria**
- Lifting a solo half-width section for copy and dropping it on its own row's pair slot produces a row
  containing the original and a copy, side by side.
- Move mode is unaffected — pairing a moved section onto its own row remains blocked.
- Covered by a unit test on the underlying mutation and a Playwright e2e case.

### Story: Stage Map — rectangular XLR/DI markers

XLR and DI markers render as half-height rectangles instead of squares/circles.

**Acceptance criteria**
- Both XLR and DI markers use the same rectangular shape, half as tall as they are wide.
- Covered by a Playwright assertion on rendered dimensions.

### Story: Stage Map — "Name" marker category

A new marker category whose center label is directly editable, auto-fitting text, rather than a fixed
category abbreviation.

**Acceptance criteria**
- A "Name" marker is available in the Stage Map palette.
- Its center text is an editable input that auto-shrinks to fit, using the existing `autoFitText` action.
- It has the same editable label-below field every other marker already has.
- Covered by a unit test on its data mutation and a Playwright e2e case.

### Story: New section type — Page Break

A section type that forces a page break in print and carries no editable content.

**Acceptance criteria**
- Page Break is offered in the Add Section menu, registered per the section registry pattern.
- It shows no title input (nothing to title).
- In print, content following it starts on a new page.
- Covered by a Playwright e2e case verifying the page-break behavior.

### Story: New section type — Text

A section type holding free-form text with an optional title, supporting half-width pairing.

**Acceptance criteria**
- Text sections can be added, edited, and support half-width pairing like Contacts/Quick Look.
- If no title is given, no title element/space is shown in print.
- Data round-trips through JSON save/load.
- Covered by a Playwright e2e case.
