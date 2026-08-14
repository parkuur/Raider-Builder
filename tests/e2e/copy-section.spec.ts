import { test, expect } from "@playwright/test";

test.describe("copy-lift/copy-place", () => {
  test("lifting a section for copy and placing it at a gap duplicates it, leaving the original in place", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();
    await page.locator(".section-frame__title").first().fill("Original");

    await expect(page.locator(".row-view")).toHaveCount(1);

    await page.getByRole("button", { name: "Copy this section" }).click();
    await page.locator(".row-gap__button").last().click();

    const titles = page.locator(".section-frame__title");
    await expect(titles).toHaveCount(2);
    await expect(titles.nth(0)).toHaveValue("Original");
    await expect(titles.nth(1)).toHaveValue("Original");
  });

  test("tapping the copy icon again cancels the copy-lift", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();

    const copyButton = page.getByRole("button", { name: "Copy this section" });
    await copyButton.click();
    await expect(copyButton).toHaveAttribute("aria-pressed", "true");
    await copyButton.click();
    await expect(copyButton).toHaveAttribute("aria-pressed", "false");

    await expect(page.locator(".row-view")).toHaveCount(1);
  });

  test("lifting a standalone half section for copy and placing it on another's pair slot duplicates it into the pair, leaving the original standalone", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (split)", exact: true })
      .click();
    await page.getByRole("button", { name: "Add Section" }).last().click();
    await page
      .getByRole("button", { name: "Quick Look (split)", exact: true })
      .click();

    await expect(page.locator(".row-view")).toHaveCount(2);
    await expect(page.locator(".pair-slot")).toHaveCount(2);

    await page
      .locator(".row-view")
      .nth(1)
      .getByRole("button", { name: "Copy this section" })
      .click();
    await page
      .locator(".pair-slot")
      .first()
      .getByRole("button", { name: "Place copy here to pair" })
      .click();

    // The original Quick Look row is untouched (still standalone), and the
    // Contacts row now has a duplicate Quick Look paired onto it.
    await expect(page.locator(".row-view")).toHaveCount(2);
    await expect(page.locator(".pair-slot")).toHaveCount(1);
    await expect(
      page.locator(".row-view").first().locator(".section-frame"),
    ).toHaveCount(2);
  });

  test("lifting a standalone half section for copy and placing it on its own pair slot pairs it with a copy of itself", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (split)", exact: true })
      .click();

    const row = page.locator(".row-view").first();
    await row.getByRole("button", { name: "Copy this section" }).click();
    await row
      .locator(".pair-slot")
      .getByRole("button", { name: "Place copy here to pair" })
      .click();

    await expect(page.locator(".row-view")).toHaveCount(1);
    await expect(row.locator(".section-frame")).toHaveCount(2);
    await expect(row.locator(".contacts-section")).toHaveCount(2);
  });
});
