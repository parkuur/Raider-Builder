import { describe, expect, it } from "vitest";
import { computeFitFontSize } from "../../../src/lib/components/auto-fit-text";

describe("computeFitFontSize", () => {
  it("keeps the max size when the text already fits", () => {
    const result = computeFitFontSize(() => 50, 100, { min: 8, max: 13 });
    expect(result).toBe(13);
  });

  it("shrinks until the text fits", () => {
    // Width scales with font size; fits once size <= 10.
    const result = computeFitFontSize((size) => size * 10, 100, {
      min: 8,
      max: 13,
    });
    expect(result).toBe(10);
  });

  it("floors at min when even the smallest size overflows", () => {
    const result = computeFitFontSize(() => 1000, 100, { min: 8, max: 13 });
    expect(result).toBe(8);
  });

  it("respects a custom step", () => {
    const result = computeFitFontSize((size) => size * 10, 95, {
      min: 8,
      max: 13,
      step: 1,
    });
    expect(result).toBe(9);
  });

  it("is a no-op when min equals max", () => {
    const result = computeFitFontSize(() => 1000, 100, { min: 13, max: 13 });
    expect(result).toBe(13);
  });
});
