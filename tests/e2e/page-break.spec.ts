import { test, expect } from "@playwright/test";

test.describe("Page Break section", () => {
  test("adds with no title input, and forces a page break in print", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();

    await page.getByRole("button", { name: "Add Section" }).last().click();
    await page.getByRole("button", { name: "Page Break", exact: true }).click();

    await expect(page.locator(".row-view")).toHaveCount(2);
    const pageBreakFrame = page.locator('[data-section-type="page-break"]');
    await expect(pageBreakFrame).toBeVisible();
    await expect(pageBreakFrame.locator(".section-frame__title")).toHaveCount(
      0,
    );

    await page.emulateMedia({ media: "print" });
    const breakBefore = await pageBreakFrame.evaluate(
      (el) => getComputedStyle(el).breakBefore,
    );
    expect(breakBefore).toBe("page");
  });
});
