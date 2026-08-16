<script lang="ts">
  import type { Section } from "../../model/section-types";
  import { balancedRows, groupIntoRows } from "../../model/balanced-rows";
  import {
    addBandMember,
    memberInitials,
    removeBandMember,
    reorderBandMember,
    setPhotoEnabled,
    updateBandMember,
  } from "../../model/band-members";
  import { setBandMembersData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";
  import DragHandle from "../../components/DragHandle.svelte";
  import { DragReorderState } from "../../components/drag-reorder.svelte";
  import { NarrowViewportState } from "../../state/narrow-viewport.svelte";
  import CameraIcon from "phosphor-svelte/lib/CameraIcon";
  import TrashIcon from "phosphor-svelte/lib/TrashIcon";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "band-members" }> } =
    $props();

  function commit(data: typeof section.data) {
    setBandMembersData(rowId, section.id, data);
  }

  const drag = new DragReorderState();

  // Each card is a fixed 124px, so more than 2 per row overflows a narrow
  // phone. This reuses the same 640px breakpoint as the rest of the mobile
  // layout rather than measuring the section's actual available width, so
  // it's intentionally conservative (2 per row) across the whole mobile
  // range rather than perfectly packing e.g. a 600px-wide tablet viewport.
  const narrowViewport = new NarrowViewportState();

  const rows = $derived(
    groupIntoRows(
      section.data.members,
      balancedRows(section.data.members.length, narrowViewport.matches ? 2 : 4),
    ),
  );

  function onPhotoSelected(memberId: string, e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      commit(
        updateBandMember(section.data, memberId, {
          photoData: String(reader.result),
        }),
      );
    };
    reader.readAsDataURL(file);
  }
</script>

<label class="band-members__toggle no-print">
  <input
    type="checkbox"
    checked={section.data.photoEnabled}
    onchange={(e) =>
      commit(setPhotoEnabled(section.data, e.currentTarget.checked))}
  />
  Show member photos
</label>

