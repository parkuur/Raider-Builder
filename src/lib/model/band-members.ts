import { createId } from "./id";

export interface BandMember {
  id: string;
  name: string;
  instruments: string;
  photoData: string | undefined;
}

export interface BandMembersSectionData {
  members: BandMember[];
  photoEnabled: boolean;
}

export function defaultBandMembersData(): BandMembersSectionData {
  return { members: [], photoEnabled: false };
}

export function addBandMember(
  data: BandMembersSectionData,
): BandMembersSectionData {
  const member: BandMember = {
    id: createId("member"),
    name: "",
    instruments: "",
    photoData: undefined,
  };
  return { ...data, members: [...data.members, member] };
}

export function removeBandMember(
  data: BandMembersSectionData,
  memberId: string,
): BandMembersSectionData {
  if (!data.members.some((m) => m.id === memberId)) return data;
  return { ...data, members: data.members.filter((m) => m.id !== memberId) };
}

export function updateBandMember(
  data: BandMembersSectionData,
  memberId: string,
  patch: Partial<Omit<BandMember, "id">>,
): BandMembersSectionData {
  if (!data.members.some((m) => m.id === memberId)) return data;
  return {
    ...data,
    members: data.members.map((m) =>
      m.id === memberId ? { ...m, ...patch } : m,
    ),
  };
}

export function setPhotoEnabled(
  data: BandMembersSectionData,
  enabled: boolean,
): BandMembersSectionData {
  return { ...data, photoEnabled: enabled };
}

export function memberInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
