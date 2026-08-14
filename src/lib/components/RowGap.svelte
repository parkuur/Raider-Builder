<script lang="ts">
  import PlusIcon from "phosphor-svelte/lib/PlusIcon";

  let {
    available,
    mode,
    showRule,
    addLabel = "Add Section",
    onAdd,
    onPlace,
  }: {
    available: boolean;
    mode: "move" | "copy" | null;
    showRule: boolean;
    addLabel?: string;
    onAdd: () => void;
    onPlace: () => void;
  } = $props();

  const placeLabel = $derived(
    mode === "copy" ? "Place copy here" : "Move here",
  );
</script>

<div class="row-gap no-print" class:row-gap--rule={showRule}>
  <button
    type="button"
    class="row-gap__button"
    class:row-gap__button--available={available}
    data-lift-ui
    aria-label={available ? placeLabel : addLabel}
    onclick={available ? onPlace : onAdd}
  >
    {#if available}
      {placeLabel}
    {:else}
      <PlusIcon size={12} />
      {addLabel}
    {/if}
  </button>
</div>

<style>
  .row-gap {
    position: relative;
    display: flex;
    justify-content: center;
    margin: var(--space-2) 0;
  }

  .row-gap--rule::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    border-top: 1px solid var(--color-border);
  }

  .row-gap__button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 4px var(--space-3);
    border: 1px dashed var(--color-border);
    background: var(--color-background);
    cursor: pointer;
    font-size: var(--font-size-label);
    color: var(--color-accent);
    font-family: var(--font-heading);
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .row-gap__button--available {
    width: 100%;
    border-style: solid;
    border-color: var(--color-accent);
    background: color-mix(
      in srgb,
      var(--color-accent) 12%,
      var(--color-background)
    );
  }
</style>
