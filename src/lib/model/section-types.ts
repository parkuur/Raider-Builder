import type { EquipmentSectionData } from "./equipment";
import type { RequirementsSectionData } from "./requirements";

export interface PlaceholderSectionData {
  note: string;
}

export interface SectionDataMap {
  placeholder: PlaceholderSectionData;
  requirements: RequirementsSectionData;
  equipment: EquipmentSectionData;
}

export type SectionType = keyof SectionDataMap;

export type Section = {
  [K in SectionType]: {
    id: string;
    type: K;
    title: string;
    hidden: boolean;
    data: SectionDataMap[K];
  };
}[SectionType];
