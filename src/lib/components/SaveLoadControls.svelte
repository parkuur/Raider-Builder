<script lang="ts">
  import { sectionRegistry } from "../sections/registry";
  import { parseDocumentJson } from "../model/persistence";
  import { downloadDocument, readFileAsText } from "../state/persistence";
  import { getDocument, setDocument } from "../state/document.svelte";
  import { clearDocumentFromLocalStorage } from "../state/local-storage";
  import { createEmptyDocument } from "../model/document-types";
  import ChromeIcon from "./icons/ChromeIcon.svelte";

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

  function print(): void {
    closeMenu();
    window.print();
  }

  function clear(): void {
    closeMenu();
    if (window.confirm("Clear the current document? This can't be undone.")) {
      setDocument(createEmptyDocument());
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
  <ChromeIcon key="menu" size={18} />
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
    <ChromeIcon key="upload" size={16} />
    Load
  </button>
  <button type="button" class="save-load-controls__button" onclick={save}>
    <ChromeIcon key="download" size={16} />
    Save
  </button>
  <button
    type="button"
    class="save-load-controls__button save-load-controls__button--danger"
    onclick={clear}
  >
    <ChromeIcon key="trash" size={16} />
    Clear
  </button>
  <button
    type="button"
    class="save-load-controls__button save-load-controls__button--primary"
    onclick={print}
  >
    <ChromeIcon key="printer" size={16} />
    Print / PDF
  </button>
</div>

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
    margin-bottom: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-danger);
    color: var(--color-danger);
    font-size: var(--font-size-body);
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

  @media (max-width: 640px) {
    .save-load-controls__toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 50%;
      right: var(--space-5);
      transform: translateY(-50%);
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
      top: 100%;
      right: var(--space-5);
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
