<script lang="ts">
  import IconGlyph from "./IconGlyph.svelte";
  import { ICON_KEYS, ICON_LABELS } from "../../model/icon-keys";
  import type { IconKey } from "../../model/icon-keys";

  let {
    value,
    onChange,
  }: { value: IconKey; onChange: (key: IconKey) => void } = $props();
</script>

<div class="icon-picker">
  <IconGlyph key={value} />
  <select
    class="icon-picker__select no-print"
    aria-label="Icon"
    {value}
    onchange={(e) => onChange(e.currentTarget.value as IconKey)}
  >
    {#each ICON_KEYS as key (key)}
      <option value={key}>{ICON_LABELS[key]}</option>
    {/each}
  </select>
</div>

<style>
  .icon-picker {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex: none;
  }

  .icon-picker__select {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-label);
    padding: 2px 4px;
  }
</style>
