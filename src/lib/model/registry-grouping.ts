export interface SectionTypeSummary {
  type: string;
  label: string;
  half: boolean;
}

export interface SectionTypeGroups {
  full: SectionTypeSummary[];
  half: SectionTypeSummary[];
}

export function groupSectionTypesByWidth(
  entries: SectionTypeSummary[],
): SectionTypeGroups {
  return {
    full: entries.filter((entry) => !entry.half),
    half: entries.filter((entry) => entry.half),
  };
}
