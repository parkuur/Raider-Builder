import { serializeDocument, parseDocumentJson } from "../model/persistence";
import type { RiderDocument } from "../model/document-types";

const STORAGE_KEY = "raiderbuilder:document";

export function saveDocumentToLocalStorage(doc: RiderDocument): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeDocument(doc));
  } catch {
    // Storage unavailable/full — in-memory editing still works, just unpersisted.
  }
}

export function loadDocumentFromLocalStorage(
  knownSectionTypes: readonly string[],
): RiderDocument | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  const result = parseDocumentJson(raw, knownSectionTypes);
  return result.ok ? result.document : null;
}

export function clearDocumentFromLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
