import { test, expect } from "@playwright/test";
import { saveClearAndReload } from "./utils/save-load";

test.describe("Channel List hidden rows", () => {
  test.beforeEach(async ({ page }) => {
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
    await names.nth(0).fill("Kick");
    await names.nth(1).fill("Talkback");
    await names.nth(2).fill("Snare");
  });

  test("a hidden row is dimmed and skipped by numbering, and can be shown again", async ({
    page,
  }) => {
    const rows = page.locator(".channel-list tbody tr");
    const numbers = page.locator(".channel-list tbody .channel-list__num");

    await rows.nth(1).getByRole("button", { name: "Hide channel" }).click();

    await expect(rows.nth(1)).toHaveClass(/channel-list__row--hidden/);
    await expect(rows.nth(0)).not.toHaveClass(/channel-list__row--hidden/);
    const opacity = await rows
      .nth(1)
      .evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(opacity).toBeLessThan(1);
    await expect(numbers).toHaveText(["1", "", "2"]);

    // Stereo on a hidden row still claims no numbers.
    await rows
      .nth(1)
      .getByRole("button", { name: "Mono", exact: true })
      .click();
    await expect(numbers).toHaveText(["1", "", "2"]);

    await rows.nth(1).getByRole("button", { name: "Show channel" }).click();
    await expect(rows.nth(1)).not.toHaveClass(/channel-list__row--hidden/);
    await expect(numbers).toHaveText(["1", "2–3", "4"]);
  });

  test("a hidden row is left out of print", async ({ page }) => {
    const rows = page.locator(".channel-list tbody tr");
    await rows.nth(1).getByRole("button", { name: "Hide channel" }).click();

    await page.emulateMedia({ media: "print" });
    await expect(rows.nth(0)).toBeVisible();
    await expect(rows.nth(1)).toBeHidden();
    await expect(rows.nth(2)).toBeVisible();
    await expect(
      page.locator(".channel-list tbody .channel-list__num:visible"),
    ).toHaveText(["1", "2"]);

    // The row rule sits under every printed row except the last *printed*
    // one, even when the rows after it are hidden.
    const borderOf = (i: number) =>
      rows
        .nth(i)
        .locator("td")
        .first()
        .evaluate((el) => getComputedStyle(el).borderBottomStyle);
    expect(await borderOf(0)).toBe("solid");
    expect(await borderOf(2)).toBe("none");

    await page.emulateMedia({ media: "screen" });
    await rows.nth(2).getByRole("button", { name: "Hide channel" }).click();
    await page.emulateMedia({ media: "print" });
    expect(await borderOf(0)).toBe("none");
  });

  test("the hidden flag survives a save → load round trip", async ({
    page,
  }) => {
    await page
      .locator(".channel-list tbody tr")
      .nth(1)
      .getByRole("button", { name: "Hide channel" })
      .click();

    await saveClearAndReload(page);

    const rows = page.locator(".channel-list tbody tr");
    await expect(page.locator(".channel-list__name-input")).toHaveCount(3);
    await expect(rows.nth(1)).toHaveClass(/channel-list__row--hidden/);
    await expect(
      rows.nth(1).getByRole("button", { name: "Show channel" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.locator(".channel-list tbody .channel-list__num"),
    ).toHaveText(["1", "", "2"]);
  });
});
