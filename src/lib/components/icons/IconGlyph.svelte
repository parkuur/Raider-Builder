<script lang="ts">
  import type { IconKey } from "../../model/icon-keys";

  let { key, size = 18 }: { key: IconKey; size?: number } = $props();
</script>

<svg
  class="icon-glyph"
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
  {#if key === "users"}
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20 c0 -4 3 -6 6 -6 s6 2 6 6" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M15 20 c0-3 1.5-5 4-5.5" />
  {:else if key === "headphones"}
    <path d="M4 15 v-3 a8 8 0 0 1 16 0 v3" />
    <rect x="2" y="15" width="5" height="6" rx="1.5" />
    <rect x="17" y="15" width="5" height="6" rx="1.5" />
  {:else if key === "wifi"}
    <path d="M2 8.5 a15 15 0 0 1 20 0" />
    <path d="M5.5 12.5 a10 10 0 0 1 13 0" />
    <path d="M9 16.5 a5 5 0 0 1 6 0" />
    <circle cx="12" cy="20" r="1" />
  {:else if key === "clock"}
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="12" x2="12" y2="7" />
    <line x1="12" y1="12" x2="16" y2="14" />
  {:else if key === "box"}
    <path d="M4 8 L12 4 L20 8 L12 12 Z" />
    <path d="M4 8 v9 l8 4 v-9 Z" />
    <path d="M20 8 v9 l-8 4 v-9 Z" />
  {:else if key === "plug"}
    <line x1="9" y1="2" x2="9" y2="7" />
    <line x1="15" y1="2" x2="15" y2="7" />
    <path d="M6 7 h12 v5 a6 6 0 0 1 -12 0 Z" />
    <line x1="12" y1="18" x2="12" y2="22" />
  {:else if key === "zap"}
    <path d="M13 2 L4 14 h6 l-1 8 L20 10 h-6 Z" />
  {:else if key === "phone"}
    <path
      d="M6 3 h4 l1 5 l-2.5 2 a12 12 0 0 0 6.5 6.5 l2 -2.5 l5 1 v4 a2 2 0 0 1 -2 2 C10 21 3 14 3 5 a2 2 0 0 1 2 -2 Z"
    />
  {/if}
</svg>
