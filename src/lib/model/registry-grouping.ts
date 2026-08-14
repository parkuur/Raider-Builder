export interface SectionTypeSummary {
  type: string;
  label: string;
  split: boolean;
}

export interface SectionTypeGroups {
  full: SectionTypeSummary[];
  split: SectionTypeSummary[];
}

export function groupSectionTypesByWidth(
  entries: SectionTypeSummary[],
): SectionTypeGroups {
  return {
    full: entries.filter((entry) => !entry.split),
    split: entries.filter((entry) => entry.split),
  };
}
