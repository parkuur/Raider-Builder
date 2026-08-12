import { describe, expect, it } from "vitest";
import {
  groupSectionTypesByWidth,
  type SectionTypeSummary,
} from "../../../src/lib/model/registry-grouping";

const channels: SectionTypeSummary = {
  type: "channels",
  label: "Channel List",
  half: false,
};
const monitors: SectionTypeSummary = {
  type: "monitors",
  label: "Monitor List",
  half: false,
};
const contacts: SectionTypeSummary = {
  type: "contacts",
  label: "Contacts",
  half: true,
};
const quicklook: SectionTypeSummary = {
  type: "quicklook",
  label: "Quick Look",
  half: true,
};

describe("groupSectionTypesByWidth", () => {
  it("splits a mix of full and half entries", () => {
    const result = groupSectionTypesByWidth([
      channels,
      contacts,
      monitors,
      quicklook,
    ]);
    expect(result.full).toEqual([channels, monitors]);
    expect(result.half).toEqual([contacts, quicklook]);
  });

  it("puts everything in full when nothing is half-width", () => {
    const result = groupSectionTypesByWidth([channels, monitors]);
    expect(result.full).toEqual([channels, monitors]);
    expect(result.half).toEqual([]);
  });

  it("puts everything in half when nothing is full-width", () => {
    const result = groupSectionTypesByWidth([contacts, quicklook]);
    expect(result.full).toEqual([]);
    expect(result.half).toEqual([contacts, quicklook]);
  });

  it("returns empty groups for empty input", () => {
    const result = groupSectionTypesByWidth([]);
    expect(result.full).toEqual([]);
    expect(result.half).toEqual([]);
  });
});
