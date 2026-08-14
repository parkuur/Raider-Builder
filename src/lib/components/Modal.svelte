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

<!--
  Escape is handled at the window level (guarded by `open`) rather than via
  a keydown handler on the backdrop — the backdrop only ever receives
  bubbled key events when it (or nothing) has focus, but a click into the
  dialog moves focus onto whatever was clicked (a button, an input), whose
  keydown bubbles through the dialog, not the backdrop, so a
  backdrop-only listener would silently stop catching Escape the moment
  the user interacts with the dialog's contents.
-->
<svelte:window onkeydown={(e) => open && e.key === "Escape" && onClose()} />

{#if open}
  <div
    class="modal-backdrop no-print"
    role="button"
    tabindex="-1"
    onclick={onClose}
    onkeydown={(e) => e.key === "Escape" && onClose()}
  >
    <!--
      Only click is stopped here, not keydown — keydown must keep bubbling
      to the window-level Escape handler above.
    -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="modal"
      role="dialog"
      aria-label={title}
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
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
