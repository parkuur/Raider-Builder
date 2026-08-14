import { createId } from "./id";

export interface HeaderLogo {
  id: string;
  dataUrl: string;
}

export const MAX_HEADER_LOGOS = 4;

export function addHeaderLogo(
  logos: HeaderLogo[],
  dataUrl: string,
): HeaderLogo[] {
  if (logos.length >= MAX_HEADER_LOGOS) return logos;
  return [...logos, { id: createId("logo"), dataUrl }];
}

export function removeHeaderLogo(
  logos: HeaderLogo[],
  logoId: string,
): HeaderLogo[] {
  if (!logos.some((l) => l.id === logoId)) return logos;
  return logos.filter((l) => l.id !== logoId);
}
