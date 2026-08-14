<script lang="ts">
  import { sectionRegistry } from "../sections/registry";
  import {
    removeSection,
    setSectionTitle,
    toggleSectionHidden,
  } from "../state/document.svelte";
  import type { Section } from "../model/section-types";
  import type { SectionRegistryEntry } from "../sections/registry";
  import ArrowsOutCardinalIcon from "phosphor-svelte/lib/ArrowsOutCardinalIcon";
  import EyeIcon from "phosphor-svelte/lib/EyeIcon";
  import EyeSlashIcon from "phosphor-svelte/lib/EyeSlashIcon";
  import CopyIcon from "phosphor-svelte/lib/CopyIcon";
  import TrashIcon from "phosphor-svelte/lib/TrashIcon";

  let {
    rowId,
    section,
    liftedMode,
    swapAvailable,
    onToggleMoveLift,
    onToggleCopyLift,
    onSwapPlace,
  }: {
    rowId: string;
    section: Section;
    liftedMode: "move" | "copy" | null;
    swapAvailable: boolean;
    onToggleMoveLift: () => void;
    onToggleCopyLift: () => void;
    onSwapPlace: () => void;
  } = $props();

  // Indexing a mapped-type registry by a widened `SectionType` key yields a
  // union of per-key entry types, which TS can't recombine into one entry
  // generic over the full union — safe to widen back explicitly since
  // `section` and the looked-up entry are always keyed by the same runtime
  // `type`.
  const Entry = $derived(sectionRegistry[section.type] as SectionRegistryEntry);
  // A stable name with `aria-pressed` conveying the toggle state (the
  // standard toggle-button pattern) rather than a name that itself changes
  // to "Cancel move" when active — a changing name breaks identifying the
  // same control across the toggle, for assistive tech and tests alike.
  const moveLabel = "Move this section";
  const copyLabel = "Copy this section";
</script>

<div
  class="section-frame"
  class:hidden-from-print={section.hidden}
  class:section-frame--lifted={liftedMode !== null}
  data-section-type={section.type}
>
  <div class="section-frame__head">
    {#if !Entry.hideTitle}
      <input
        class="section-frame__title"
        value={section.title}
        oninput={(e) =>
          setSectionTitle(rowId, section.id, e.currentTarget.value)}
        placeholder="Section title"
      />
    {/if}
    <div class="section-frame__actions no-print">
      <button
        type="button"
        class="section-frame__action"
        class:section-frame__action--active={liftedMode === "move"}
        data-lift-ui
        aria-pressed={liftedMode === "move"}
        aria-label={moveLabel}
        title={moveLabel}
        onclick={onToggleMoveLift}
      >
        <ArrowsOutCardinalIcon size={16} />
      </button>
      <button
        type="button"
        class="section-frame__action"
        aria-pressed={section.hidden}
        aria-label={section.hidden ? "Show section" : "Hide section"}
        title={section.hidden ? "Show section" : "Hide section"}
        onclick={() => toggleSectionHidden(rowId, section.id)}
      >
        {#if section.hidden}
          <EyeSlashIcon size={16} />
        {:else}
          <EyeIcon size={16} />
        {/if}
      </button>
      <button
        type="button"
        class="section-frame__action"
        class:section-frame__action--active={liftedMode === "copy"}
        data-lift-ui
        aria-pressed={liftedMode === "copy"}
        aria-label={copyLabel}
        title={copyLabel}
        onclick={onToggleCopyLift}
      >
        <CopyIcon size={16} />
      </button>
      <button
        type="button"
        class="section-frame__action"
        aria-label="Delete section"
        title="Delete section"
        onclick={() => removeSection(rowId, section.id)}
      >
        <TrashIcon size={16} />
      </button>
    </div>
  </div>
  <div class="section-frame__body">
    <Entry.component {rowId} {section} />
  </div>
  {#if swapAvailable}
    <button
      type="button"
      class="section-frame__swap-target no-print"
      data-lift-ui
      aria-label="Swap places with this section"
      title="Swap places with this section"
      onclick={onSwapPlace}
    >
      Swap places
    </button>
  {/if}
</div>

<style>
  .section-frame {
    flex: 1;
    min-width: 0;
    position: relative;
    padding: var(--space-4) 0;
  }

  .section-frame.hidden-from-print {
    opacity: 0.6;
  }

  .section-frame--lifted {
    opacity: 0.5;
  }

  .section-frame__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .section-frame__title {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-section-title);
    color: var(--color-text);
    padding: 2px 0;
  }

  .section-frame__actions {
    display: flex;
    gap: var(--space-1);
    flex: none;
  }

  .section-frame__action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
  }

  .section-frame__action--active {
    border-color: var(--color-accent);
    color: var(--color-background);
    background: var(--color-accent);
  }

  /*
   * Covers this section's own box so dropping the lifted candidate
   * anywhere on it reads as "swap with this section," rather than needing
   * a separate narrow drop target — matches the split-edge-slot/column-gap
   * "available" styling (solid accent border/tint) so every drop-target
   * affordance reads as the same interaction language.
   */
  .section-frame__swap-target {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-accent);
    /* Mostly opaque (unlike SplitEdgeSlot's lighter tint) so the section's
       own content underneath doesn't show through and clash with the label. */
    background: color-mix(
      in srgb,
      var(--color-background) 92%,
      var(--color-accent) 8%
    );
    cursor: pointer;
    font-size: var(--font-size-label);
    color: var(--color-accent);
    font-family: var(--font-heading);
    font-weight: 600;
    letter-spacing: 0.02em;
  }
</style>
