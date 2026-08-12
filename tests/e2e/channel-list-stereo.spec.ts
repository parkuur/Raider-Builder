import { test, expect } from "@playwright/test";

test.describe("Channel List stereo channels", () => {
  test("numbering accounts for a stereo channel using two numbers, through reorder and deletion", async ({
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

    const names = page.locator(".channel-list__name-input");
    await names.nth(0).fill("A");
    await names.nth(1).fill("B");
    await names.nth(2).fill("C");

    const rows = page.locator(".channel-list tbody tr");
    const numbers = page.locator(".channel-list tbody .channel-list__num");

    async function expectNameOrder(expected: string[]) {
      for (let i = 0; i < expected.length; i++) {
        await expect(names.nth(i)).toHaveValue(expected[i]!);
      }
    }

    // Mono by default: sequential 1..3.
    await expect(numbers).toHaveText(["1", "2", "3"]);

    // Marking B stereo claims two numbers for its own row — no second row
    // is involved.
    await rows
      .nth(1)
      .getByRole("button", { name: "Mono", exact: true })
      .click();
    await expect(numbers).toHaveText(["1", "2–3", "4"]);

    // Reordering keeps the combined label attached to the same row.
    await rows.nth(2).locator(".drag-handle").dragTo(rows.nth(0));
    await expectNameOrder(["C", "A", "B"]);
    await expect(numbers).toHaveText(["1", "2", "3–4"]);

    // Toggling back to mono restores sequential numbering.
    await rows
      .nth(2)
      .getByRole("button", { name: "Stereo", exact: true })
      .click();
    await expect(numbers).toHaveText(["1", "2", "3"]);

    // Deleting a row never leaves a dangling partner to clean up.
    await rows.nth(0).getByRole("button", { name: "Remove channel" }).click();
    await expectNameOrder(["A", "B"]);
    await expect(numbers).toHaveText(["1", "2"]);
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

  test("printed rows show a rule between them but not below the last row", async ({
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

    await page.emulateMedia({ media: "print" });

    const rows = page.locator(".channel-list tbody tr");
    const firstBorder = await rows
      .nth(0)
      .locator("td")
      .first()
      .evaluate((el) => getComputedStyle(el).borderBottomStyle);
    expect(firstBorder).toBe("solid");

    const lastBorder = await rows
      .nth(1)
      .locator("td")
      .first()
      .evaluate((el) => getComputedStyle(el).borderBottomStyle);
    expect(lastBorder).toBe("none");
  });
});
