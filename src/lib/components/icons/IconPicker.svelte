<script lang="ts">
  import IconGlyph from "./IconGlyph.svelte";
  import { ICON_KEYS, ICON_LABELS } from "../../model/icon-keys";
  import type { IconKey } from "../../model/icon-keys";

  let {
    value,
    onChange,
  }: { value: IconKey; onChange: (key: IconKey) => void } = $props();

  let open = $state(false);

  function pick(key: IconKey): void {
    onChange(key);
    open = false;
  }
</script>

<div class="icon-picker">
  <button
    type="button"
    class="icon-picker__trigger"
    aria-haspopup="true"
    aria-expanded={open}
    title={`Icon: ${ICON_LABELS[value]}`}
    onclick={() => (open = !open)}
  >
    <IconGlyph key={value} />
  </button>
  {#if open}
    <div
      class="icon-picker__backdrop no-print"
      role="button"
      tabindex="-1"
      onclick={() => (open = false)}
      onkeydown={(e) => e.key === "Escape" && (open = false)}
    ></div>
    <div
      class="icon-picker__popover no-print"
      role="listbox"
      aria-label="Choose icon"
    >
      {#each ICON_KEYS as key (key)}
        <button
          type="button"
          class="icon-picker__option"
          class:icon-picker__option--active={key === value}
          role="option"
          aria-selected={key === value}
          aria-label={ICON_LABELS[key]}
          title={ICON_LABELS[key]}
          onclick={() => pick(key)}
        >
          <IconGlyph {key} />
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .icon-picker {
    position: relative;
    display: inline-flex;
    flex: none;
  }

  .icon-picker__trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 2px;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
  }

  .icon-picker__backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: transparent;
  }

  .icon-picker__popover {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 101;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2px;
    padding: var(--space-2);
    border: 1px solid var(--color-border);
    background: var(--color-background);
    box-shadow: 0 4px 12px color-mix(in srgb, #000 25%, transparent);
  }

  .icon-picker__option {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
  }

  .icon-picker__option:hover {
    border-color: var(--color-border);
  }

  .icon-picker__option--active {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
</style>
