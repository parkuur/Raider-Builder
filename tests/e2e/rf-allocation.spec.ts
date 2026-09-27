import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { pointerDragTo } from "./utils/pointer-drag";
import { saveClearAndReload } from "./utils/save-load";

async function addRfAllocation(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page
    .getByRole("button", { name: "RF Allocation", exact: true })
    .click();
}

async function fillUnit(
  page: Page,
  index: number,
  unit: {
    device: string;
    window?: string;
    bandwidth?: string;
    frequency?: string;
    notes?: string;
  },
) {
  const row = page.locator(".rf-allocation tbody tr").nth(index);
  await row.locator(".rf-allocation__device-input").fill(unit.device);
  if (unit.window)
    await row.locator(".rf-allocation__window-input").fill(unit.window);
  if (unit.bandwidth)
    await row.locator(".rf-allocation__bandwidth-input").fill(unit.bandwidth);
  if (unit.frequency)
    await row.locator(".rf-allocation__frequency-input").fill(unit.frequency);
  if (unit.notes)
    await row.locator(".rf-allocation__notes-input").fill(unit.notes);
}

test.describe("RF Allocation section", () => {
  test("is listed under Planning in the Add Section menu", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await expect(
      page
        .getByRole("region", { name: "Planning" })
        .getByRole("button", { name: "RF Allocation", exact: true }),
    ).toBeVisible();
  });

  test("add, edit, reorder and remove wireless units", async ({ page }) => {
    await addRfAllocation(page);
    const addUnit = page.getByRole("button", { name: "+ Add Wireless Unit" });
    await addUnit.click();
    await addUnit.click();
    await addUnit.click();

    await fillUnit(page, 0, {
      device: "Vox 1",
      window: "470–608 MHz",
      bandwidth: "25 kHz",
      frequency: "606.125",
    });
    await fillUnit(page, 1, { device: "IEM A", frequency: "550.000" });
    await fillUnit(page, 2, {
      device: "Guitar TX",
      frequency: "520.500",
      notes: "Only during support act",
    });

    const rows = page.locator(".rf-allocation tbody tr");
    const devices = page.locator(".rf-allocation__device-input");
    await pointerDragTo(page, rows.nth(2).locator(".drag-handle"), rows.nth(0));
    await expect(devices.nth(0)).toHaveValue("Guitar TX");
    await expect(devices.nth(1)).toHaveValue("Vox 1");
    await expect(
      rows.nth(0).locator(".rf-allocation__notes-input"),
    ).toHaveValue("Only during support act");

    await rows
      .nth(1)
      .getByRole("button", { name: "Remove wireless unit" })
      .click();
    await expect(devices).toHaveCount(2);
    await expect(devices.nth(0)).toHaveValue("Guitar TX");
    await expect(devices.nth(1)).toHaveValue("IEM A");
  });

  test("units and column labels survive a save → load round trip", async ({
    page,
  }) => {
    await addRfAllocation(page);
    await page.getByRole("button", { name: "+ Add Wireless Unit" }).click();
    await fillUnit(page, 0, {
      device: "Vox 1",
      window: "G50",
      bandwidth: "25 kHz",
      frequency: "606.125",
      notes: "Backup on 607.250",
    });
    const headers = page.locator(".rf-allocation thead input");
    await expect(headers).toHaveCount(5);
    await expect(headers.nth(3)).toHaveValue("Frequency");
    await headers.nth(3).fill("Freq (MHz)");

    await saveClearAndReload(page);

    await expect(page.locator(".rf-allocation thead input").nth(3)).toHaveValue(
      "Freq (MHz)",
    );
    const row = page.locator(".rf-allocation tbody tr").first();
    await expect(row.locator(".rf-allocation__device-input")).toHaveValue(
      "Vox 1",
    );
    await expect(row.locator(".rf-allocation__window-input")).toHaveValue(
      "G50",
    );
    await expect(row.locator(".rf-allocation__bandwidth-input")).toHaveValue(
      "25 kHz",
    );
    await expect(row.locator(".rf-allocation__frequency-input")).toHaveValue(
      "606.125",
    );
    await expect(row.locator(".rf-allocation__notes-input")).toHaveValue(
      "Backup on 607.250",
    );
  });

  test("editing controls are hidden in print, values stay visible", async ({
    page,
  }) => {
    await addRfAllocation(page);
    await page.getByRole("button", { name: "+ Add Wireless Unit" }).click();
    await fillUnit(page, 0, { device: "Vox 1", frequency: "606.125" });

    await page.emulateMedia({ media: "print" });
    await expect(
      page.getByRole("button", { name: "+ Add Wireless Unit" }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Remove wireless unit" }),
    ).toBeHidden();
    await expect(page.locator(".rf-allocation__frequency-input")).toBeVisible();
  });
});
