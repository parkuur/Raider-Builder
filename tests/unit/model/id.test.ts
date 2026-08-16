import { afterEach, describe, expect, it } from "vitest";
import { createId } from "../../../src/lib/model/id";

describe("createId", () => {
  it("prefixes the id with the given prefix", () => {
    expect(createId("row")).toMatch(/^row_/);
  });

  it("produces different ids on successive calls", () => {
    expect(createId("row")).not.toBe(createId("row"));
  });

  describe("without crypto.randomUUID (e.g. a non-secure context)", () => {
    const originalRandomUUID = crypto.randomUUID;

    afterEach(() => {
      crypto.randomUUID = originalRandomUUID;
    });

    it("falls back to a v4 UUID built from crypto.getRandomValues", () => {
      // @ts-expect-error simulating an insecure context, where
      // crypto.randomUUID is undefined but crypto.getRandomValues isn't.
      crypto.randomUUID = undefined;

      const id = createId("row");
      expect(id).toMatch(
        /^row_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(createId("row")).not.toBe(createId("row"));
    });
  });
});
