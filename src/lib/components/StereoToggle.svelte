<script lang="ts">
  let {
    active,
    onToggle,
  }: {
    active: boolean;
    onToggle: () => void;
  } = $props();
</script>

<button
  type="button"
  class="stereo-toggle"
  class:stereo-toggle--active={active}
  aria-pressed={active}
  title={active ? "Switch to mono" : "Switch to stereo"}
  onclick={onToggle}
>
  {active ? "Stereo" : "Mono"}
</button>

<style>
  .stereo-toggle {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
    font-size: var(--font-size-label);
    padding: 3px 6px;
    cursor: pointer;
  }

  .stereo-toggle--active {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
</style>
