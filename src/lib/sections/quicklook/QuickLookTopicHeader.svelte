<script lang="ts">
  import type { Snippet } from "svelte";
  import IconPicker from "../../components/icons/IconPicker.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";
  import type { IconKey } from "../../model/icon-keys";

  let {
    iconKey,
    title,
    onIconChange,
    onTitleChange,
    onRemove,
    leading,
    trailing,
  }: {
    iconKey: IconKey;
    title: string;
    onIconChange: (key: IconKey) => void;
    onTitleChange: (title: string) => void;
    onRemove: () => void;
    leading?: Snippet;
    trailing?: Snippet;
  } = $props();
</script>

<div class="quicklook-topic-header">
  {#if leading}{@render leading()}{/if}
  <IconPicker value={iconKey} onChange={onIconChange} />
  <input
    class="quicklook-topic-header__title"
    value={title}
    placeholder="Topic title"
    oninput={(e) => onTitleChange(e.currentTarget.value)}
  />
  {#if trailing}{@render trailing()}{/if}
  <RemoveButton label="Remove topic" onclick={onRemove} />
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
</style>
