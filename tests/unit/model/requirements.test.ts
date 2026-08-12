import { describe, expect, it } from "vitest";
import {
  addRequirementGroup,
  defaultRequirementsData,
  removeRequirementGroup,
  reorderRequirementGroups,
  updateRequirementGroup,
} from "../../../src/lib/model/requirements";
import type { RequirementsSectionData } from "../../../src/lib/model/requirements";

function dataWith(
  ...groups: { id: string; heading?: string; text?: string }[]
): RequirementsSectionData {
  return {
    groups: groups.map((g) => ({
      id: g.id,
      heading: g.heading ?? "",
      text: g.text ?? "",
    })),
  };
}

describe("defaultRequirementsData", () => {
  it("starts with no groups", () => {
    expect(defaultRequirementsData()).toEqual({ groups: [] });
  });
});

describe("addRequirementGroup", () => {
  it("appends an empty group by default", () => {
    const data = dataWith({ id: "g1" });
    const result = addRequirementGroup(data);
    expect(result.groups).toHaveLength(2);
    expect(result.groups[1]).toMatchObject({ heading: "", text: "" });
  });

  it("inserts at a given index", () => {
    const data = dataWith({ id: "g1" }, { id: "g2" });
    const result = addRequirementGroup(data, 1);
    expect(result.groups.map((g) => g.id)[1]).not.toBe("g1");
    expect(result.groups.map((g) => g.id)[0]).toBe("g1");
    expect(result.groups.map((g) => g.id)[2]).toBe("g2");
  });
});

describe("removeRequirementGroup", () => {
  it("removes the targeted group", () => {
    const data = dataWith({ id: "g1" }, { id: "g2" });
    const result = removeRequirementGroup(data, "g1");
    expect(result.groups.map((g) => g.id)).toEqual(["g2"]);
  });

  it("is a no-op for an unknown id", () => {
    const data = dataWith({ id: "g1" });
    expect(removeRequirementGroup(data, "missing")).toBe(data);
  });

  it("removing the last group leaves an empty list", () => {
    const data = dataWith({ id: "g1" });
    const result = removeRequirementGroup(data, "g1");
    expect(result.groups).toEqual([]);
  });
});

describe("updateRequirementGroup", () => {
  it("updates only the targeted group's fields", () => {
    const data = dataWith(
      { id: "g1", heading: "a" },
      { id: "g2", heading: "b" },
    );
    const result = updateRequirementGroup(data, "g1", { heading: "changed" });
    expect(result.groups[0]!.heading).toBe("changed");
    expect(result.groups[1]!.heading).toBe("b");
  });

  it("is a no-op for an unknown id", () => {
    const data = dataWith({ id: "g1" });
    expect(updateRequirementGroup(data, "missing", { heading: "x" })).toBe(
      data,
    );
  });
});

describe("reorderRequirementGroups", () => {
  const data = dataWith({ id: "g1" }, { id: "g2" }, { id: "g3" });

  it("moves the first group to last", () => {
    const result = reorderRequirementGroups(data, 0, 2);
    expect(result.groups.map((g) => g.id)).toEqual(["g2", "g3", "g1"]);
  });

  it("moves the last group to first", () => {
    const result = reorderRequirementGroups(data, 2, 0);
    expect(result.groups.map((g) => g.id)).toEqual(["g3", "g1", "g2"]);
  });

  it("is a no-op when moving to its own index", () => {
    expect(reorderRequirementGroups(data, 1, 1)).toBe(data);
  });

  it("is a no-op for an out-of-range fromIndex", () => {
    expect(reorderRequirementGroups(data, 5, 0)).toBe(data);
    expect(reorderRequirementGroups(data, -1, 0)).toBe(data);
  });

  it("clamps an out-of-range toIndex instead of erroring", () => {
    const result = reorderRequirementGroups(data, 0, 99);
    expect(result.groups.map((g) => g.id)).toEqual(["g2", "g3", "g1"]);
  });
});
