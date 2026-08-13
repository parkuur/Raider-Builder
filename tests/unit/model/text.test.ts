import { describe, expect, it } from "vitest";
import { defaultTextData } from "../../../src/lib/model/text";

describe("defaultTextData", () => {
  it("starts with empty text", () => {
    expect(defaultTextData()).toEqual({ text: "" });
  });
});
