import { describe, expect, it } from "vitest";
import { computeLogoHeight } from "../../../src/lib/model/logo-layout";

describe("computeLogoHeight", () => {
  it("returns maxHeight when there are no logos", () => {
    expect(computeLogoHeight([], 44, 200)).toBe(44);
  });

  it("returns maxHeight when a single logo already fits the width budget", () => {
    // aspect ratio 2 at height 44 => width 88, well under a 200px budget.
    expect(computeLogoHeight([2], 44, 200)).toBe(44);
  });

  it("scales all logos down uniformly when they exceed the width budget", () => {
    // Two square logos (aspect ratio 1) at height 44 => combined width 88,
    // over a 60px budget. Shared height should be 60 / 2 = 30.
    expect(computeLogoHeight([1, 1], 44, 60)).toBe(30);
  });

  it("keeps the combined width within budget for asymmetric aspect ratios", () => {
    const aspectRatios = [1, 2, 0.5];
    const maxHeight = 44;
    const maxTotalWidth = 100;
    const result = computeLogoHeight(aspectRatios, maxHeight, maxTotalWidth);
    const totalWidth = aspectRatios.reduce((sum, ar) => sum + ar * result, 0);
    expect(totalWidth).toBeCloseTo(maxTotalWidth, 5);
  });

  it("clamps to minHeight instead of collapsing to near-zero on a tiny budget", () => {
    expect(computeLogoHeight([4, 4, 4, 4], 44, 1, 12)).toBe(12);
  });
});
