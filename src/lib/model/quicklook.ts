import { createId } from "./id";
import { clamp } from "./util";
import type { IconKey } from "./icon-keys";

export interface QuickLookLine {
  id: string;
  label: string;
  value: string;
}

export interface QuickLookRowTopic {
  id: string;
  kind: "row";
  iconKey: IconKey;
  title: string;
  value: string;
}

export interface QuickLookTableTopic {
  id: string;
  kind: "table";
  iconKey: IconKey;
  title: string;
  lines: QuickLookLine[];
}

export type QuickLookTopic = QuickLookRowTopic | QuickLookTableTopic;

export interface QuickLookSectionData {
  topics: QuickLookTopic[];
}

export function defaultQuickLookData(): QuickLookSectionData {
  return { topics: [] };
}

export function addQuickLookTopic(
  data: QuickLookSectionData,
  kind: "row" | "table",
): QuickLookSectionData {
  const topic: QuickLookTopic =
    kind === "row"
      ? {
          id: createId("topic"),
          kind: "row",
          iconKey: "circle",
          title: "",
          value: "",
        }
      : {
          id: createId("topic"),
          kind: "table",
          iconKey: "circle",
          title: "",
          lines: [],
        };
  return { ...data, topics: [...data.topics, topic] };
}

export function removeQuickLookTopic(
  data: QuickLookSectionData,
  topicId: string,
): QuickLookSectionData {
  if (!data.topics.some((t) => t.id === topicId)) return data;
  return { ...data, topics: data.topics.filter((t) => t.id !== topicId) };
}

export function reorderQuickLookTopics(
  data: QuickLookSectionData,
  fromIndex: number,
  toIndex: number,
): QuickLookSectionData {
  if (fromIndex < 0 || fromIndex >= data.topics.length) return data;
  const target = clamp(toIndex, 0, data.topics.length - 1);
  if (fromIndex === target) return data;
  const topics = [...data.topics];
  const [moved] = topics.splice(fromIndex, 1);
  topics.splice(target, 0, moved!);
  return { ...data, topics };
}

export function setQuickLookTopicIcon(
  data: QuickLookSectionData,
  topicId: string,
  iconKey: IconKey,
): QuickLookSectionData {
  if (!data.topics.some((t) => t.id === topicId)) return data;
  return {
    ...data,
    topics: data.topics.map((t) => (t.id === topicId ? { ...t, iconKey } : t)),
  };
}

export function setQuickLookTopicTitle(
  data: QuickLookSectionData,
  topicId: string,
  title: string,
): QuickLookSectionData {
  if (!data.topics.some((t) => t.id === topicId)) return data;
  return {
    ...data,
    topics: data.topics.map((t) => (t.id === topicId ? { ...t, title } : t)),
  };
}

export function updateQuickLookRowValue(
  data: QuickLookSectionData,
  topicId: string,
  value: string,
): QuickLookSectionData {
  const topic = data.topics.find((t) => t.id === topicId);
  if (!topic || topic.kind !== "row") return data;
  return {
    ...data,
    topics: data.topics.map((t) =>
      t.id === topicId && t.kind === "row" ? { ...t, value } : t,
    ),
  };
}

export function addQuickLookLine(
  data: QuickLookSectionData,
  topicId: string,
): QuickLookSectionData {
  const topic = data.topics.find((t) => t.id === topicId);
  if (!topic || topic.kind !== "table") return data;
  const line: QuickLookLine = { id: createId("line"), label: "", value: "" };
  return {
    ...data,
    topics: data.topics.map((t) =>
      t.id === topicId && t.kind === "table"
        ? { ...t, lines: [...t.lines, line] }
        : t,
    ),
  };
}

export function removeQuickLookLine(
  data: QuickLookSectionData,
  topicId: string,
  lineId: string,
): QuickLookSectionData {
  const topic = data.topics.find((t) => t.id === topicId);
  if (!topic || topic.kind !== "table") return data;
  if (!topic.lines.some((l) => l.id === lineId)) return data;
  return {
    ...data,
    topics: data.topics.map((t) =>
      t.id === topicId && t.kind === "table"
        ? { ...t, lines: t.lines.filter((l) => l.id !== lineId) }
        : t,
    ),
  };
}

export function updateQuickLookLine(
  data: QuickLookSectionData,
  topicId: string,
  lineId: string,
  patch: Partial<Omit<QuickLookLine, "id">>,
): QuickLookSectionData {
  const topic = data.topics.find((t) => t.id === topicId);
  if (!topic || topic.kind !== "table") return data;
  if (!topic.lines.some((l) => l.id === lineId)) return data;
  return {
    ...data,
    topics: data.topics.map((t) =>
      t.id === topicId && t.kind === "table"
        ? {
            ...t,
            lines: t.lines.map((l) =>
              l.id === lineId ? { ...l, ...patch } : l,
            ),
          }
        : t,
    ),
  };
}
