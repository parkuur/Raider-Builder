<script lang="ts">
  import { getDocument, setHeaderField } from "../state/document.svelte";
  import {
    addHeaderMetaField,
    removeHeaderMetaField,
    setHeaderMetaFieldLabel,
    setHeaderMetaFieldValue,
  } from "../model/header-meta";
  import type { HeaderMetaFieldKind } from "../model/header-meta";
  import { addHeaderLogo, removeHeaderLogo } from "../model/header-logos";
  import RemoveButton from "./RemoveButton.svelte";
  import HeaderLogos from "./HeaderLogos.svelte";
  import PlusIcon from "phosphor-svelte/lib/PlusIcon";

  const header = $derived(getDocument().header);

  function commitFields(next: typeof header.metaFields) {
    setHeaderField("metaFields", next);
  }

  let topRowEl: HTMLDivElement | undefined = $state();
  let topRowWidth = $state(0);

  $effect(() => {
    if (!topRowEl) return;
    const observer = new ResizeObserver((entries) => {
      topRowWidth = entries[0]!.contentRect.width;
    });
    observer.observe(topRowEl);
    return () => observer.disconnect();
  });

  let addMenuOpen = $state(false);

  function addField(kind: HeaderMetaFieldKind): void {
    commitFields(addHeaderMetaField(header.metaFields, kind));
    addMenuOpen = false;
  }

  const ADD_FIELD_OPTIONS: { kind: HeaderMetaFieldKind; label: string }[] = [
    { kind: "keyvalue", label: "Key : Value" },
    { kind: "date", label: "Date" },
    { kind: "text", label: "Text" },
  ];
</script>

<header class="document-header">
  <div class="document-header__fields">
    <div class="document-header__top" bind:this={topRowEl}>
      <div class="document-header__titles">
        <input
          class="document-header__title"
          value={header.title}
          oninput={(e) => setHeaderField("title", e.currentTarget.value)}
          placeholder="Technical Rider"
        />
        <input
          class="document-header__band"
          value={header.band}
          oninput={(e) => setHeaderField("band", e.currentTarget.value)}
          placeholder="Band / Act Name"
        />
      </div>
      <HeaderLogos
        logos={header.logos}
        maxTotalWidth={topRowWidth * 0.5}
        onAdd={(dataUrl) =>
          setHeaderField("logos", addHeaderLogo(header.logos, dataUrl))}
        onRemove={(id) =>
          setHeaderField("logos", removeHeaderLogo(header.logos, id))}
      />
    </div>
    <div class="document-header__meta">
      {#each header.metaFields as field (field.id)}
        <div class="document-header__meta-field">
          {#if field.kind !== "text"}
            <input
              class="document-header__meta-label"
              value={field.label}
              placeholder="Label"
              oninput={(e) =>
                commitFields(
                  setHeaderMetaFieldLabel(
                    header.metaFields,
                    field.id,
                    e.currentTarget.value,
                  ),
                )}
            />
          {/if}
          <input
            class="document-header__meta-input"
            type={field.kind === "date" ? "date" : "text"}
            value={field.value}
            oninput={(e) =>
              commitFields(
                setHeaderMetaFieldValue(
                  header.metaFields,
                  field.id,
                  e.currentTarget.value,
                ),
              )}
          />
          <RemoveButton
            label="Remove field"
            onclick={() =>
              commitFields(removeHeaderMetaField(header.metaFields, field.id))}
          />
        </div>
      {/each}
      <div class="document-header__add-field no-print">
        <button
          type="button"
          class="document-header__add-field-trigger"
          aria-haspopup="true"
          aria-expanded={addMenuOpen}
          aria-label="Add field"
          title="Add field"
          onclick={() => (addMenuOpen = !addMenuOpen)}
        >
          <PlusIcon size={14} />
        </button>
        {#if addMenuOpen}
          <div
            class="document-header__add-field-backdrop"
            role="button"
            tabindex="-1"
            onclick={() => (addMenuOpen = false)}
            onkeydown={(e) => e.key === "Escape" && (addMenuOpen = false)}
          ></div>
          <div
            class="document-header__add-field-popover"
            role="menu"
            aria-label="Add field"
          >
            {#each ADD_FIELD_OPTIONS as option (option.kind)}
              <button
                type="button"
                role="menuitem"
                onclick={() => addField(option.kind)}
              >
                {option.label}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</header>

<style>
  .document-header {
    margin-bottom: var(--space-5);
  }

  .document-header__title,
  .document-header__band,
  .document-header__meta-label,
  .document-header__meta-input {
    border: none;
    background: transparent;
    color: var(--color-text);
    padding: 0;
  }

  .document-header__top {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-2);
  }

  .document-header__titles {
    flex: 1;
    min-width: 0;
  }

  .document-header__title {
    display: block;
    width: 100%;
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-doc-title);
    margin-bottom: var(--space-1);
  }

  .document-header__band {
    display: block;
    width: 100%;
    font-size: var(--font-size-body);
    color: var(--color-accent);
  }

  .document-header__meta {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: var(--space-5);
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-2);
  }

  .document-header__meta-field {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
  }

  .document-header__meta-label {
    font-size: var(--font-size-label);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    width: 4em;
  }

  .document-header__meta-input {
    font-size: var(--font-size-body);
    width: 70px;
  }

  .document-header__add-field {
    position: relative;
    display: inline-flex;
    align-self: center;
  }

  .document-header__add-field-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px dashed var(--color-border);
    background: transparent;
    color: var(--color-accent);
    cursor: pointer;
  }

  .document-header__add-field-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: transparent;
  }

  .document-header__add-field-popover {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 101;
    display: flex;
    flex-direction: column;
    min-width: 120px;
    border: 1px solid var(--color-border);
    background: var(--color-background);
    box-shadow: 0 4px 12px color-mix(in srgb, #000 25%, transparent);
  }

  .document-header__add-field-popover button {
    padding: var(--space-2);
    border: none;
    background: transparent;
    color: var(--color-text);
    text-align: left;
    cursor: pointer;
    font-size: var(--font-size-body);
  }

  .document-header__add-field-popover button:hover {
    background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  }
</style>
