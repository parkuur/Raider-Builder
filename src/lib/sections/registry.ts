import type { Component } from "svelte";
import type { SectionCategory } from "../model/registry-grouping";
import type {
  Section,
  SectionDataMap,
  SectionType,
} from "../model/section-types";
import PlaceholderSection from "./placeholder/PlaceholderSection.svelte";
import RequirementsSection from "./requirements/RequirementsSection.svelte";
import EquipmentSection from "./equipment/EquipmentSection.svelte";
import ChannelListSection from "./channel-list/ChannelListSection.svelte";
import MonitorListSection from "./monitor-list/MonitorListSection.svelte";
import BandMembersSection from "./band-members/BandMembersSection.svelte";
import StageMapSection from "./stage-map/StageMapSection.svelte";
import ContactsSection from "./contacts/ContactsSection.svelte";
import QuickLookSection from "./quicklook/QuickLookSection.svelte";
import PageBreakSection from "./page-break/PageBreakSection.svelte";
import TextSection from "./text/TextSection.svelte";
import { defaultRequirementsData } from "../model/requirements";
import { defaultEquipmentData } from "../model/equipment";
import { defaultChannelListData } from "../model/channel-list";
import { defaultMonitorListData } from "../model/monitor-list";
import { defaultBandMembersData } from "../model/band-members";
import { defaultStageMapData } from "../model/stage-map";
import { defaultContactsData } from "../model/contacts";
import { defaultQuickLookData } from "../model/quicklook";
import { defaultPageBreakData } from "../model/page-break";
import { defaultTextData } from "../model/text";

export interface SectionComponentProps<T extends SectionType = SectionType> {
  rowId: string;
  section: Extract<Section, { type: T }>;
}

export interface SectionRegistryEntry<T extends SectionType = SectionType> {
  type: T;
  label: string;
  split: boolean;
  /** Which Add Section menu heading this type is listed under. */
  category: SectionCategory;
  /** Whether this type is offered in the "Add Section" menu. Defaults to true. */
  addable?: boolean;
  /** Suppresses the shared title input for types with nothing to title. */
  hideTitle?: boolean;
  defaultData: () => SectionDataMap[T];
  component: Component<SectionComponentProps<T>>;
}

export type SectionRegistry = { [K in SectionType]: SectionRegistryEntry<K> };

export const sectionRegistry: SectionRegistry = {
  placeholder: {
    type: "placeholder",
    label: "Section",
    split: false,
    category: "rider",
    addable: false,
    defaultData: () => ({ note: "" }),
    component: PlaceholderSection,
  },
  requirements: {
    type: "requirements",
    label: "Requirements",
    split: false,
    category: "rider",
    defaultData: defaultRequirementsData,
    component: RequirementsSection,
  },
  equipment: {
    type: "equipment",
    label: "Equipment",
    split: true,
    category: "rider",
    defaultData: defaultEquipmentData,
    component: EquipmentSection,
  },
  "channel-list": {
    type: "channel-list",
    label: "Channel List",
    split: false,
    category: "rider",
    defaultData: defaultChannelListData,
    component: ChannelListSection,
  },
  "monitor-list": {
    type: "monitor-list",
    label: "Monitor List",
    split: false,
    category: "rider",
    defaultData: defaultMonitorListData,
    component: MonitorListSection,
  },
  "band-members": {
    type: "band-members",
    label: "Band Members",
    split: false,
    category: "rider",
    defaultData: defaultBandMembersData,
    component: BandMembersSection,
  },
  "stage-map": {
    type: "stage-map",
    label: "Stage Map",
    split: false,
    category: "rider",
    defaultData: defaultStageMapData,
    component: StageMapSection,
  },
  contacts: {
    type: "contacts",
    label: "Contacts",
    split: true,
    category: "rider",
    defaultData: defaultContactsData,
    component: ContactsSection,
  },
  quicklook: {
    type: "quicklook",
    label: "Quick Look",
    split: true,
    category: "rider",
    defaultData: defaultQuickLookData,
    component: QuickLookSection,
  },
  "page-break": {
    type: "page-break",
    label: "Page Break",
    split: false,
    category: "rider",
    hideTitle: true,
    defaultData: defaultPageBreakData,
    component: PageBreakSection,
  },
  text: {
    type: "text",
    label: "Text",
    split: true,
    category: "rider",
    defaultData: defaultTextData,
    component: TextSection,
  },
};
