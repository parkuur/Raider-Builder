import { describe, expect, it } from "vitest";
import { createId } from "../../../src/lib/model/id";

describe("createId", () => {
  it("prefixes the id with the given prefix", () => {
    expect(createId("row")).toMatch(/^row_/);
  });

  it("produces different ids on successive calls", () => {
    expect(createId("row")).not.toBe(createId("row"));
  });
});
