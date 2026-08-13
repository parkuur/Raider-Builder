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
  "link",
] as const;

export type ChromeIconKey = (typeof CHROME_ICON_KEYS)[number];
