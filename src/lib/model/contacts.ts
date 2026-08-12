import { createId } from "./id";
import { clamp } from "./util";

export interface ContactRow {
  id: string;
  name: string;
  role: string;
  mobile: string;
  email: string;
}

export interface ContactsSectionData {
  contacts: ContactRow[];
}

export function defaultContactsData(): ContactsSectionData {
  return { contacts: [] };
}

export function addContact(data: ContactsSectionData): ContactsSectionData {
  const contact: ContactRow = {
    id: createId("contact"),
    name: "",
    role: "",
    mobile: "",
    email: "",
  };
  return { ...data, contacts: [...data.contacts, contact] };
}

export function removeContact(
  data: ContactsSectionData,
  contactId: string,
): ContactsSectionData {
  if (!data.contacts.some((c) => c.id === contactId)) return data;
  return {
    ...data,
    contacts: data.contacts.filter((c) => c.id !== contactId),
  };
}

export function updateContact(
  data: ContactsSectionData,
  contactId: string,
  patch: Partial<Omit<ContactRow, "id">>,
): ContactsSectionData {
  if (!data.contacts.some((c) => c.id === contactId)) return data;
  return {
    ...data,
    contacts: data.contacts.map((c) =>
      c.id === contactId ? { ...c, ...patch } : c,
    ),
  };
}

export function reorderContacts(
  data: ContactsSectionData,
  fromIndex: number,
  toIndex: number,
): ContactsSectionData {
  if (fromIndex < 0 || fromIndex >= data.contacts.length) return data;
  const target = clamp(toIndex, 0, data.contacts.length - 1);
  if (fromIndex === target) return data;
  const contacts = [...data.contacts];
  const [moved] = contacts.splice(fromIndex, 1);
  contacts.splice(target, 0, moved!);
  return { ...data, contacts };
}
