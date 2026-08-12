import { describe, expect, it } from "vitest";
import {
  addQuickLookLine,
  addQuickLookTopic,
  defaultQuickLookData,
  removeQuickLookLine,
  removeQuickLookTopic,
  reorderQuickLookTopics,
  setQuickLookTopicIcon,
  setQuickLookTopicTitle,
  updateQuickLookLine,
  updateQuickLookRowValue,
} from "../../../src/lib/model/quicklook";
import type {
  QuickLookRowTopic,
  QuickLookSectionData,
  QuickLookTableTopic,
} from "../../../src/lib/model/quicklook";

function rowTopic(
  id: string,
  overrides: Partial<QuickLookRowTopic> = {},
): QuickLookRowTopic {
  return {
    id,
    kind: "row",
    iconKey: "zap",
    title: "",
    value: "",
    ...overrides,
  };
}

function tableTopic(
  id: string,
  overrides: Partial<QuickLookTableTopic> = {},
): QuickLookTableTopic {
  return {
    id,
    kind: "table",
    iconKey: "zap",
    title: "",
    lines: [],
    ...overrides,
  };
}

function dataWith(
  topics: (QuickLookRowTopic | QuickLookTableTopic)[],
): QuickLookSectionData {
  return { topics };
}

describe("defaultQuickLookData", () => {
  it("starts with no topics", () => {
    expect(defaultQuickLookData()).toEqual({ topics: [] });
  });
});

describe("addQuickLookTopic", () => {
  it("appends a row topic with the default icon", () => {
    const result = addQuickLookTopic(dataWith([]), "row");
    expect(result.topics).toHaveLength(1);
    expect(result.topics[0]).toMatchObject({ kind: "row", iconKey: "zap" });
  });

  it("appends a table topic with the default icon and no lines", () => {
    const result = addQuickLookTopic(dataWith([]), "table");
    expect(result.topics).toHaveLength(1);
    expect(result.topics[0]).toMatchObject({
      kind: "table",
      iconKey: "zap",
      lines: [],
    });
  });
});

describe("removeQuickLookTopic", () => {
  it("removes the targeted topic", () => {
    const data = dataWith([rowTopic("t1"), tableTopic("t2")]);
    const result = removeQuickLookTopic(data, "t1");
    expect(result.topics.map((t) => t.id)).toEqual(["t2"]);
  });

  it("is a no-op for an unknown topic id", () => {
    const data = dataWith([rowTopic("t1")]);
    expect(removeQuickLookTopic(data, "missing")).toBe(data);
  });
});

describe("reorderQuickLookTopics", () => {
  it("moves a topic to the target index", () => {
    const data = dataWith([rowTopic("t1"), rowTopic("t2"), rowTopic("t3")]);
    const result = reorderQuickLookTopics(data, 0, 2);
    expect(result.topics.map((t) => t.id)).toEqual(["t2", "t3", "t1"]);
  });

  it("is a no-op for an out-of-range source index", () => {
    const data = dataWith([rowTopic("t1")]);
    expect(reorderQuickLookTopics(data, 5, 0)).toBe(data);
  });
});

describe("setQuickLookTopicIcon / setQuickLookTopicTitle", () => {
  it("update the targeted topic regardless of kind", () => {
    const data = dataWith([rowTopic("t1"), tableTopic("t2")]);
    const iconResult = setQuickLookTopicIcon(data, "t2", "headphones");
    expect(iconResult.topics[1]!.iconKey).toBe("headphones");

    const titleResult = setQuickLookTopicTitle(data, "t1", "FOH Contact");
    expect(titleResult.topics[0]!.title).toBe("FOH Contact");
  });

  it("are no-ops for an unknown topic id", () => {
    const data = dataWith([rowTopic("t1")]);
    expect(setQuickLookTopicIcon(data, "missing", "wifi")).toBe(data);
    expect(setQuickLookTopicTitle(data, "missing", "x")).toBe(data);
  });
});

describe("updateQuickLookRowValue", () => {
  it("updates a row topic's value", () => {
    const data = dataWith([rowTopic("t1")]);
    const result = updateQuickLookRowValue(data, "t1", "2 wired, 2 wireless");
    expect((result.topics[0] as QuickLookRowTopic).value).toBe(
      "2 wired, 2 wireless",
    );
  });

  it("is a no-op when the targeted topic is a table topic", () => {
    const data = dataWith([tableTopic("t1")]);
    expect(updateQuickLookRowValue(data, "t1", "x")).toBe(data);
  });
});

describe("addQuickLookLine / removeQuickLookLine / updateQuickLookLine", () => {
  it("add, update, and remove lines on a table topic", () => {
    const data = dataWith([tableTopic("t1")]);
    const added = addQuickLookLine(data, "t1");
    const line = (added.topics[0] as QuickLookTableTopic).lines[0]!;
    expect(line).toMatchObject({ label: "", value: "" });

    const updated = updateQuickLookLine(added, "t1", line.id, {
      label: "Load-in",
      value: "6pm",
    });
    expect((updated.topics[0] as QuickLookTableTopic).lines[0]).toMatchObject({
      label: "Load-in",
      value: "6pm",
    });

    const removed = removeQuickLookLine(updated, "t1", line.id);
    expect((removed.topics[0] as QuickLookTableTopic).lines).toHaveLength(0);
  });

  it("are no-ops when the targeted topic is a row topic", () => {
    const data = dataWith([rowTopic("t1")]);
    expect(addQuickLookLine(data, "t1")).toBe(data);
    expect(updateQuickLookLine(data, "t1", "missing", { label: "x" })).toBe(
      data,
    );
    expect(removeQuickLookLine(data, "t1", "missing")).toBe(data);
  });

  it("removeQuickLookLine is a no-op for an unknown line id", () => {
    const data = dataWith([tableTopic("t1")]);
    expect(removeQuickLookLine(data, "t1", "missing")).toBe(data);
  });
});
