<script lang="ts">
  import { sectionRegistry } from "../sections/registry";
  import {
    removeSection,
    setSectionTitle,
    toggleSectionHidden,
  } from "../state/document.svelte";
  import type { Section } from "../model/section-types";
  import type { SectionRegistryEntry } from "../sections/registry";
  import LinkIcon from "phosphor-svelte/lib/LinkIcon";
  import ArrowsOutCardinalIcon from "phosphor-svelte/lib/ArrowsOutCardinalIcon";
  import EyeIcon from "phosphor-svelte/lib/EyeIcon";
  import EyeSlashIcon from "phosphor-svelte/lib/EyeSlashIcon";
  import CopyIcon from "phosphor-svelte/lib/CopyIcon";
  import TrashIcon from "phosphor-svelte/lib/TrashIcon";

  let {
    rowId,
    section,
    sectionCount,
    showPairBadge,
    liftedMode,
    onToggleMoveLift,
    onToggleCopyLift,
  }: {
    rowId: string;
    section: Section;
    sectionCount: number;
    showPairBadge: boolean;
    liftedMode: "move" | "copy" | null;
    onToggleMoveLift: () => void;
    onToggleCopyLift: () => void;
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
  const moveLabel = $derived(
    sectionCount === 2 ? "Move or unpair this section" : "Move this section",
  );
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
  {#if showPairBadge}
    <div class="section-frame__pair-badge no-print" aria-hidden="true">
      <LinkIcon size={12} />
    </div>
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
   * Sits on top of the paired-divider rule (RowView.svelte), which is a
   * full-height/width border, not shortened to meet it — offset in from
   * the line's true end (rather than centered exactly on it) by 5mm plus
   * its own radius, so a 5mm tail of the line still shows past the badge
   * down to the actual corner. Anchoring to this box's own corner, rather
   * than to the shared row container, keeps the badge correctly on the
   * rule regardless of how tall either paired section actually is.
   */
  .section-frame__pair-badge {
    position: absolute;
    left: 0;
    bottom: calc(5mm + 10px);
    transform: translate(-50%, 50%);
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1.5px solid color-mix(in srgb, var(--color-accent) 55%, transparent);
    background: var(--color-background);
    color: var(--color-accent);
  }

  @media screen and (max-width: 640px) {
    /*
     * Same idea rotated 90°: the mobile stacked divider is a full-width top
     * border, and the badge sits offset in from its left end by the same
     * 5mm-plus-radius amount, leaving a 5mm tail to its left.
     */
    .section-frame__pair-badge {
      left: calc(5mm + 10px);
      top: 0;
      bottom: auto;
      transform: translate(-50%, -50%);
    }
  }
</style>
