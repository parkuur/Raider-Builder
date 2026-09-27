import { test, expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

async function addFirstSection(page: Page, label: string) {
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: label, exact: true }).click();
}

async function addSection(page: Page, label: string) {
  await page.getByRole("button", { name: "Add Section" }).last().click();
  await page.getByRole("button", { name: label, exact: true }).click();
}

async function expectNoOverflow(locator: Locator) {
  const overflow = await locator.evaluate(
    (el) => el.scrollWidth - el.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("no horizontal overflow at a 360px viewport", () => {
  test.use({ viewport: { width: 360, height: 900 } });

  test("no section forces the page itself to scroll horizontally", async ({
    page,
  }) => {
    await page.goto("/");
    await addFirstSection(page, "Channel List");
    await page.getByRole("button", { name: "+ Add Channel" }).click();
    await page
      .locator(".channel-list__name-input")
      .fill("Kick In Microphone With A Long Descriptive Label");

    await addSection(page, "Monitor List");
    await page.getByRole("button", { name: "+ Add Monitor" }).click();
    await page.locator(".monitor-list__player-input").fill("Vocalist");

    await addSection(page, "Band Members");
    const addMember = page.getByRole("button", { name: "+ Add Member" });
    for (let i = 0; i < 9; i++) await addMember.click();

    await addSection(page, "Requirements");
    await page.getByRole("button", { name: "+ Add Item" }).click();

    await addSection(page, "Equipment (split)");
    await page
      .getByRole("button", { name: "+ Add item", exact: true })
      .first()
      .click();
    await page
      .locator(".equipment-section__item-name")
      .first()
      .fill("PA System With Subwoofers");

    await addSection(page, "Contacts (split)");
    await page.getByRole("button", { name: "+ Add Contact" }).click();
    await page
      .locator(".row-view")
      .filter({ has: page.locator(".contacts-section") })
      .locator(".split-edge-slot__button")
      .click();
    await page
      .getByRole("button", { name: "Quick Look (split)", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Topic" }).click();
    await page.getByRole("menuitem", { name: "Row", exact: true }).click();

    await addSection(page, "Setlist (split)");
    await page.getByRole("button", { name: "+ Add Song" }).click();
    await page
      .locator(".setlist__song-input")
      .fill("A Very Long Song Title That Has To Wrap In A Narrow Column");

    await addSection(page, "RF Allocation");
    await page.getByRole("button", { name: "+ Add Wireless Unit" }).click();
    await page
      .locator(".rf-allocation__device-input")
      .fill("Lead Vocal Handheld Transmitter");
    await page.locator(".rf-allocation__frequency-input").fill("606.125");

    await addSection(page, "Packing List");
    await page.getByRole("button", { name: "+ Add group" }).click();
    await page
      .getByRole("textbox", { name: "Group heading" })
      .fill("Audio case");
    await page.getByRole("button", { name: "Add item to group" }).click();
    await page
      .locator(".packing-list__item-input")
      .fill("XLR cables, assorted lengths, plus two spare");

    await addSection(page, "Schedule");
    await page.getByRole("button", { name: "+ Add slot" }).click();
    await page.locator(".schedule__start-input").fill("17:00");
    await page.getByRole("button", { name: "+ Add row" }).click();
    await page.locator(".schedule__title-input").nth(0).fill("Soundcheck");
    await page.locator(".schedule__title-input").nth(1).fill("Line check");

    const checks: Locator[] = [
      page.locator(".band-members__grid"),
      page.locator(".requirements-section"),
      page.locator(".equipment-section"),
      page.locator(".contacts-section"),
      page.locator(".quicklook-section"),
      page.locator(".setlist"),
    ];

    for (const locator of checks) {
      await expect(locator).toBeVisible();
      await expectNoOverflow(locator);
    }

    // Channel List and Monitor List are dense multi-column tables that may
    // still need a contained horizontal swipe on the narrowest phones — the
    // requirement is that *they* contain it, not that they never need it.
    await expect(page.locator(".channel-list")).toBeVisible();
    await expect(page.locator(".monitor-list")).toBeVisible();
    // Likewise the wide planning tables, which scroll inside their own
    // `.data-table-scroll` wrapper.
    for (const table of [".rf-allocation", ".packing-list", ".schedule"]) {
      await expect(page.locator(table)).toBeVisible();
      const scroll = page
        .locator(".data-table-scroll")
        .filter({ has: page.locator(table) });
      expect(
        await scroll.evaluate((el) => getComputedStyle(el).overflowX),
      ).toBe("auto");
    }

    // The page itself must never scroll horizontally, regardless.
    await expectNoOverflow(page.locator(".document-shell"));
    await expectNoOverflow(page.locator("body"));
  });
});
