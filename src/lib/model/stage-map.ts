import { createId } from "./id";
import { clamp } from "./util";

export type StageItemCategory =
  | "mic"
  | "di"
  | "amp"
  | "rack"
  | "drum"
  | "mon"
  | "xlr"
  | "io"
  | "power"
  | "riser"
  | "name";

export interface StageItemCategoryMeta {
  abbreviation: string;
  shape: "circle" | "square" | "triangle" | "rectangle" | "ellipse";
  dashed?: boolean;
  resizable?: boolean;
}

export const STAGE_ITEM_CATEGORIES: Record<
  StageItemCategory,
  StageItemCategoryMeta
> = {
  mic: { abbreviation: "MIC", shape: "circle" },
  di: { abbreviation: "DI", shape: "rectangle" },
  amp: { abbreviation: "AMP", shape: "square" },
  rack: { abbreviation: "RACK", shape: "square" },
  drum: { abbreviation: "DRM", shape: "circle" },
  mon: { abbreviation: "MON", shape: "square" },
  xlr: { abbreviation: "XLR", shape: "rectangle" },
  io: { abbreviation: "I/O", shape: "rectangle" },
  power: { abbreviation: "PWR", shape: "triangle" },
  riser: {
    abbreviation: "RISER",
    shape: "square",
    dashed: true,
    resizable: true,
  },
  name: { abbreviation: "NAME", shape: "ellipse" },
};

const DEFAULT_LABELS: Record<StageItemCategory, string> = {
  mic: "Vox",
  di: "Bass DI",
  amp: "Amp",
  rack: "Rack",
  drum: "Drums",
  mon: "Wedge",
  xlr: "XLR Run",
  io: "I/O",
  power: "Power",
  riser: "Riser",
  name: "Name",
};

const MIN_CANVAS_HEIGHT = 160;
const DEFAULT_CANVAS_HEIGHT = 260;
const MIN_RISER_WIDTH = 34;
const MIN_RISER_HEIGHT = 26;
const DEFAULT_RISER_WIDTH = 70;
const DEFAULT_RISER_HEIGHT = 50;

export interface StageItem {
  id: string;
  category: StageItemCategory;
  label: string;
  /** Editable center text for the "name" category; unused by every other category. */
  nameText: string;
  x: number;
  y: number;
  w: number | undefined;
  h: number | undefined;
  order: number;
}

export interface StageMapSectionData {
  items: StageItem[];
  canvasHeight: number;
}

export function defaultStageMapData(): StageMapSectionData {
  return { items: [], canvasHeight: DEFAULT_CANVAS_HEIGHT };
}

function nextOrder(items: readonly StageItem[]): number {
  return items.reduce((max, item) => Math.max(max, item.order), 0) + 1;
}

export function addStageItem(
  data: StageMapSectionData,
  category: StageItemCategory,
): StageMapSectionData {
  const meta = STAGE_ITEM_CATEGORIES[category];
  const item: StageItem = {
    id: createId("stage-item"),
    category,
    label: DEFAULT_LABELS[category],
    nameText: "",
    x: 50,
    y: 50,
    w: meta.resizable ? DEFAULT_RISER_WIDTH : undefined,
    h: meta.resizable ? DEFAULT_RISER_HEIGHT : undefined,
    order: nextOrder(data.items),
  };
  return { ...data, items: [...data.items, item] };
}

export function removeStageItem(
  data: StageMapSectionData,
  itemId: string,
): StageMapSectionData {
  if (!data.items.some((i) => i.id === itemId)) return data;
  return { ...data, items: data.items.filter((i) => i.id !== itemId) };
}

export function updateStageItemLabel(
  data: StageMapSectionData,
  itemId: string,
  label: string,
): StageMapSectionData {
  if (!data.items.some((i) => i.id === itemId)) return data;
  return {
    ...data,
    items: data.items.map((i) => (i.id === itemId ? { ...i, label } : i)),
  };
}

export function updateStageItemName(
  data: StageMapSectionData,
  itemId: string,
  nameText: string,
): StageMapSectionData {
  if (!data.items.some((i) => i.id === itemId)) return data;
  return {
    ...data,
    items: data.items.map((i) => (i.id === itemId ? { ...i, nameText } : i)),
  };
}

