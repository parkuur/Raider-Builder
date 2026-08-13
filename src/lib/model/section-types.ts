import type { BandMembersSectionData } from "./band-members";
import type { ChannelListSectionData } from "./channel-list";
import type { ContactsSectionData } from "./contacts";
import type { EquipmentSectionData } from "./equipment";
import type { MonitorListSectionData } from "./monitor-list";
import type { PageBreakSectionData } from "./page-break";
import type { QuickLookSectionData } from "./quicklook";
import type { RequirementsSectionData } from "./requirements";
import type { StageMapSectionData } from "./stage-map";

export interface PlaceholderSectionData {
  note: string;
}

export interface SectionDataMap {
  placeholder: PlaceholderSectionData;
  requirements: RequirementsSectionData;
  equipment: EquipmentSectionData;
  "channel-list": ChannelListSectionData;
  "monitor-list": MonitorListSectionData;
  "band-members": BandMembersSectionData;
  "stage-map": StageMapSectionData;
  contacts: ContactsSectionData;
  quicklook: QuickLookSectionData;
  "page-break": PageBreakSectionData;
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
