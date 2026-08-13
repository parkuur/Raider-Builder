import { describe, expect, it } from "vitest";
import {
  addContact,
  defaultContactsData,
  removeContact,
  reorderContacts,
  updateContact,
} from "../../../src/lib/model/contacts";
import type { ContactsSectionData } from "../../../src/lib/model/contacts";

function dataWith(
  contacts: {
    id: string;
    name?: string;
    role?: string;
    mobile?: string;
    email?: string;
  }[],
): ContactsSectionData {
  return {
    contacts: contacts.map((c) => ({
      id: c.id,
      name: c.name ?? "",
      role: c.role ?? "",
      mobile: c.mobile ?? "",
      email: c.email ?? "",
    })),
  };
}

describe("defaultContactsData", () => {
  it("starts with an empty contact list", () => {
    expect(defaultContactsData()).toEqual({ contacts: [] });
  });
});

describe("addContact", () => {
  it("appends an empty contact row", () => {
    const data = dataWith([{ id: "c1" }]);
    const result = addContact(data);
    expect(result.contacts).toHaveLength(2);
    expect(result.contacts[1]).toMatchObject({
      name: "",
      role: "",
      mobile: "",
      email: "",
    });
  });
});

describe("removeContact", () => {
  it("removes the targeted contact", () => {
    const data = dataWith([{ id: "c1" }, { id: "c2" }]);
    const result = removeContact(data, "c1");
    expect(result.contacts.map((c) => c.id)).toEqual(["c2"]);
  });

  it("is a no-op for an unknown contact id", () => {
    const data = dataWith([{ id: "c1" }]);
    expect(removeContact(data, "missing")).toBe(data);
  });
});

describe("updateContact", () => {
  it("patches only the targeted contact's fields", () => {
    const data = dataWith([
      { id: "c1", name: "a" },
      { id: "c2", name: "b" },
    ]);
    const result = updateContact(data, "c1", { name: "changed" });
    expect(result.contacts[0]!.name).toBe("changed");
    expect(result.contacts[1]!.name).toBe("b");
  });

  it("is a no-op for an unknown contact id", () => {
    const data = dataWith([{ id: "c1" }]);
    expect(updateContact(data, "missing", { name: "x" })).toBe(data);
  });
});

describe("reorderContacts", () => {
  const data = dataWith([{ id: "c1" }, { id: "c2" }, { id: "c3" }]);

  it("moves the first contact to last", () => {
    const result = reorderContacts(data, 0, 2);
    expect(result.contacts.map((c) => c.id)).toEqual(["c2", "c3", "c1"]);
  });

  it("moves the last contact to first", () => {
    const result = reorderContacts(data, 2, 0);
    expect(result.contacts.map((c) => c.id)).toEqual(["c3", "c1", "c2"]);
  });

  it("is a no-op when moving to its own index", () => {
    expect(reorderContacts(data, 1, 1)).toBe(data);
  });

  it("is a no-op for an out-of-range fromIndex", () => {
    expect(reorderContacts(data, 5, 0)).toBe(data);
    expect(reorderContacts(data, -1, 0)).toBe(data);
  });

  it("clamps an out-of-range toIndex instead of erroring", () => {
    const result = reorderContacts(data, 0, 99);
    expect(result.contacts.map((c) => c.id)).toEqual(["c2", "c3", "c1"]);
  });
});
