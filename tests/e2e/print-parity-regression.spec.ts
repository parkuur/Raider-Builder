import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Epic 06's closing QA pass: one populated instance of every section type,
 * printed from both a mobile-width and a desktop-width originating
 * viewport, must produce the same structural print layout — proving the
 * screen-only mobile rules added throughout this epic (divider rules,
 * stacking, edge-to-edge padding, the Stage Map scale) never leak into
 * print, regardless of the browser window's width when printing happens.
 */

async function buildDocument(page: Page): Promise<void> {
  await page.goto("/");

  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Channel List", exact: true }).click();
  await page.getByRole("button", { name: "+ Add Channel" }).click();
  await page
    .locator(".channel-list__name-input")
    .fill("Kick In Microphone With A Long Descriptive Label");

  await page.getByRole("button", { name: "+ Add Section" }).last().click();
  await page.getByRole("button", { name: "Monitor List", exact: true }).click();
  await page.getByRole("button", { name: "+ Add Monitor" }).click();
  await page.locator(".monitor-list__player-input").fill("Vocalist");

  await page.getByRole("button", { name: "+ Add Section" }).last().click();
  await page.getByRole("button", { name: "Band Members", exact: true }).click();
  const addMember = page.getByRole("button", { name: "+ Add Member" });
  for (let i = 0; i < 7; i++) await addMember.click();

  await page.getByRole("button", { name: "+ Add Section" }).last().click();
  await page.getByRole("button", { name: "Stage Map", exact: true }).click();
  await page.getByRole("button", { name: "MIC", exact: true }).click();
  await page.getByRole("button", { name: "RISER", exact: true }).click();

  await page.getByRole("button", { name: "+ Add Section" }).last().click();
  await page.getByRole("button", { name: "Requirements", exact: true }).click();
  await page.getByRole("button", { name: "+ Add Item" }).click();
  await page.locator(".requirements-section__heading").fill("Power");

  await page.getByRole("button", { name: "+ Add Section" }).last().click();
  await page.getByRole("button", { name: "Equipment", exact: true }).click();
  await page
    .getByRole("button", { name: "+ Add item", exact: true })
    .first()
    .click();
  await page
    .locator(".equipment-section__item-name")
    .first()
    .fill("PA System With Subwoofers");

  await page.getByRole("button", { name: "+ Add Section" }).last().click();
  await page
    .getByRole("button", { name: "Contacts (half)", exact: true })
    .click();
  await page.getByRole("button", { name: "+ Add Contact" }).click();
  await page.locator(".contacts-section__name").fill("Jamie Rivera");
  await page
    .locator(".row-view")
    .filter({ has: page.locator(".contacts-section") })
    .getByRole("button", { name: "Add paired section" })
    .click();
  await page
    .getByRole("button", { name: "Quick Look (half)", exact: true })
    .click();
  await page.getByRole("button", { name: "+ Add Row Topic" }).click();
}

interface PrintFingerprint {
  anySectionBordered: boolean;
  pairedRowFlexDirection: string;
  equipmentColumnCount: number;
  stageMapTransform: string;
  visibleNoPrintCount: number;
  pageOverflowsHorizontally: boolean;
}

async function capturePrintFingerprint(page: Page): Promise<PrintFingerprint> {
  await page.emulateMedia({ media: "print" });
  const fingerprint = await page.evaluate(() => {
    const frames = Array.from(document.querySelectorAll(".section-frame"));
    const anySectionBordered = frames.some((el) => {
      const style = getComputedStyle(el);
      return style.borderStyle !== "none" && parseFloat(style.borderWidth) > 0;
    });

    const pairedSections = document.querySelector(
      ".row-view__sections--paired",
    );
    const pairedRowFlexDirection = pairedSections
      ? getComputedStyle(pairedSections).flexDirection
      : "";

    const equipment = document.querySelector(".equipment-section");
    const equipmentColumnCount = equipment
      ? getComputedStyle(equipment).gridTemplateColumns.trim().split(/\s+/)
          .length
      : 0;

    const canvas = document.querySelector(".stage-map__canvas");
    const stageMapTransform = canvas ? getComputedStyle(canvas).transform : "";

    const visibleNoPrintCount = Array.from(
      document.querySelectorAll(".no-print"),
    ).filter((el) => getComputedStyle(el).display !== "none").length;

    const pageOverflowsHorizontally =
      document.body.scrollWidth - document.body.clientWidth > 1;

    return {
      anySectionBordered,
      pairedRowFlexDirection,
      equipmentColumnCount,
      stageMapTransform,
      visibleNoPrintCount,
      pageOverflowsHorizontally,
    };
  });
  await page.emulateMedia({ media: "screen" });
  return fingerprint;
}

test("print layout is identical whether the document was opened at a mobile or a desktop viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await buildDocument(page);
  const mobileOriginated = await capturePrintFingerprint(page);

  await page.setViewportSize({ width: 1280, height: 900 });
  const desktopOriginated = await capturePrintFingerprint(page);

  expect(mobileOriginated).toEqual(desktopOriginated);

  // And the shared result must actually be the desktop-shaped, print-correct
  // one — not two viewports agreeing on a broken layout.
  expect(mobileOriginated).toEqual({
    anySectionBordered: false,
    pairedRowFlexDirection: "row",
    equipmentColumnCount: 2,
    stageMapTransform: "none",
    visibleNoPrintCount: 0,
    pageOverflowsHorizontally: false,
  });
});
