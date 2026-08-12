import { test, expect } from "@playwright/test";

test.describe("half-width pairing UI", () => {
  test("a full-width section shows no Pair control", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Section", exact: true }).click();
    await expect(page.locator(".pair-slot")).toHaveCount(0);
  });

  test("pairing a Quick Look section onto a Contacts section renders them side-by-side, with no Unpair button and a drag handle on each side", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (half)", exact: true })
      .click();

    await page
      .locator(".row-view")
      .getByRole("button", { name: "Add paired section" })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Add section" }),
    ).toBeVisible();
    // The menu is filtered to half-width types only.
    await expect(
      page.getByRole("button", { name: "Equipment", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    await expect(page.locator(".row-view")).toHaveCount(1);
    const frames = page.locator(".row-view").first().locator(".section-frame");
    await expect(frames).toHaveCount(2);

    await expect(
      frames.getByRole("button", { name: "Unpair", exact: true }),
    ).toHaveCount(0);
    await expect(frames.locator(".drag-handle")).toHaveCount(2);
  });

  test("deleting one side of a pair removes the pairing, leaving the other section standalone", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (half)", exact: true })
      .click();
    await page
      .locator(".row-view")
      .getByRole("button", { name: "Add paired section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    const frames = page.locator(".row-view").first().locator(".section-frame");
    await frames.nth(1).getByRole("button", { name: "Delete section" }).click();

    await expect(page.locator(".row-view")).toHaveCount(1);
    await expect(page.locator(".section-frame")).toHaveCount(1);
    await expect(page.locator(".pair-slot")).toHaveCount(1);
  });

  test("dragging one side of a pair into a row gap unpairs it vertically", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (half)", exact: true })
      .click();
    await page
      .locator(".row-view")
      .getByRole("button", { name: "Add paired section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    await expect(page.locator(".row-view")).toHaveCount(1);
    const frames = page.locator(".row-view").first().locator(".section-frame");

    // Drag the second (Quick Look) section's handle to the trailing drop
    // zone, below the paired row.
    await frames
      .nth(1)
      .locator(".drag-handle")
      .dragTo(page.locator(".row-drop-zone").last());

    await expect(page.locator(".row-view")).toHaveCount(2);
    await expect(
      page.locator(".row-view").nth(0).locator(".section-frame"),
    ).toHaveCount(1);
    await expect(
      page.locator(".row-view").nth(1).locator(".section-frame"),
    ).toHaveCount(1);
    // Both are now standalone half-width sections, so each shows a pair
    // slot instead of a lingering drag handle.
    await expect(page.locator(".pair-slot")).toHaveCount(2);
  });

  test("dragging a standalone half section onto another's pair slot pairs them", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (half)", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Section" }).last().click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    await expect(page.locator(".row-view")).toHaveCount(2);
    await expect(page.locator(".pair-slot")).toHaveCount(2);

    await page
      .locator(".row-view")
      .nth(1)
      .locator(".row-view__handle")
      .dragTo(page.locator(".pair-slot").first());

    await expect(page.locator(".row-view")).toHaveCount(1);
    await expect(page.locator(".section-frame")).toHaveCount(2);
    await expect(page.locator(".pair-slot")).toHaveCount(0);
  });
});
