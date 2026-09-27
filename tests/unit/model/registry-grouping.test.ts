import { describe, expect, it } from "vitest";
import {
  groupSectionTypes,
  type SectionTypeSummary,
} from "../../../src/lib/model/registry-grouping";

const channels: SectionTypeSummary = {
  type: "channels",
  label: "Channel List",
  split: false,
  category: "rider",
};
const contacts: SectionTypeSummary = {
  type: "contacts",
  label: "Contacts",
  split: true,
  category: "rider",
};
const monitors: SectionTypeSummary = {
  type: "monitors",
  label: "Monitor List",
  split: false,
  category: "rider",
};
const setlist: SectionTypeSummary = {
  type: "setlist",
  label: "Setlist",
  split: true,
  category: "planning",
};
const schedule: SectionTypeSummary = {
  type: "schedule",
  label: "Schedule",
  split: false,
  category: "planning",
};

describe("groupSectionTypes", () => {
  it("orders categories rider then planning regardless of input order", () => {
    const result = groupSectionTypes([setlist, channels]);
    expect(result.map((g) => g.category)).toEqual(["rider", "planning"]);
    expect(result.map((g) => g.label)).toEqual(["Rider", "Planning"]);
  });

  it("lists full-width types before split types within a category", () => {
    const result = groupSectionTypes([contacts, channels, setlist, monitors]);
    expect(result[0]!.entries).toEqual([channels, monitors, contacts]);
    expect(result[1]!.entries).toEqual([setlist]);
  });

  it("keeps input order among entries of the same width", () => {
    const result = groupSectionTypes([monitors, channels]);
    expect(result[0]!.entries).toEqual([monitors, channels]);
  });

  it("drops a category with no entries", () => {
    const result = groupSectionTypes([channels, contacts]);
    expect(result.map((g) => g.category)).toEqual(["rider"]);
  });

  it("splitOnly keeps only split types and drops emptied categories", () => {
    const withSplit = groupSectionTypes(
      [channels, contacts, schedule, setlist],
      { splitOnly: true },
    );
    expect(withSplit).toEqual([
      { category: "rider", label: "Rider", entries: [contacts] },
      { category: "planning", label: "Planning", entries: [setlist] },
    ]);

    const noPlanningSplit = groupSectionTypes([channels, contacts, schedule], {
      splitOnly: true,
    });
    expect(noPlanningSplit.map((g) => g.category)).toEqual(["rider"]);
  });

  it("returns no groups for empty input", () => {
    expect(groupSectionTypes([])).toEqual([]);
  });
});
