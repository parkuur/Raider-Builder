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

    await addSection(page, "Equipment");
    await page
      .getByRole("button", { name: "+ Add item", exact: true })
      .first()
      .click();
    await page
      .locator(".equipment-section__item-name")
      .first()
      .fill("PA System With Subwoofers");

    await addSection(page, "Contacts (half)");
    await page.getByRole("button", { name: "+ Add Contact" }).click();
    await page
      .locator(".row-view")
      .filter({ has: page.locator(".contacts-section") })
      .getByRole("button", { name: "Add paired section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Topic" }).click();
    await page.getByRole("menuitem", { name: "Row", exact: true }).click();

    const checks: Locator[] = [
      page.locator(".band-members__grid"),
      page.locator(".requirements-section"),
      page.locator(".equipment-section"),
      page.locator(".contacts-section"),
      page.locator(".quicklook-section"),
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

    // The page itself must never scroll horizontally, regardless.
    await expectNoOverflow(page.locator(".document-shell"));
    await expectNoOverflow(page.locator("body"));
  });
});
