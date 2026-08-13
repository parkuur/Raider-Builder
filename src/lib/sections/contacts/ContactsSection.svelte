<script lang="ts">
  import type { Section } from "../../model/section-types";
  import {
    addContact,
    reorderContacts,
    removeContact,
    updateContact,
  } from "../../model/contacts";
  import { setContactsData } from "../../state/document.svelte";
  import SectionEmptyHint from "../../components/SectionEmptyHint.svelte";
  import RemoveButton from "../../components/RemoveButton.svelte";
  import DragHandle from "../../components/DragHandle.svelte";
  import { DragReorderState } from "../../components/drag-reorder.svelte";
  import ChromeIcon from "../../components/icons/ChromeIcon.svelte";
  import { autoFitText } from "../../components/auto-fit-text";
  import { SvelteSet } from "svelte/reactivity";

  let {
    rowId,
    section,
  }: { rowId: string; section: Extract<Section, { type: "contacts" }> } =
    $props();

  function commit(data: typeof section.data) {
    setContactsData(rowId, section.id, data);
  }

  const drag = new DragReorderState();

  const expandedIds = new SvelteSet<string>();
  function expand(contactId: string) {
    expandedIds.add(contactId);
  }
  function showsEmail(contactId: string, email: string): boolean {
    return expandedIds.has(contactId) || email !== "";
  }
</script>

<div class="contacts-section">
  {#if section.data.contacts.length === 0}
    <SectionEmptyHint text="No contacts yet — add one below." />
  {/if}
  {#each section.data.contacts as contact (contact.id)}
    <div
      class="contacts-section__row"
      class:contacts-section__row--drag-over={drag.isOver(contact.id)}
      role="presentation"
      ondragover={(e) => {
        e.preventDefault();
        drag.over(contact.id);
      }}
      ondrop={(e) => {
        e.preventDefault();
        const move = drag.resolveDrop(
          section.data.contacts.map((c) => c.id),
          contact.id,
        );
        if (move) commit(reorderContacts(section.data, move[0], move[1]));
      }}
    >
      <DragHandle
        onDragStart={() => drag.start(contact.id)}
        onDragEnd={() => drag.end()}
      />
      <div class="contacts-section__identity">
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
          use:autoFitText={{ min: 6 }}
          oninput={(e) =>
            commit(
              updateContact(section.data, contact.id, {
                role: e.currentTarget.value,
              }),
            )}
        />
      </div>
      <div class="contacts-section__values">
        <span class="contacts-section__value">
          <input
            value={contact.mobile}
            placeholder="Contact"
            use:autoFitText
            oninput={(e) =>
              commit(
                updateContact(section.data, contact.id, {
                  mobile: e.currentTarget.value,
                }),
              )}
          />
        </span>
        {#if showsEmail(contact.id, contact.email)}
          <span class="contacts-section__value">
            <input
              value={contact.email}
              placeholder="Contact"
              use:autoFitText
              oninput={(e) =>
                commit(
                  updateContact(section.data, contact.id, {
                    email: e.currentTarget.value,
                  }),
                )}
            />
          </span>
        {:else}
          <button
            type="button"
            class="contacts-section__add-value no-print"
            aria-label="Add email"
            title="Add email"
            onclick={() => expand(contact.id)}
          >
            <ChromeIcon key="plus" size={14} />
          </button>
        {/if}
      </div>
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
    gap: var(--space-2);
    padding: var(--space-1) 0;
    border-bottom: 1px solid var(--color-border);
  }

  .contacts-section__row:last-of-type {
    border-bottom: none;
  }

  .contacts-section__row--drag-over {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
  }

  .contacts-section__identity {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .contacts-section__name {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-body);
    padding: 3px var(--space-2);
  }

  .contacts-section__role {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 9px;
    padding: 3px var(--space-2);
  }

  .contacts-section__values {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .contacts-section__value {
    display: flex;
    align-items: center;
  }

  .contacts-section__value input {
    flex: 1;
    min-width: 0;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-body);
    padding: 3px var(--space-2);
  }

  .contacts-section__add-value {
    align-self: flex-start;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    background: var(--color-accent);
    color: var(--color-background);
    cursor: pointer;
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