export function moveStageItem(
  data: StageMapSectionData,
  itemId: string,
  x: number,
  y: number,
): StageMapSectionData {
  if (!data.items.some((i) => i.id === itemId)) return data;
  const clampedX = clamp(x, 3, 97);
  const clampedY = clamp(y, 8, 92);
  return {
    ...data,
    items: data.items.map((i) =>
      i.id === itemId ? { ...i, x: clampedX, y: clampedY } : i,
    ),
  };
}

export function resizeStageItem(
  data: StageMapSectionData,
  itemId: string,
  w: number,
  h: number,
): StageMapSectionData {
  if (!data.items.some((i) => i.id === itemId)) return data;
  const clampedW = Math.max(MIN_RISER_WIDTH, w);
  const clampedH = Math.max(MIN_RISER_HEIGHT, h);
  return {
    ...data,
    items: data.items.map((i) =>
      i.id === itemId ? { ...i, w: clampedW, h: clampedH } : i,
    ),
  };
}

export function setCanvasHeight(
  data: StageMapSectionData,
  height: number,
): StageMapSectionData {
  return { ...data, canvasHeight: Math.max(MIN_CANVAS_HEIGHT, height) };
}

/**
 * Stacking order is an explicit `order` field on each item, independent of
 * array/creation order — the direct fix for the prototype's defect, where
 * new items were always appended to the end of the array and nothing ever
 * reordered on interaction, so an item added earlier stayed permanently
 * beneath everything added later.
 */
export function bringToFront(items: StageItem[], id: string): StageItem[] {
  const target = items.find((item) => item.id === id);
  if (!target) return items;
  const isAlreadyUniquelyOnTop = items.every(
    (item) => item.id === id || item.order < target.order,
  );
  if (isAlreadyUniquelyOnTop) return items;
  const maxOrder = items.reduce(
    (max, item) => Math.max(max, item.order),
    -Infinity,
  );
  return items.map((item) =>
    item.id === id ? { ...item, order: maxOrder + 1 } : item,
  );
}

export function bringStageItemToFront(
  data: StageMapSectionData,
  itemId: string,
): StageMapSectionData {
  const items = bringToFront(data.items, itemId);
  return items === data.items ? data : { ...data, items };
}

/**
 * Group version of {@link bringToFront} — brings every item in `ids` above
 * everything else, preserving their order relative to each other (so
 * bringing a multi-selection forward never scrambles which of the selected
 * items was already on top within the group).
 */
export function bringManyToFront(
  items: StageItem[],
  ids: readonly string[],
): StageItem[] {
  const idSet = new Set(ids);
  const targets = items.filter((item) => idSet.has(item.id));
  if (targets.length === 0) return items;

  const others = items.filter((item) => !idSet.has(item.id));
  const maxOtherOrder = others.reduce(
    (max, item) => Math.max(max, item.order),
    -Infinity,
  );
  const isAlreadyUniquelyOnTop = targets.every(
    (target) => target.order > maxOtherOrder,
  );
  if (isAlreadyUniquelyOnTop) return items;

  const sortedTargets = [...targets].sort((a, b) => a.order - b.order);
  const maxOrder = items.reduce(
    (max, item) => Math.max(max, item.order),
    -Infinity,
  );
  const newOrderById = new Map(
    sortedTargets.map((item, index) => [item.id, maxOrder + 1 + index]),
  );

  return items.map((item) => {
    const newOrder = newOrderById.get(item.id);
    return newOrder === undefined ? item : { ...item, order: newOrder };
  });
}

/**
 * Moves every item in `ids` by the same percentage delta, each still
 * independently clamped to the canvas margins — the group-drag counterpart
 * to {@link moveStageItem}.
 */
export function moveStageItemsBy(
  data: StageMapSectionData,
  ids: readonly string[],
  dxPercent: number,
  dyPercent: number,
): StageMapSectionData {
  const idSet = new Set(ids);
  if (!data.items.some((item) => idSet.has(item.id))) return data;
  return {
    ...data,
    items: data.items.map((item) =>
      idSet.has(item.id)
        ? {
            ...item,
            x: clamp(item.x + dxPercent, 3, 97),
            y: clamp(item.y + dyPercent, 8, 92),
          }
        : item,
    ),
  };
}
