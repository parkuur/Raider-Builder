export const ICON_KEYS = [
  "guitar",
  "hard-hat",
  "cell-tower",
  "clock-clockwise",
  "headphones",
  "chalkboard-simple",
  "plug",
  "lightbulb",
  "speaker-hifi",
  "car-profile",
  "users-three",
  "tent",
  "lock",
  "hair-dryer",
  "faders",
  "circle",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

export const ICON_LABELS: Record<IconKey, string> = {
  guitar: "Players",
  "hard-hat": "Crew",
  "cell-tower": "Wireless",
  "clock-clockwise": "Schedule",
  headphones: "Monitoring",
  "chalkboard-simple": "Stage",
  plug: "Power",
  lightbulb: "Lighting",
  "speaker-hifi": "PA",
  "car-profile": "Cars",
  "users-three": "Hands",
  tent: "Housing",
  lock: "Security",
  "hair-dryer": "Backstage",
  faders: "Mixer",
  circle: "Generic",
};
