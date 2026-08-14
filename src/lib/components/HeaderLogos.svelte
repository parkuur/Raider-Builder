<script lang="ts">
  import type { HeaderLogo } from "../model/header-logos";
  import { MAX_HEADER_LOGOS } from "../model/header-logos";
  import { computeLogoHeight } from "../model/logo-layout";
  import RemoveButton from "./RemoveButton.svelte";
  import PlusIcon from "phosphor-svelte/lib/PlusIcon";

  let {
    logos,
    maxHeight,
    maxTotalWidth,
    onAdd,
    onRemove,
  }: {
    logos: HeaderLogo[];
    maxHeight: number;
    maxTotalWidth: number;
    onAdd: (dataUrl: string) => void;
    onRemove: (id: string) => void;
  } = $props();

  let fileInput: HTMLInputElement | undefined = $state();
  let aspectRatios: Record<string, number> = $state({});

  const sharedHeight = $derived(
    computeLogoHeight(
      logos.map((l) => aspectRatios[l.id] ?? 1),
      maxHeight,
      maxTotalWidth,
    ),
  );

  function onImageLoad(logoId: string, e: Event): void {
    const img = e.currentTarget as HTMLImageElement;
    if (img.naturalHeight === 0) return;
    aspectRatios = {
      ...aspectRatios,
      [logoId]: img.naturalWidth / img.naturalHeight,
    };
  }

  function onFileSelected(e: Event): void {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onAdd(String(reader.result));
    reader.readAsDataURL(file);
  }
</script>

<div class="header-logos">
  {#if logos.length < MAX_HEADER_LOGOS}
    <input
      bind:this={fileInput}
      type="file"
      accept="image/*"
      class="header-logos__file-input no-print"
      aria-label="Add logo"
      onchange={onFileSelected}
    />
    <button
      type="button"
      class="header-logos__add no-print"
      aria-label="Add logo"
      title="Add logo"
      onclick={() => fileInput?.click()}
    >
      <PlusIcon size={14} />
    </button>
  {/if}
  {#each logos as logo (logo.id)}
    <div class="header-logos__item">
      <img
        src={logo.dataUrl}
        alt="Logo"
        style:height="{sharedHeight}px"
        onload={(e) => onImageLoad(logo.id, e)}
      />
      <div class="header-logos__remove no-print">
        <RemoveButton label="Remove logo" onclick={() => onRemove(logo.id)} />
      </div>
    </div>
  {/each}
</div>

<style>
  .header-logos {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: none;
  }

  .header-logos__file-input {
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

  .header-logos__add {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px dashed var(--color-border);
    background: transparent;
    color: var(--color-accent);
    cursor: pointer;
  }

  .header-logos__item {
    position: relative;
    display: flex;
    align-items: center;
  }

  .header-logos__item img {
    display: block;
    width: auto;
    object-fit: contain;
  }

  .header-logos__remove {
    position: absolute;
    top: -10px;
    right: -10px;
  }
</style>
