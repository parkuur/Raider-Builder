<script lang="ts">
  import { sectionRegistry } from "../sections/registry";
  import { parseDocumentJson } from "../model/persistence";
  import { downloadDocument, readFileAsText } from "../state/persistence";
  import {
    dismissConvertedNotice,
    getDocument,
    isConvertedOnLoad,
    setConvertedOnLoad,
    setDocument,
  } from "../state/document.svelte";
  import { clearDocumentFromLocalStorage } from "../state/local-storage";
  import { createEmptyDocument } from "../model/document-types";
  import { resizeAllAutosizedTextareas } from "../actions/autosize-textarea";
  import ListIcon from "phosphor-svelte/lib/ListIcon";
  import UploadSimpleIcon from "phosphor-svelte/lib/UploadSimpleIcon";
  import DownloadSimpleIcon from "phosphor-svelte/lib/DownloadSimpleIcon";
  import TrashIcon from "phosphor-svelte/lib/TrashIcon";
  import PrinterIcon from "phosphor-svelte/lib/PrinterIcon";

  let fileInput: HTMLInputElement | undefined = $state();
  let error = $state<string | null>(null);
  let menuOpen = $state(false);

  function closeMenu(): void {
    menuOpen = false;
  }

  function triggerLoad(): void {
    closeMenu();
    fileInput?.click();
  }

  function save(): void {
    closeMenu();
    downloadDocument(getDocument());
  }

  async function print(): Promise<void> {
    closeMenu();
    // Barlow/Barlow Condensed load from Google Fonts (index.html) with no
    // bundled fallback file — printing before they finish downloading (more
    // likely on a fresh mobile pageview than a desktop tab that's been open
    // a while) silently substitutes system-ui, whose different character
    // metrics reflow text and shift page breaks from what the same document
    // would print once the real fonts are in.
    await document.fonts.ready;
    // Force every autosized textarea to re-measure synchronously first —
    // see resizeAllAutosizedTextareas' doc comment for why this can't be
    // left to a ResizeObserver callback's own timing for a real print.
    resizeAllAutosizedTextareas();
    window.print();
  }

  function clear(): void {
    closeMenu();
    if (window.confirm("Clear the current document? This can't be undone.")) {
      setDocument(createEmptyDocument());
      dismissConvertedNotice();
      clearDocumentFromLocalStorage();
    }
  }

  async function onFileChosen(e: Event): Promise<void> {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const text = await readFileAsText(file);
    const result = parseDocumentJson(text, Object.keys(sectionRegistry));
    if (result.ok) {
      setDocument(result.document);
      setConvertedOnLoad(result.migrated);
      error = null;
    } else {
      error = result.errors.join("; ");
    }
  }
</script>

<button
  type="button"
  class="save-load-controls__toggle no-print"
  aria-label="Menu"
  aria-expanded={menuOpen}
  onclick={() => (menuOpen = !menuOpen)}
>
  <ListIcon size={18} />
</button>

{#if menuOpen}
  <div
    class="save-load-controls-backdrop no-print"
    role="button"
    tabindex="-1"
    onclick={closeMenu}
    onkeydown={(e) => e.key === "Escape" && closeMenu()}
  ></div>
{/if}

<div
  class="save-load-controls no-print"
  class:save-load-controls--open={menuOpen}
>
  <input
    bind:this={fileInput}
    type="file"
    accept="application/json"
    class="save-load-controls__file-input"
    onchange={onFileChosen}
  />
  <button
    type="button"
    class="save-load-controls__button"
    onclick={triggerLoad}
  >
    <UploadSimpleIcon size={16} />
    Load
  </button>
  <button type="button" class="save-load-controls__button" onclick={save}>
    <DownloadSimpleIcon size={16} />
    Save
  </button>
  <button
    type="button"
    class="save-load-controls__button save-load-controls__button--danger"
    onclick={clear}
  >
    <TrashIcon size={16} />
    Clear
  </button>
  <button
    type="button"
    class="save-load-controls__button save-load-controls__button--primary"
    onclick={print}
  >
    <PrinterIcon size={16} />
    Print / PDF
  </button>
</div>

{#if isConvertedOnLoad()}
  <div class="save-load-controls__notice no-print" role="status">
    <span>
      This file used an older format and was converted. Save it again to keep it
      in the current format.
    </span>
    <button
      type="button"
      class="save-load-controls__notice-dismiss"
      onclick={dismissConvertedNotice}
      aria-label="Dismiss notice"
    >
      ×
    </button>
  </div>
{/if}

{#if error}
  <div class="save-load-controls__error no-print" role="alert">
    <span>{error}</span>
    <button
      type="button"
      class="save-load-controls__error-dismiss"
      onclick={() => (error = null)}
      aria-label="Dismiss error"
    >
      &times;
    </button>
  </div>
{/if}

<style>
  .save-load-controls {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
    padding: var(--space-2) 0;
  }

  .save-load-controls__file-input {
    display: none;
  }

  .save-load-controls__button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-5);
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-body);
  }

  .save-load-controls__button--primary {
    border-color: var(--color-accent);
    background: var(--color-accent);
    color: var(--color-background);
  }

  .save-load-controls__button--danger {
    border-color: var(--color-danger);
    color: var(--color-danger);
  }

  .save-load-controls__error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-danger);
    color: var(--color-danger);
    font-size: var(--font-size-body);
  }

  /* Both banners are flex items of DocumentShell's toolbar: a full-width
   * basis puts each on its own wrapped line below the buttons. */
  .save-load-controls__notice,
  .save-load-controls__error {
    flex: 1 0 100%;
    order: 1;
    box-sizing: border-box;
  }

  .save-load-controls__notice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-accent);
    color: var(--color-accent);
    font-size: var(--font-size-body);
  }

  .save-load-controls__notice-dismiss {
    border: none;
    background: transparent;
    color: var(--color-accent);
    cursor: pointer;
    font-size: var(--font-size-section-title);
    line-height: 1;
    padding: 0;
  }

  .save-load-controls__error-dismiss {
    border: none;
    background: transparent;
    color: var(--color-danger);
    cursor: pointer;
    font-size: var(--font-size-section-title);
    line-height: 1;
    padding: 0;
  }

  .save-load-controls__toggle {
    display: none;
  }

  .save-load-controls-backdrop {
    display: none;
  }

  @media screen and (max-width: 640px) {
    .save-load-controls__toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      /* Pinned to the toolbar's first 52px line (its min-height, see
       * DocumentShell.svelte) rather than centered in the whole bar, which
       * grows taller when a notice/error banner wraps below it. */
      position: absolute;
      top: 8px;
      right: var(--space-2);
      width: 36px;
      height: 36px;
      padding: 0;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text);
      cursor: pointer;
    }

    .save-load-controls-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 90;
    }

    .save-load-controls {
      display: none;
      position: absolute;
      top: 52px;
      right: var(--space-2);
      z-index: 91;
      margin-top: var(--space-1);
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      gap: var(--space-2);
      padding: var(--space-3);
      background: var(--color-background);
      border: 1px solid var(--color-border);
    }

    .save-load-controls--open {
      display: flex;
    }

    .save-load-controls__button {
      justify-content: center;
    }
  }
</style>
