import { test, expect } from "@playwright/test";

test.describe("Channel List mobile reflow", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("48V, Notes, and the stereo toggle move to a labeled second row, with no header labels for them", async ({
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

    // Header drops the 48V/Notes columns entirely on mobile.
    await expect(
      page.locator(".channel-list thead th", { hasText: "48V" }),
    ).toHaveCount(0);
    await expect(
      page.locator(".channel-list thead th", { hasText: "Notes" }),
    ).toHaveCount(0);

    // Primary row no longer carries 48V/Notes/stereo.
    const primaryRow = page.locator(".channel-list tbody tr").first();
    await expect(primaryRow.locator(".channel-list__phantom")).toHaveCount(0);
    await expect(primaryRow.locator(".channel-list__notes")).toHaveCount(0);
    await expect(
      primaryRow.getByRole("button", { name: "Mono", exact: true }),
    ).toHaveCount(0);

    // The mobile second row carries them instead, each with an inline label.
    const mobileRow = page.locator(".channel-list__row-mobile");
    await expect(mobileRow).toBeVisible();
    const fields = mobileRow.locator(".channel-list__mobile-field");
    await expect(fields.nth(0)).toContainText("48V");
    await expect(fields.nth(0).locator('input[type="checkbox"]')).toBeVisible();
    await expect(fields.nth(1)).toContainText("Notes");
    await expect(fields.nth(1).locator("textarea")).toBeVisible();
    await expect(
      mobileRow.getByRole("button", { name: "Mono", exact: true }),
    ).toBeVisible();

    // Only the primary row is a drag target; the mobile row is a visual
    // continuation of the same channel, not an independent one.
    await expect(mobileRow).not.toHaveAttribute("data-reorder-item");
  });

  test("print always renders the desktop single-row shape, regardless of the mobile viewport it was opened from", async ({
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

    await expect(page.locator(".channel-list__row-mobile")).toBeVisible();

    await page.emulateMedia({ media: "print" });

    await expect(
      page.locator(".channel-list thead th", { hasText: "48V" }),
    ).toBeVisible();
    await expect(
      page.locator(".channel-list thead th", { hasText: "Notes" }),
    ).toBeVisible();
    await expect(page.locator(".channel-list__phantom").first()).toBeVisible();
    await expect(page.locator(".channel-list__notes").first()).toBeVisible();
    await expect(page.locator(".channel-list__row-mobile")).toBeHidden();
  });
});
