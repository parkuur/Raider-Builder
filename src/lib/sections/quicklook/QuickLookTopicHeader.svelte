<script lang="ts">
  import IconPicker from "../../components/icons/IconPicker.svelte";
  import type { IconKey } from "../../model/icon-keys";

  let {
    iconKey,
    title,
    onIconChange,
    onTitleChange,
    onRemove,
  }: {
    iconKey: IconKey;
    title: string;
    onIconChange: (key: IconKey) => void;
    onTitleChange: (title: string) => void;
    onRemove: () => void;
  } = $props();
</script>

<div class="quicklook-topic-header">
  <IconPicker value={iconKey} onChange={onIconChange} />
  <input
    class="quicklook-topic-header__title"
    value={title}
    placeholder="Topic title"
    oninput={(e) => onTitleChange(e.currentTarget.value)}
  />
  <button
    type="button"
    class="quicklook-topic-header__remove no-print"
    title="Remove"
    onclick={onRemove}
  >
    Remove
  </button>
</div>

<style>
  .quicklook-topic-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .quicklook-topic-header__title {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-body);
    color: var(--color-text);
    padding: 2px 0;
  }

  .quicklook-topic-header__remove {
    flex: none;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-label);
    padding: 4px var(--space-2);
    cursor: pointer;
  }
</style>
