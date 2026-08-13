import { test, expect } from "@playwright/test";

test.describe("add-section flow and empty state", () => {
  test("empty document shows a call-to-action and no rows", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByText("This rider is empty. Add a section to get started."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "+ Add your first section" }),
    ).toBeVisible();
    await expect(page.locator(".row-view")).toHaveCount(0);
  });

  test("picking a type from the menu inserts a row with default content", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Add section" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();
    await expect(page.locator(".row-view")).toHaveCount(1);
    await expect(
      page.getByText("This rider is empty. Add a section to get started."),
    ).toHaveCount(0);
  });

  test("Add Section triggers place new rows at start, between, and end", async ({
    page,
  }) => {
    await page.goto("/");

    // First section, via the empty-state CTA.
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();
    await page.locator(".section-frame__title").nth(0).fill("A");

    // "End" trigger — the last gap, after row A.
    await page.getByRole("button", { name: "Add Section" }).last().click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();
    await page.locator(".section-frame__title").nth(1).fill("C");

    // "Between" trigger — the gap between A and C (index 1 of 3 triggers).
    await page.getByRole("button", { name: "Add Section" }).nth(1).click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();
    await page.locator(".section-frame__title").nth(1).fill("B");

    // "Start" trigger — the first gap, before row A.
    await page.getByRole("button", { name: "Add Section" }).first().click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();
    await page.locator(".section-frame__title").nth(0).fill("Start");

    const titles = page.locator(".section-frame__title");
    await expect(titles).toHaveCount(4);
    await expect(titles.nth(0)).toHaveValue("Start");
    await expect(titles.nth(1)).toHaveValue("A");
    await expect(titles.nth(2)).toHaveValue("B");
    await expect(titles.nth(3)).toHaveValue("C");
  });

  test("cancel closes the menu without adding a row", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog", { name: "Add section" })).toHaveCount(
      0,
    );
    await expect(page.locator(".row-view")).toHaveCount(0);
  });
});
