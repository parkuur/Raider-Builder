export const CHROME_ICON_KEYS = [
  "eye",
  "eye-off",
  "copy",
  "trash",
  "plus",
  "upload",
  "download",
  "printer",
  "menu",
  "move",
] as const;

export type ChromeIconKey = (typeof CHROME_ICON_KEYS)[number];
