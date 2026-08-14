import { describe, expect, it } from "vitest";
import {
  fitColumnChars,
  FIT_COLUMN_CHAR_PADDING,
} from "../../../src/lib/model/column-fit";

describe("fitColumnChars", () => {
  it("falls back to the placeholder length (plus padding) when every value is shorter", () => {
    expect(fitColumnChars(["hi", ""], "e.g. Kick In")).toBe(
      "e.g. Kick In".length + FIT_COLUMN_CHAR_PADDING,
    );
  });

  it("falls back to the placeholder length with no values at all", () => {
    expect(fitColumnChars([], "SM58 / DI")).toBe(
      "SM58 / DI".length + FIT_COLUMN_CHAR_PADDING,
    );
  });

  it("uses the longest value when it exceeds the placeholder", () => {
    expect(
      fitColumnChars(["Kick In", "Overhead Left Condenser"], "e.g. X"),
    ).toBe("Overhead Left Condenser".length + FIT_COLUMN_CHAR_PADDING);
  });

  it("adds the given padding on top of the longest length", () => {
    expect(fitColumnChars(["abcdef"], "", 0, 5)).toBe(11);
  });

  it("enforces the minimum when everything is short", () => {
    expect(fitColumnChars(["a"], "", 8)).toBe(8);
  });

  it("enforces the default minimum with no values and no placeholder", () => {
    expect(fitColumnChars([])).toBe(4);
  });
});
