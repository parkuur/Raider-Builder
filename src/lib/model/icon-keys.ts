export const ICON_KEYS = [
  "users",
  "headphones",
  "wifi",
  "clock",
  "box",
  "plug",
  "zap",
  "phone",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

export const ICON_LABELS: Record<IconKey, string> = {
  users: "Players/Crew",
  headphones: "Monitors",
  wifi: "Wireless",
  clock: "Schedule",
  box: "FOH",
  plug: "Power",
  zap: "General",
  phone: "Comms",
};
