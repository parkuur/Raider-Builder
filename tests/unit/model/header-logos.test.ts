import { describe, expect, it } from "vitest";
import {
  addHeaderLogo,
  removeHeaderLogo,
} from "../../../src/lib/model/header-logos";

describe("addHeaderLogo", () => {
  it("appends a logo with the given data URL", () => {
    const result = addHeaderLogo([], "data:image/png;base64,abc");
    expect(result).toEqual([
      { id: expect.any(String), dataUrl: "data:image/png;base64,abc" },
    ]);
  });

  it("is a no-op once the 4-logo cap is reached", () => {
    const logos = [
      { id: "l1", dataUrl: "a" },
      { id: "l2", dataUrl: "b" },
      { id: "l3", dataUrl: "c" },
      { id: "l4", dataUrl: "d" },
    ];
    expect(addHeaderLogo(logos, "e")).toBe(logos);
  });
});

describe("removeHeaderLogo", () => {
  it("removes the targeted logo", () => {
    const logos = [
      { id: "l1", dataUrl: "a" },
      { id: "l2", dataUrl: "b" },
    ];
    expect(removeHeaderLogo(logos, "l1")).toEqual([logos[1]]);
  });

  it("is a no-op on an unknown id", () => {
    const logos = [{ id: "l1", dataUrl: "a" }];
    expect(removeHeaderLogo(logos, "nope")).toBe(logos);
  });
});
