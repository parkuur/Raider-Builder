<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    open,
    title,
    onClose,
    children,
  }: {
    open: boolean;
    title?: string;
    onClose: () => void;
    children: Snippet;
  } = $props();
</script>

{#if open}
  <div
    class="modal-backdrop no-print"
    role="button"
    tabindex="-1"
    onclick={onClose}
    onkeydown={(e) => e.key === "Escape" && onClose()}
  >
    <div
      class="modal"
      role="dialog"
      aria-label={title}
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      {#if title}
        <div class="modal__heading">{title}</div>
      {/if}
      {@render children()}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: var(--space-4);
    background: color-mix(in srgb, #000 45%, transparent);
  }

  .modal {
    width: min(460px, 100%);
    background: var(--color-background);
    border: 1px solid var(--color-border);
    padding: var(--space-5);
  }

  .modal__heading {
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-section-title);
    margin-bottom: var(--space-4);
  }
</style>
