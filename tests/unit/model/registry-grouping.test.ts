import { describe, expect, it } from "vitest";
import {
  groupSectionTypesByWidth,
  type SectionTypeSummary,
} from "../../../src/lib/model/registry-grouping";

const channels: SectionTypeSummary = {
  type: "channels",
  label: "Channel List",
  split: false,
};
const monitors: SectionTypeSummary = {
  type: "monitors",
  label: "Monitor List",
  split: false,
};
const contacts: SectionTypeSummary = {
  type: "contacts",
  label: "Contacts",
  split: true,
};
const quicklook: SectionTypeSummary = {
  type: "quicklook",
  label: "Quick Look",
  split: true,
};

describe("groupSectionTypesByWidth", () => {
  it("splits a mix of full and split entries", () => {
    const result = groupSectionTypesByWidth([
      channels,
      contacts,
      monitors,
      quicklook,
    ]);
    expect(result.full).toEqual([channels, monitors]);
    expect(result.split).toEqual([contacts, quicklook]);
  });

  it("puts everything in full when nothing is split-eligible", () => {
    const result = groupSectionTypesByWidth([channels, monitors]);
    expect(result.full).toEqual([channels, monitors]);
    expect(result.split).toEqual([]);
  });

  it("puts everything in split when nothing is full-width", () => {
    const result = groupSectionTypesByWidth([contacts, quicklook]);
    expect(result.full).toEqual([]);
    expect(result.split).toEqual([contacts, quicklook]);
  });

  it("returns empty groups for empty input", () => {
    const result = groupSectionTypesByWidth([]);
    expect(result.full).toEqual([]);
    expect(result.split).toEqual([]);
  });
});
