<script lang="ts">
  import EyeIcon from "phosphor-svelte/lib/EyeIcon";
  import EyeSlashIcon from "phosphor-svelte/lib/EyeSlashIcon";

  let {
    hidden,
    noun = "row",
    onToggle,
  }: {
    hidden: boolean;
    /** What's being hidden, for the accessible name ("Hide row", "Show group"). */
    noun?: string;
    onToggle: () => void;
  } = $props();

  const label = $derived(`${hidden ? "Show" : "Hide"} ${noun}`);
</script>

<button
  type="button"
  class="row-hide-toggle no-print"
  class:row-hide-toggle--hidden={hidden}
  aria-pressed={hidden}
  aria-label={label}
  title={label}
  onclick={onToggle}
>
  {#if hidden}
    <EyeSlashIcon size={14} />
  {:else}
    <EyeIcon size={14} />
  {/if}
</button>

<style>
  .row-hide-toggle {
    display: inline-flex;
    align-items: center;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
  }

  .row-hide-toggle:hover,
  .row-hide-toggle:focus-visible,
  .row-hide-toggle--hidden {
    color: var(--color-accent);
  }
</style>
