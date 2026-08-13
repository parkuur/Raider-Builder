import { describe, expect, it } from "vitest";
import {
  addBandMember,
  defaultBandMembersData,
  memberInitials,
  removeBandMember,
  reorderBandMember,
  setPhotoEnabled,
  updateBandMember,
} from "../../../src/lib/model/band-members";
import type { BandMembersSectionData } from "../../../src/lib/model/band-members";

function dataWith(
  ...members: { id: string; name?: string }[]
): BandMembersSectionData {
  return {
    members: members.map((m) => ({
      id: m.id,
      name: m.name ?? "",
      instruments: "",
      photoData: undefined,
    })),
    photoEnabled: false,
  };
}

describe("defaultBandMembersData", () => {
  it("starts with no members and photos disabled", () => {
    expect(defaultBandMembersData()).toEqual({
      members: [],
      photoEnabled: false,
    });
  });
});

describe("addBandMember", () => {
  it("appends an empty member", () => {
    const data = dataWith({ id: "m1" });
    const result = addBandMember(data);
    expect(result.members).toHaveLength(2);
    expect(result.members[1]).toMatchObject({ name: "", instruments: "" });
  });
});

describe("removeBandMember", () => {
  it("removes the targeted member", () => {
    const data = dataWith({ id: "m1" }, { id: "m2" });
    expect(removeBandMember(data, "m1").members.map((m) => m.id)).toEqual([
      "m2",
    ]);
  });

  it("is a no-op for an unknown id", () => {
    const data = dataWith({ id: "m1" });
    expect(removeBandMember(data, "missing")).toBe(data);
  });
});

describe("reorderBandMember", () => {
  it("moves a member to the target index", () => {
    const data = dataWith({ id: "m1" }, { id: "m2" }, { id: "m3" });
    const result = reorderBandMember(data, 0, 2);
    expect(result.members.map((m) => m.id)).toEqual(["m2", "m3", "m1"]);
  });

  it("is a no-op for an out-of-range fromIndex", () => {
    const data = dataWith({ id: "m1" });
    expect(reorderBandMember(data, 5, 0)).toBe(data);
  });
});

describe("updateBandMember", () => {
  it("patches only the targeted member's fields", () => {
    const data = dataWith({ id: "m1", name: "a" }, { id: "m2", name: "b" });
    const result = updateBandMember(data, "m1", { instruments: "Guitar" });
    expect(result.members[0]).toMatchObject({
      name: "a",
      instruments: "Guitar",
    });
    expect(result.members[1]!.instruments).toBe("");
  });

  it("is a no-op for an unknown id", () => {
    const data = dataWith({ id: "m1" });
    expect(updateBandMember(data, "missing", { name: "x" })).toBe(data);
  });
});

describe("setPhotoEnabled", () => {
  it("toggles the section-level flag", () => {
    const data = dataWith({ id: "m1" });
    expect(setPhotoEnabled(data, true).photoEnabled).toBe(true);
  });
});

describe("memberInitials", () => {
  it("uses the first letter of a single-word name", () => {
    expect(memberInitials("Cher")).toBe("C");
  });

  it("uses the first letters of the first two words", () => {
    expect(memberInitials("Jimi Hendrix")).toBe("JH");
  });

  it("ignores words past the second", () => {
    expect(memberInitials("Earth Wind Fire")).toBe("EW");
  });

  it("falls back to a question mark for an empty name", () => {
    expect(memberInitials("")).toBe("?");
    expect(memberInitials("   ")).toBe("?");
  });
});
