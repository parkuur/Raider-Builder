import type { Component } from "svelte";
import type {
  Section,
  SectionDataMap,
  SectionType,
} from "../model/section-types";
import PlaceholderSection from "./placeholder/PlaceholderSection.svelte";

export interface SectionComponentProps<T extends SectionType = SectionType> {
  rowId: string;
  section: Extract<Section, { type: T }>;
}

export interface SectionRegistryEntry<T extends SectionType = SectionType> {
  type: T;
  label: string;
  half: boolean;
  defaultData: () => SectionDataMap[T];
  component: Component<SectionComponentProps<T>>;
}

export type SectionRegistry = { [K in SectionType]: SectionRegistryEntry<K> };

export const sectionRegistry: SectionRegistry = {
  placeholder: {
    type: "placeholder",
    label: "Section",
    half: false,
    defaultData: () => ({ note: "" }),
    component: PlaceholderSection,
  },
};
