import { createId } from "./id";
import { clamp } from "./util";

export interface RequirementGroup {
  id: string;
  heading: string;
  text: string;
}

export interface RequirementsSectionData {
  groups: RequirementGroup[];
}

export function defaultRequirementsData(): RequirementsSectionData {
  return { groups: [] };
}

export function addRequirementGroup(
  data: RequirementsSectionData,
  atIndex?: number,
): RequirementsSectionData {
  const group: RequirementGroup = {
    id: createId("requirement"),
    heading: "",
    text: "",
  };
  const index =
    atIndex === undefined
      ? data.groups.length
      : clamp(atIndex, 0, data.groups.length);
  const groups = [
    ...data.groups.slice(0, index),
    group,
    ...data.groups.slice(index),
  ];
  return { ...data, groups };
}

export function removeRequirementGroup(
  data: RequirementsSectionData,
  groupId: string,
): RequirementsSectionData {
  if (!data.groups.some((g) => g.id === groupId)) return data;
  return { ...data, groups: data.groups.filter((g) => g.id !== groupId) };
}

export function updateRequirementGroup(
  data: RequirementsSectionData,
  groupId: string,
  patch: Partial<Omit<RequirementGroup, "id">>,
): RequirementsSectionData {
  if (!data.groups.some((g) => g.id === groupId)) return data;
  return {
    ...data,
    groups: data.groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
  };
}

export function reorderRequirementGroups(
  data: RequirementsSectionData,
  fromIndex: number,
  toIndex: number,
): RequirementsSectionData {
  if (fromIndex < 0 || fromIndex >= data.groups.length) return data;
  const target = clamp(toIndex, 0, data.groups.length - 1);
  if (fromIndex === target) return data;
  const groups = [...data.groups];
  const [moved] = groups.splice(fromIndex, 1);
  groups.splice(target, 0, moved!);
  return { ...data, groups };
}
