<script lang="ts">
  import type { Section } from "../../model/section-types";
  import { balancedRows, groupIntoRows } from "../../model/balanced-rows";
  import {
    addBandMember,
    memberInitials,
    removeBandMember,
    setPhotoEnabled,
    updateBandMember,
  } from "../../model/band-members";
  import { setBandMembersData } from "../../state/document.svelte";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "band-members" }> } =
    $props();

  function commit(data: typeof section.data) {
    setBandMembersData(rowId, section.id, data);
  }

  const rows = $derived(
    groupIntoRows(
      section.data.members,
      balancedRows(section.data.members.length),
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

<div class="band-members__grid">
  {#each rows as memberRow, rowIndex (rowIndex)}
    <div class="band-members__row" data-row-index={rowIndex}>
      {#each memberRow as member (member.id)}
        <div class="band-members__card">
          <button
            type="button"
            class="band-members__remove no-print"
            aria-label="Remove member"
            onclick={() => commit(removeBandMember(section.data, member.id))}
          >
            ×
          </button>
          <div class="band-members__avatar">
            {#if section.data.photoEnabled && member.photoData}
              <img src={member.photoData} alt="" />
            {:else}
              <span>{memberInitials(member.name)}</span>
            {/if}
          </div>
          {#if section.data.photoEnabled}
            <input
              type="file"
              accept="image/*"
              class="band-members__photo-input no-print"
              aria-label="Upload photo"
              onchange={(e) => onPhotoSelected(member.id, e)}
            />
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

  .band-members__remove {
    position: absolute;
    top: 2px;
    right: 4px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: var(--font-size-body);
    line-height: 1;
  }

  .band-members__avatar {
    width: 60px;
    height: 60px;
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

  .band-members__photo-input {
    width: 100%;
    font-size: 9px;
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
