<script lang="ts">
  import type { ChromeIconKey } from "./chrome-icon-keys";

  let { key, size = 16 }: { key: ChromeIconKey; size?: number } = $props();
</script>

<svg
  class="chrome-icon"
  data-icon={key}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  {#if key === "eye"}
    <path d="M2 12 C5 6 9 4 12 4 s7 2 10 8 c-3 6 -7 8 -10 8 S5 18 2 12 Z" />
    <circle cx="12" cy="12" r="3" />
  {:else if key === "eye-off"}
    <path d="M3 3 L21 21" />
    <path
      d="M9.9 5.1 A10.6 10.6 0 0 1 12 4.9 c3 0 7 2 10 8 c-0.9 1.8 -2 3.3 -3.2 4.4"
    />
    <path
      d="M6.5 6.7 C4.3 8.2 2.8 10.1 2 12 c3 6 7 8 10 8 c1.4 0 2.8 -0.4 4.1 -1.1"
    />
    <path d="M9.5 10 a3 3 0 0 0 4.3 4.3" />
  {:else if key === "copy"}
    <rect x="9" y="9" width="12" height="12" rx="1.5" />
    <path
      d="M6 15 H4.5 A1.5 1.5 0 0 1 3 13.5 v-9 A1.5 1.5 0 0 1 4.5 3 h9 A1.5 1.5 0 0 1 15 4.5 V6"
    />
  {:else if key === "trash"}
    <path d="M4 7 H20" />
    <path d="M9 7 V4.5 A1.5 1.5 0 0 1 10.5 3 h3 A1.5 1.5 0 0 1 15 4.5 V7" />
    <path
      d="M6 7 L7 20.5 A1.5 1.5 0 0 0 8.5 22 h7 a1.5 1.5 0 0 0 1.5 -1.5 L18 7"
    />
    <path d="M10 11 v7" />
    <path d="M14 11 v7" />
  {:else if key === "plus"}
    <path d="M12 4 V20" />
    <path d="M4 12 H20" />
  {:else if key === "upload"}
    <path d="M12 15 V4" />
    <path d="M7 9 L12 4 L17 9" />
    <path d="M4 19 H20" />
  {:else if key === "download"}
    <path d="M12 4 V15" />
    <path d="M7 10 L12 15 L17 10" />
    <path d="M4 19 H20" />
  {:else if key === "printer"}
    <rect x="6" y="2" width="12" height="7" rx="1" />
    <rect x="3" y="8" width="18" height="9" rx="1.5" />
    <rect x="7" y="14" width="10" height="8" rx="1" />
  {:else if key === "menu"}
    <path d="M4 7 H20" />
    <path d="M4 12 H20" />
    <path d="M4 17 H20" />
  {/if}
</svg>
