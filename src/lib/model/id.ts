/**
 * crypto.randomUUID() only works in a secure context (HTTPS, or literally
 * localhost/127.0.0.1) — it's undefined over plain HTTP on a LAN IP, which
 * breaks self-hosted deployments without TLS as well as testing a dev
 * server from another device on the network. crypto.getRandomValues() has
 * no such restriction, so it's used as a fallback, manually assembled into
 * a v4 UUID (RFC 4122 §4.4: set the version nibble to 4 and the variant
 * bits to 10).
 */
function randomUUID(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}
