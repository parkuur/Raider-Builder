import { deriveFileName, serializeDocument } from "../model/persistence";
import type { RiderDocument } from "../model/document-types";

export function downloadDocument(doc: RiderDocument): void {
  const blob = new Blob([serializeDocument(doc)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = deriveFileName(doc.header);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function readFileAsText(file: File): Promise<string> {
  return file.text();
}
