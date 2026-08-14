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

test.describe("print layout", () => {
  test("a populated instance of every section type prints without overflow or clipping", async ({
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

    await addSection(page, "Stage Map");
    await page.getByRole("button", { name: "MIC", exact: true }).click();
    await page.getByRole("button", { name: "RISER", exact: true }).click();
    await page
      .locator(".stage-map__label")
      .first()
      .fill("Lead Vocal Microphone Position");

    await addSection(page, "Requirements");
    await page.getByRole("button", { name: "+ Add Item" }).click();
    await page.locator(".requirements-section__heading").fill("Power");
    await page
      .locator(".requirements-section__text")
      .fill(
        "Two dedicated 20A circuits, isolated from lighting, run to stage left and stage right.",
      );

    await addSection(page, "Equipment");
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
    await page.locator(".contacts-section__name").fill("Jamie Rivera");
    await page
      .locator(".row-view")
      .filter({ has: page.locator(".contacts-section") })
      .getByRole("button", { name: "Add paired section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (split)", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Topic" }).click();
    await page.getByRole("menuitem", { name: "Row", exact: true }).click();
    await page.getByRole("button", { name: "+ Add Topic" }).click();
    await page.getByRole("menuitem", { name: "Table", exact: true }).click();

    await page.emulateMedia({ media: "print" });

    const checks: Array<[string, Locator]> = [
      ["channel list table", page.locator(".channel-list")],
      ["monitor list table", page.locator(".monitor-list")],
      ["band members grid", page.locator(".band-members__grid")],
      ["stage map canvas", page.locator(".stage-map__canvas")],
      ["requirements section", page.locator(".requirements-section")],
      ["equipment section", page.locator(".equipment-section")],
      ["contacts section", page.locator(".contacts-section")],
      ["quicklook section", page.locator(".quicklook-section")],
    ];

    for (const [, locator] of checks) {
      await expect(locator).toBeVisible();
      await expectNoOverflow(locator);
    }

    // The document shell itself must not force horizontal overflow either.
    await expectNoOverflow(page.locator(".document-shell"));
  });

  test("Band Members grid keeps balanced row grouping under print media", async ({
    page,
  }) => {
    await page.goto("/");
    await addFirstSection(page, "Band Members");
    const addMember = page.getByRole("button", { name: "+ Add Member" });
    for (let i = 0; i < 7; i++) await addMember.click();

    await page.emulateMedia({ media: "print" });

    const rowCounts = await page
      .locator(".band-members__row")
      .evaluateAll((els) =>
        els.map((el) => el.querySelectorAll(".band-members__card").length),
      );
    expect(rowCounts).toEqual([4, 3]);
  });

  test("hiding one side of a paired row drops the divider in print, and hiding both hides the row", async ({
    page,
  }) => {
    await page.goto("/");
    await addFirstSection(page, "Contacts (split)");
    await page
      .locator(".row-view")
      .filter({ has: page.locator(".contacts-section") })
      .getByRole("button", { name: "Add paired section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (split)", exact: true })
      .click();

    const row = page
      .locator(".row-view")
      .filter({ has: page.locator(".contacts-section") });
    const contactsFrame = row.locator(".section-frame").first();
    const quicklookFrame = row.locator(".section-frame").nth(1);

    await contactsFrame.getByRole("button", { name: "Hide section" }).click();
    await page.emulateMedia({ media: "print" });
    await expect(quicklookFrame).toHaveCSS("border-left-style", "none");

    await page.emulateMedia({ media: "screen" });
    await quicklookFrame.getByRole("button", { name: "Hide section" }).click();
    await page.emulateMedia({ media: "print" });
    await expect(row).toBeHidden();
  });
});
