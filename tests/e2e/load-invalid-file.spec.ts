import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => path.join(__dirname, "fixtures", name);

test.describe("loading an invalid file", () => {
  test("rejects text that isn't valid JSON, leaving the document unchanged", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".document-header__title").fill("Keep Me");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page.getByRole("button", { name: "Section", exact: true }).click();

    await page
      .locator('input[type="file"]')
      .setInputFiles(fixture("not-json.txt"));

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.locator(".document-header__title")).toHaveValue(
      "Keep Me",
    );
    await expect(page.locator(".row-view")).toHaveCount(1);
  });

  test("rejects a structurally invalid document, leaving the document unchanged", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".document-header__title").fill("Keep Me Too");

    await page
      .locator('input[type="file"]')
      .setInputFiles(fixture("invalid-document.json"));

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.locator(".document-header__title")).toHaveValue(
      "Keep Me Too",
    );
  });
});
