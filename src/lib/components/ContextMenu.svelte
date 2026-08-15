<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    x,
    y,
    onClose,
    children,
  }: {
    x: number;
    y: number;
    onClose: () => void;
    children: Snippet;
  } = $props();

  let menuEl: HTMLDivElement | undefined = $state();
  let left = $state(0);
  let top = $state(0);

  $effect(() => {
    left = x;
    top = y;
    if (!menuEl) return;
    const rect = menuEl.getBoundingClientRect();
    left = Math.min(x, window.innerWidth - rect.width - 4);
    top = Math.min(y, window.innerHeight - rect.height - 4);
  });

  $effect(() => {
    function handlePointerDown(event: PointerEvent): void {
      if (!menuEl?.contains(event.target as Node)) onClose();
    }
    // Capture phase so a scroll of any ancestor (not just the page) closes
    // the menu too, matching the window-pointerdown-to-dismiss precedent
    // already used for Stage Map selection.
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", onClose, true);
    };
  });
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onClose()} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="context-menu no-print"
  role="menu"
  tabindex="-1"
  bind:this={menuEl}
  style:left="{left}px"
  style:top="{top}px"
  onclick={(e) => e.stopPropagation()}
>
  {@render children()}
</div>

<style>
  .context-menu {
    position: fixed;
    z-index: 200;
    display: flex;
    flex-direction: column;
    min-width: 140px;
    border: 1px solid var(--color-border);
    background: var(--color-background);
    box-shadow: 0 2px 8px color-mix(in srgb, #000 20%, transparent);
    padding: var(--space-1);
  }
</style>
