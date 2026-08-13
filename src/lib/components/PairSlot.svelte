<script lang="ts">
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
    mode === "copy" ? "Place copy here to pair" : "Move here to pair",
  );
</script>

<div class="pair-slot no-print" class:pair-slot--available={available}>
  <button
    type="button"
    class="pair-slot__button"
    data-lift-ui
    aria-label={available ? placeLabel : "Add paired section"}
    onclick={available ? onPlaceClick : onAddClick}
  >
    {available ? placeLabel : "+ Add Section"}
  </button>
</div>

<style>
  .pair-slot {
    flex: 1;
    min-width: 0;
    display: flex;
  }

  .pair-slot__button {
    flex: 1;
    min-height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--color-border);
    background: transparent;
    cursor: pointer;
    font-size: var(--font-size-label);
    color: var(--color-accent);
    font-family: var(--font-heading);
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .pair-slot--available .pair-slot__button {
    border-style: solid;
    border-color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  }
</style>
