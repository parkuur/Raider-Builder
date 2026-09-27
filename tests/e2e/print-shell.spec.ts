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

test("empty fields in the planning sections print with no placeholder text", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page
    .getByRole("button", { name: "Setlist (split)", exact: true })
    .click();
  await page.getByRole("button", { name: "+ Add Song" }).click();
  await page.locator(".setlist__song-input").fill("Opener");

  for (const [label, add] of [
    ["RF Allocation", "+ Add Wireless Unit"],
    ["Packing List", "+ Add item"],
    ["Schedule", "+ Add slot"],
  ] as const) {
    await page.getByRole("button", { name: "Add Section" }).last().click();
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.getByRole("button", { name: add }).click();
  }
  await page.getByRole("button", { name: "+ Add group" }).first().click();
  await page.locator(".schedule__start-input").fill("17:00");

  await page.emulateMedia({ media: "print" });

  for (const selector of [
    ".setlist__artist-input",
    ".setlist__notes-input",
    ".rf-allocation__device-input",
    ".rf-allocation__frequency-input",
    ".rf-allocation__notes-input",
    ".packing-list__item-input",
    ".packing-list__source-input",
    ".schedule__title-input",
    ".schedule__who-input",
  ]) {
    await expect(page.locator(selector).first()).toHaveCSS(
      "visibility",
      "hidden",
    );
  }
  await expect(page.locator(".setlist__song-input")).toHaveCSS(
    "visibility",
    "visible",
  );
  await expect(page.locator(".schedule__time-print")).toHaveText("17:00");
});
