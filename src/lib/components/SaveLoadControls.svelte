<script lang="ts">
  import { sectionRegistry } from "../sections/registry";
  import { parseDocumentJson } from "../model/persistence";
  import { downloadDocument, readFileAsText } from "../state/persistence";
  import { getDocument, setDocument } from "../state/document.svelte";
  import { createEmptyDocument } from "../model/document-types";
  import ChromeIcon from "./icons/ChromeIcon.svelte";

  let fileInput: HTMLInputElement | undefined = $state();
  let error = $state<string | null>(null);

  function triggerLoad(): void {
    fileInput?.click();
  }

  function save(): void {
    downloadDocument(getDocument());
  }

  function print(): void {
    window.print();
  }

  function clear(): void {
    if (window.confirm("Clear the current document? This can't be undone."))
      setDocument(createEmptyDocument());
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

<div class="save-load-controls no-print">
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
</style>
