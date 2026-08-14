import { test, expect } from "@playwright/test";

test("print media hides editing chrome but keeps document content", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();
  await page.locator(".document-header__title").fill("Printable Rider");
  await page.locator(".section-frame__title").first().fill("Printable Section");

  await page.emulateMedia({ media: "print" });

  await expect(page.getByRole("button", { name: "Save" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Load" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Print / PDF" })).toBeHidden();
  await expect(page.locator(".row-gap").first()).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Add Section" }).first(),
  ).toBeHidden();
  await expect(page.locator(".section-frame__actions")).toBeHidden();

  await expect(page.locator(".document-header__title")).toBeVisible();
  await expect(page.locator(".section-frame__title")).toBeVisible();
});

test("empty fields print with no placeholder text, filled fields print their value", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();
  await page.getByRole("button", { name: "+ Add Item" }).click();
  await page.locator(".requirements-section__heading").fill("Power");
  // Leave the Details field empty on purpose.

  await page.emulateMedia({ media: "print" });

  const heading = page.locator(".requirements-section__heading");
  const details = page.locator(".requirements-section__text");
  await expect(heading).toHaveCSS("visibility", "visible");
  await expect(details).toHaveCSS("visibility", "hidden");
  await expect(heading).toHaveValue("Power");
});
