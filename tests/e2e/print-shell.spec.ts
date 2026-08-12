import { test, expect } from "@playwright/test";

test("print media hides editing chrome but keeps document content", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Section", exact: true }).click();
  await page.locator(".document-header__title").fill("Printable Rider");
  await page.locator(".section-frame__title").first().fill("Printable Section");

  await page.emulateMedia({ media: "print" });

  await expect(page.getByRole("button", { name: "Save" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Load" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Print / PDF" })).toBeHidden();
  await expect(page.locator(".row-view__handle")).toBeHidden();
  await expect(page.locator(".row-drop-zone").first()).toBeHidden();
  await expect(
    page.getByRole("button", { name: "+ Add Section" }).first(),
  ).toBeHidden();
  await expect(page.locator(".section-frame__actions")).toBeHidden();

  await expect(page.locator(".document-header__title")).toBeVisible();
  await expect(page.locator(".section-frame__title")).toBeVisible();
});