{#if section.data.members.length === 0}
  <SectionEmptyHint text="No members yet — add one below." />
{/if}
<div class="band-members__grid">
  {#each rows as memberRow, rowIndex (rowIndex)}
    <div class="band-members__row" data-row-index={rowIndex}>
      {#each memberRow as member (member.id)}
        <div
          class="band-members__card"
          data-reorder-item={member.id}
          class:band-members__card--drag-over={drag.isOver(member.id)}
        >
          <div class="band-members__drag">
            <DragHandle
              onStart={() => drag.start(member.id)}
              onOver={(id) => drag.over(id)}
              onDrop={(id) => {
                const move = drag.resolveDrop(
                  section.data.members.map((m) => m.id),
                  id,
                );
                if (move)
                  commit(reorderBandMember(section.data, move[0], move[1]));
              }}
              onEnd={() => drag.end()}
            />
          </div>
          <div class="band-members__remove">
            <RemoveButton
              label="Remove member"
              onclick={() => commit(removeBandMember(section.data, member.id))}
            />
          </div>
          {#if section.data.photoEnabled}
            <div class="band-members__avatar-wrap">
              <div class="band-members__avatar">
                {#if member.photoData}
                  <img src={member.photoData} alt="" />
                  <!-- Filled: a full-circle hover overlay, so switching/
                       removing photos doesn't need permanently visible
                       controls sitting on top of the photo itself. Split
                       into two halves rather than one combined control,
                       since "change" and "remove" are different actions
                       with different consequences. -->
                  <div
                    class="band-members__avatar-edit band-members__avatar-edit--overlay no-print"
                  >
                    <label class="band-members__avatar-edit-half">
                      <CameraIcon size={16} />
                      <input
                        type="file"
                        accept="image/*"
                        class="band-members__photo-input"
                        aria-label="Change photo"
                        onchange={(e) => onPhotoSelected(member.id, e)}
                      />
                    </label>
                    <button
                      type="button"
                      class="band-members__avatar-edit-half"
                      aria-label="Remove photo"
                      onclick={() =>
                        commit(
                          updateBandMember(section.data, member.id, {
                            photoData: undefined,
                          }),
                        )}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                {:else}
                  <span>{memberInitials(member.name)}</span>
                {/if}
              </div>
              {#if !member.photoData}
                <!-- Empty: a small always-visible badge, since there's
                     nothing to hover to discover it otherwise. -->
                <label
                  class="band-members__avatar-edit band-members__avatar-edit--badge no-print"
                >
                  <CameraIcon size={12} />
                  <input
                    type="file"
                    accept="image/*"
                    class="band-members__photo-input"
                    aria-label="Add photo"
                    onchange={(e) => onPhotoSelected(member.id, e)}
                  />
                </label>
              {/if}
            </div>
          {/if}
          <input
            class="band-members__name"
            value={member.name}
            placeholder="Name"
            oninput={(e) =>
              commit(
                updateBandMember(section.data, member.id, {
                  name: e.currentTarget.value,
                }),
              )}
          />
          <input
            class="band-members__instruments"
            value={member.instruments}
            placeholder="Instrument(s)"
            oninput={(e) =>
              commit(
                updateBandMember(section.data, member.id, {
                  instruments: e.currentTarget.value,
                }),
              )}
          />
        </div>
      {/each}
    </div>
  {/each}
</div>

<button
  type="button"
  class="band-members__add no-print"
  onclick={() => commit(addBandMember(section.data))}
>
  + Add Member
</button>

<style>
  .band-members__toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--font-size-label);
    color: var(--color-text-muted);
    margin-bottom: var(--space-3);
  }

  .band-members__grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .band-members__row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-3);
  }

  .band-members__card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 124px;
    border: 1px solid var(--color-border);
    padding: var(--space-3) var(--space-2);
  }

  .band-members__card--drag-over {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
  }

  .band-members__drag {
    position: absolute;
    top: 2px;
    left: 4px;
  }

  .band-members__remove {
    position: absolute;
    top: 2px;
    right: 4px;
  }

  /*
   * A separate non-clipping wrapper around the circle itself: the circle
   * needs `overflow: hidden` to mask a photo into a circle, but the empty
   * -state edit badge deliberately overlaps the circle's own edge, so it
   * has to live outside that clipped box or it would be cut off.
   */
  .band-members__avatar-wrap {
    position: relative;
  }

  /*
   * Sized so the gap beside the circle (from its edge to the card's own
   * left/right edge) matches the gap above it (from its edge to the
   * card's top edge) — 13px each, both derived from .band-members__card's
   * fixed border/padding, not independently chosen. Bigger than a
   * decorative circle would otherwise be, so an uploaded photo actually
   * reads at this size.
   */
  .band-members__avatar {
    position: relative;
    width: 98px;
    height: 98px;
    border-radius: 50%;
    border: 1px solid var(--color-border);
    display: grid;
    place-items: center;
    overflow: hidden;
    color: var(--color-accent);
    font-family: var(--font-heading);
    font-weight: 600;
  }

  .band-members__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Visually hidden but still focusable/clickable via its wrapping
     <label> — the native file-input chrome (Choose File/no file chosen)
     is replaced entirely by the camera-icon affordance around it. */
  .band-members__photo-input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .band-members__avatar-edit {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #fff;
  }

  /* Filled state: covers the whole circle but stays invisible until
     hovered/focused, so the photo itself isn't obstructed at rest. Its two
     children (change/remove) split it evenly, side by side. */
  .band-members__avatar-edit--overlay {
    position: absolute;
    inset: 0;
    background: color-mix(in srgb, #000 45%, transparent);
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  /*
   * `flex: 1` alone isn't enough to make these two true 50/50 — a native
   * <button> carries UA default padding that a <label> doesn't, and with
   * `min-width: auto` (the flex default) that padding counts toward each
   * item's own minimum size, throwing off the split unevenly. Zeroing
   * padding here (on both, since it's one shared class) removes that
   * asymmetry.
   */
  .band-members__avatar-edit-half {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #fff;
  }

  .band-members__avatar-edit-half:not(:last-child) {
    border-right: 1px solid color-mix(in srgb, #fff 35%, transparent);
  }

  .band-members__avatar-edit-half:hover {
    background: color-mix(in srgb, #fff 15%, transparent);
  }

  .band-members__avatar:hover .band-members__avatar-edit--overlay,
  .band-members__avatar-edit--overlay:focus-within {
    opacity: 1;
  }

  /* Empty state: a small persistent badge — nothing to hover to reveal
     otherwise, since there's no photo yet to add a hover affordance to. */
  .band-members__avatar-edit--badge {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--color-accent);
    border: 2px solid var(--color-background);
  }

  .band-members__name,
  .band-members__instruments {
    width: 100%;
    text-align: center;
    border: none;
    border-bottom: 1px solid transparent;
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-label);
    padding: 2px 0;
  }

  .band-members__name {
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-body);
  }

  .band-members__instruments {
    color: var(--color-text-muted);
  }

  .band-members__add {
    margin-top: var(--space-3);
    padding: 6px var(--space-3);
    border: 1px dashed var(--color-border);
    background: transparent;
    cursor: pointer;
    font-size: var(--font-size-label);
    color: var(--color-accent);
    font-family: var(--font-heading);
    font-weight: 600;
    letter-spacing: 0.02em;
  }
</style>
