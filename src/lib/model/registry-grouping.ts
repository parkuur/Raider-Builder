export type SectionCategory = "rider" | "planning";

/** Display order and headings for the Add Section menu. */
export const SECTION_CATEGORIES: readonly {
  id: SectionCategory;
  label: string;
}[] = [
  { id: "rider", label: "Rider" },
  { id: "planning", label: "Planning" },
];

export interface SectionTypeSummary {
  type: string;
  label: string;
  split: boolean;
  category: SectionCategory;
}

export interface SectionTypeGroup {
  category: SectionCategory;
  label: string;
  entries: SectionTypeSummary[];
}

/**
 * Groups section types by category in `SECTION_CATEGORIES` order, full-width
 * types before split types within each. `splitOnly` keeps just split types;
 * a category left with no entries is dropped rather than rendering an empty
 * heading.
 */
export function groupSectionTypes(
  entries: SectionTypeSummary[],
  { splitOnly = false }: { splitOnly?: boolean } = {},
): SectionTypeGroup[] {
  return SECTION_CATEGORIES.map(({ id, label }) => {
    const inCategory = entries.filter(
      (entry) => entry.category === id && (!splitOnly || entry.split),
    );
    return {
      category: id,
      label,
      entries: [
        ...inCategory.filter((entry) => !entry.split),
        ...inCategory.filter((entry) => entry.split),
      ],
    };
  }).filter((group) => group.entries.length > 0);
}
