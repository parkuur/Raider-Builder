import { createId } from "./id";

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
