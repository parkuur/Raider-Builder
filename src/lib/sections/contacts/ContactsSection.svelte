<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    addContact,
    removeContact,
    updateContact,
  } from "../../model/contacts";
  import { setContactsData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "contacts" }> } =
    $props();

  function commit(data: typeof section.data) {
    setContactsData(rowId, section.id, data);
  }
</script>

<div class="contacts-section">
  {#if section.data.contacts.length === 0}
    <SectionEmptyHint text="No contacts yet — add one below." />
  {/if}
  {#each section.data.contacts as contact (contact.id)}
    <div class="contacts-section__row">
      <input
        class="contacts-section__name"
        value={contact.name}
        placeholder="Name"
        oninput={(e) =>
          commit(
            updateContact(section.data, contact.id, {
              name: e.currentTarget.value,
            }),
          )}
      />
      <input
        class="contacts-section__role"
        value={contact.role}
        placeholder="Role"
        oninput={(e) =>
          commit(
            updateContact(section.data, contact.id, {
              role: e.currentTarget.value,
            }),
          )}
      />
      <input
        class="contacts-section__mobile"
        value={contact.mobile}
        placeholder="Mobile"
        oninput={(e) =>
          commit(
            updateContact(section.data, contact.id, {
              mobile: e.currentTarget.value,
            }),
          )}
      />
      <input
        class="contacts-section__email"
        value={contact.email}
        placeholder="Email"
        oninput={(e) =>
          commit(
            updateContact(section.data, contact.id, {
              email: e.currentTarget.value,
            }),
          )}
      />
      <RemoveButton
        label="Remove contact"
        onclick={() => commit(removeContact(section.data, contact.id))}
      />
    </div>
  {/each}
  <button
    type="button"
    class="contacts-section__add no-print"
    onclick={() => commit(addContact(section.data))}
  >
    + Add Contact
  </button>
</div>

<style>
  .contacts-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .contacts-section__row {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .contacts-section__name,
  .contacts-section__role,
  .contacts-section__mobile,
  .contacts-section__email {
    flex: 1;
    min-width: 0;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-body);
    padding: 4px var(--space-2);
  }

  .contacts-section__add {
    align-self: flex-start;
    margin-top: var(--space-1);
    padding: 4px var(--space-2);
    border: 1px dashed var(--color-border);
    background: transparent;
    cursor: pointer;
    font-size: var(--font-size-label);
    color: var(--color-accent);
    font-family: var(--font-heading);
    font-weight: 600;
    letter-spacing: 0.02em;
  }
</style>
