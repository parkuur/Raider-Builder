import { describe, expect, it } from "vitest";
import { DragReorderState } from "../../../src/lib/components/drag-reorder.svelte";

describe("DragReorderState", () => {
  it("tracks the id being dragged through start/end", () => {
    const drag = new DragReorderState();
    expect(drag.draggingId).toBeNull();
    expect(drag.isDragging("a")).toBe(false);

    drag.start("a");
    expect(drag.draggingId).toBe("a");
    expect(drag.isDragging("a")).toBe(true);
    expect(drag.isDragging("b")).toBe(false);

    drag.end();
    expect(drag.draggingId).toBeNull();
    expect(drag.isDragging("a")).toBe(false);
  });

  it("tracks the hovered-over id, ignoring self-hover and no active drag", () => {
    const drag = new DragReorderState();

    drag.over("b");
    expect(drag.isOver("b")).toBe(false);

    drag.start("a");
    drag.over("b");
    expect(drag.isOver("b")).toBe(true);
    expect(drag.isOver("a")).toBe(false);

    drag.over("a");
    expect(drag.isOver("a")).toBe(false);

    drag.end();
    expect(drag.isOver("b")).toBe(false);
  });

  it("resolveDrop returns the from/to index pair for a valid drag+drop", () => {
    const drag = new DragReorderState();
    drag.start("c");
    const result = drag.resolveDrop(["a", "b", "c", "d"], "a");
    expect(result).toEqual([2, 0]);
  });

  it("resolveDrop clears drag state as a side effect", () => {
    const drag = new DragReorderState();
    drag.start("a");
    drag.over("b");
    drag.resolveDrop(["a", "b"], "b");
    expect(drag.draggingId).toBeNull();
    expect(drag.isOver("b")).toBe(false);
  });

  it("resolveDrop returns null when nothing is being dragged", () => {
    const drag = new DragReorderState();
    expect(drag.resolveDrop(["a", "b"], "a")).toBeNull();
  });

  it("resolveDrop returns null when dropped on the dragged item itself", () => {
    const drag = new DragReorderState();
    drag.start("a");
    expect(drag.resolveDrop(["a", "b"], "a")).toBeNull();
  });

  it("resolveDrop returns null for a stale id no longer in the list", () => {
    const drag = new DragReorderState();
    drag.start("missing");
    expect(drag.resolveDrop(["a", "b"], "a")).toBeNull();

    const drag2 = new DragReorderState();
    drag2.start("a");
    expect(drag2.resolveDrop(["a", "b"], "missing")).toBeNull();
  });
});
