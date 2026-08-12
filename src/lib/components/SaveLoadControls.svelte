<script lang="ts">
  import { sectionRegistry } from "../sections/registry";
  import { parseDocumentJson } from "../model/persistence";
  import { downloadDocument, readFileAsText } from "../state/persistence";
  import { getDocument, setDocument } from "../state/document.svelte";

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
  <button type="button" class="save-load-controls__button" onclick={triggerLoad}
    >Load</button
  >
  <button type="button" class="save-load-controls__button" onclick={save}
    >Save</button
  >
  <button
    type="button"
    class="save-load-controls__button save-load-controls__button--primary"
    onclick={print}
  >
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
    gap: var(--space-1);
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-label);
  }

  .save-load-controls__button--primary {
    border-color: var(--color-accent);
    background: var(--color-accent);
    color: var(--color-background);
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
