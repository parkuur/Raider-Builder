<script lang="ts">
  import PlusIcon from "phosphor-svelte/lib/PlusIcon";

  let {
    available,
    mode,
    onAddClick,
    onPlaceClick,
  }: {
    available: boolean;
    mode: "move" | "copy" | null;
    onAddClick: () => void;
    onPlaceClick: () => void;
  } = $props();

  const placeLabel = $derived(
    mode === "copy" ? "Place copy here to split" : "Move here to split",
  );
</script>

<div
  class="split-edge-slot no-print"
  class:split-edge-slot--available={available}
>
  <button
    type="button"
    class="split-edge-slot__button"
    data-lift-ui
    aria-label={available ? placeLabel : "Add split section"}
    title={available ? placeLabel : "Add split section"}
    onclick={available ? onPlaceClick : onAddClick}
  >
    <PlusIcon size={14} />
  </button>
</div>

<style>
  .split-edge-slot {
    flex: 0 0 auto;
    align-self: stretch;
    display: flex;
  }

  .split-edge-slot__button {
    flex: 1;
    width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--color-border);
    background: transparent;
    cursor: pointer;
    color: var(--color-accent);
  }

  .split-edge-slot--available .split-edge-slot__button {
    border-style: solid;
    border-color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  }

  @media screen and (max-width: 640px) {
    .split-edge-slot {
      align-self: auto;
      width: 100%;
    }

    .split-edge-slot__button {
      width: 100%;
      min-height: 40px;
    }
  }
</style>
