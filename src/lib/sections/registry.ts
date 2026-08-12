import type { Component } from "svelte";
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
import { defaultRequirementsData } from "../model/requirements";
import { defaultEquipmentData } from "../model/equipment";
import { defaultChannelListData } from "../model/channel-list";
import { defaultMonitorListData } from "../model/monitor-list";
import { defaultBandMembersData } from "../model/band-members";
import { defaultStageMapData } from "../model/stage-map";
import { defaultContactsData } from "../model/contacts";
import { defaultQuickLookData } from "../model/quicklook";

export interface SectionComponentProps<T extends SectionType = SectionType> {
  rowId: string;
  section: Extract<Section, { type: T }>;
}

export interface SectionRegistryEntry<T extends SectionType = SectionType> {
  type: T;
  label: string;
  half: boolean;
  /** Whether this type is offered in the "Add Section" menu. Defaults to true. */
  addable?: boolean;
  defaultData: () => SectionDataMap[T];
  component: Component<SectionComponentProps<T>>;
}

export type SectionRegistry = { [K in SectionType]: SectionRegistryEntry<K> };

export const sectionRegistry: SectionRegistry = {
  placeholder: {
    type: "placeholder",
    label: "Section",
    half: false,
    addable: false,
    defaultData: () => ({ note: "" }),
    component: PlaceholderSection,
  },
  requirements: {
    type: "requirements",
    label: "Requirements",
    half: false,
    defaultData: defaultRequirementsData,
    component: RequirementsSection,
  },
  equipment: {
    type: "equipment",
    label: "Equipment",
    half: false,
    defaultData: defaultEquipmentData,
    component: EquipmentSection,
  },
  "channel-list": {
    type: "channel-list",
    label: "Channel List",
    half: false,
    defaultData: defaultChannelListData,
    component: ChannelListSection,
  },
  "monitor-list": {
    type: "monitor-list",
    label: "Monitor List",
    half: false,
    defaultData: defaultMonitorListData,
    component: MonitorListSection,
  },
  "band-members": {
    type: "band-members",
    label: "Band Members",
    half: false,
    defaultData: defaultBandMembersData,
    component: BandMembersSection,
  },
  "stage-map": {
    type: "stage-map",
    label: "Stage Map",
    half: false,
    defaultData: defaultStageMapData,
    component: StageMapSection,
  },
  contacts: {
    type: "contacts",
    label: "Contacts",
    half: true,
    defaultData: defaultContactsData,
    component: ContactsSection,
  },
  quicklook: {
    type: "quicklook",
    label: "Quick Look",
    half: true,
    defaultData: defaultQuickLookData,
    component: QuickLookSection,
  },
};
