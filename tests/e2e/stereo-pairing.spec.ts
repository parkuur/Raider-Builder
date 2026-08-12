import { test, expect } from "@playwright/test";

test.describe("Channel List stereo pairing", () => {
  test("numbering stays correct through pairing, reorder, and deleting one side of a pair", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Channel List", exact: true })
      .click();

    const addChannel = page.getByRole("button", { name: "+ Add Channel" });
    await addChannel.click();
    await addChannel.click();
    await addChannel.click();
    await addChannel.click();

    const names = page.locator(".channel-list__name-input");
    await names.nth(0).fill("A");
    await names.nth(1).fill("B");
    await names.nth(2).fill("C");
    await names.nth(3).fill("D");

    const rows = page.locator(".channel-list tbody tr");
    const numbers = page.locator(".channel-list tbody .channel-list__num");

    async function expectNameOrder(expected: string[]) {
      for (let i = 0; i < expected.length; i++) {
        await expect(names.nth(i)).toHaveValue(expected[i]!);
      }
    }

    // Unpaired: sequential 1..4.
    await expect(numbers).toHaveText(["1", "2", "3", "4"]);

    // Pair B (row 1) with C (row 2).
    await rows
      .nth(1)
      .getByRole("button", { name: "Pair", exact: true })
      .click();
    await expect(numbers).toHaveText(["1", "2–3", "", "4"]);

    // Move D (last row) up above the pair, without interposing between B and
    // C — the pair must stay adjacent and keep showing a combined label,
    // just renumbered.
    await rows.nth(3).getByRole("button", { name: "Move up" }).click();
    await rows.nth(2).getByRole("button", { name: "Move up" }).click();
    await rows.nth(1).getByRole("button", { name: "Move up" }).click();
    await expectNameOrder(["D", "A", "B", "C"]);
    await expect(numbers).toHaveText(["1", "2", "3–4", ""]);

    // Delete one side of the pair (C, now the last row) — the surviving
    // partner (B) must fall back to a normal number, and no later row's
    // numbering is corrupted (there are none left, but the sequence up to
    // B must remain 1, 2, 3).
    await rows.nth(3).getByRole("button", { name: "Remove" }).click();
    await expectNameOrder(["D", "A", "B"]);
    await expect(numbers).toHaveText(["1", "2", "3"]);
  });

  test("editing controls are hidden in print, content stays visible", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Channel List", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Channel" }).click();
    await page.locator(".channel-list__name-input").fill("Kick In");

    await page.emulateMedia({ media: "print" });

    await expect(
      page.getByRole("button", { name: "+ Add Channel" }),
    ).toBeHidden();
    await expect(page.locator(".channel-list__actions").first()).toBeHidden();
    await expect(page.locator(".channel-list__name-input")).toBeVisible();
  });
});
