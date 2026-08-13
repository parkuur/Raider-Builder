import { describe, expect, it } from "vitest";
import { defaultPageBreakData } from "../../../src/lib/model/page-break";

describe("defaultPageBreakData", () => {
  it("has no fields", () => {
    expect(defaultPageBreakData()).toEqual({});
  });
});
