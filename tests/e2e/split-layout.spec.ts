import { test, expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

async function addFirstSection(page: Page, label: string) {
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: label, exact: true }).click();
}

async function addSection(page: Page, label: string) {
  await page.getByRole("button", { name: "Add Section" }).last().click();
  await page.getByRole("button", { name: label, exact: true }).click();
}

/** Clicks the trailing edge-slot on the row containing `withinLocator`. */
async function clickEdgeSlot(page: Page, withinLocator: Locator) {
  await withinLocator.locator(".split-edge-slot__button").click();
}

test.describe("solo split sections", () => {
  test("a full-width section shows no split-edge affordance", async ({
    page,
  }) => {
    await addFirstSection(page, "Requirements");
    await expect(page.locator(".split-edge-slot")).toHaveCount(0);
  });

  test("a solo split section renders near-full-width with a trailing edge slot, not an immediate split layout", async ({
    page,
  }) => {
    await addFirstSection(page, "Contacts (split)");

    await expect(page.locator(".row-view")).toHaveCount(1);
    await expect(page.locator(".row-view__column")).toHaveCount(0);
    await expect(page.locator(".split-edge-slot")).toHaveCount(1);

    const sectionBox = await page.locator(".section-frame").boundingBox();
    const rowBox = await page.locator(".row-view__sections").boundingBox();
    expect(sectionBox && rowBox).toBeTruthy();
    // Near-full-width, not the old 50/50 split.
    expect(sectionBox!.width / rowBox!.width).toBeGreaterThan(0.8);
  });
});

test.describe("promoting a solo section into a split layout", () => {
  test("clicking the edge slot and picking a type creates a split layout with a divider badge", async ({
    page,
  }) => {
    await addFirstSection(page, "Contacts (split)");
    const row = page.locator(".row-view").first();
    await clickEdgeSlot(page, row);
    await expect(
      page.getByRole("button", { name: "Equipment", exact: true }),
    ).toHaveCount(0); // menu filtered to split types only
    await page
      .getByRole("button", { name: "Quick Look (split)", exact: true })
      .click();

    await expect(page.locator(".row-view")).toHaveCount(1);
    await expect(page.locator(".row-view__column")).toHaveCount(2);
    await expect(page.locator(".row-view__split-badge")).toHaveCount(1);
    await expect(page.locator(".split-edge-slot")).toHaveCount(0);
  });

  test("moving a solo section onto another's edge slot promotes the target and removes the source row", async ({
    page,
  }) => {
    await addFirstSection(page, "Contacts (split)");
    await addSection(page, "Quick Look (split)");
    await expect(page.locator(".row-view")).toHaveCount(2);

    const secondRow = page.locator(".row-view").nth(1);
    await secondRow.getByRole("button", { name: "Move this section" }).click();
    const firstRow = page.locator(".row-view").nth(0);
    await clickEdgeSlot(page, firstRow);

    await expect(page.locator(".row-view")).toHaveCount(1);
    await expect(page.locator(".row-view__column")).toHaveCount(2);
  });

  test("copying a solo section onto its own edge slot splits it with a copy of itself", async ({
    page,
  }) => {
    await addFirstSection(page, "Contacts (split)");
    const row = page.locator(".row-view").first();
    await row.getByRole("button", { name: "Copy this section" }).click();
    await clickEdgeSlot(page, row);

    await expect(page.locator(".row-view")).toHaveCount(1);
    await expect(row.locator(".contacts-section")).toHaveCount(2);
  });
});

test.describe("column stacking and reordering", () => {
  async function buildSplitRow(page: Page): Promise<Locator> {
    await addFirstSection(page, "Contacts (split)");
    const row = page.locator(".row-view").first();
    await clickEdgeSlot(page, row);
    await page
      .getByRole("button", { name: "Quick Look (split)", exact: true })
      .click();
    return row;
  }

  test("adding via a column's own gaps stacks multiple items in that column independently of the other side", async ({
    page,
  }) => {
    const row = await buildSplitRow(page);
    const column0 = row.locator(".row-view__column").nth(0);
    const column1 = row.locator(".row-view__column").nth(1);

    await column0.locator(".row-gap__button").last().click();
    await page
      .getByRole("button", { name: "Text (split)", exact: true })
      .click();

    await expect(column0.locator(".section-frame")).toHaveCount(2);
    await expect(column1.locator(".section-frame")).toHaveCount(1);
  });

  test("reordering within a column via lift-and-place preserves the other column", async ({
    page,
  }) => {
    const row = await buildSplitRow(page);
    const column0 = row.locator(".row-view__column").nth(0);
    await column0.locator(".row-gap__button").last().click();
    await page
      .getByRole("button", { name: "Text (split)", exact: true })
      .click();

    // column0 is now [Contacts, Text]; lift Text and drop it before Contacts.
    await column0
      .locator(".section-frame")
      .nth(1)
      .getByRole("button", { name: "Move this section" })
      .click();
    await column0.locator(".row-gap__button").first().click();

    await expect(column0.locator(".contacts-section")).toHaveCount(1);
    await expect(column0.locator(".text-section__body")).toHaveCount(1);
    const firstFrame = column0.locator(".section-frame").first();
    await expect(firstFrame.locator(".text-section__body")).toHaveCount(1);
    await expect(
      row.locator(".row-view__column").nth(1).locator(".section-frame"),
    ).toHaveCount(1);
  });

  test("moving an item across columns of the same split row", async ({
    page,
  }) => {
    const row = await buildSplitRow(page);
    const column0 = row.locator(".row-view__column").nth(0);
    const column1 = row.locator(".row-view__column").nth(1);
    // Give column0 a second item first so moving one away doesn't empty it
    // (which would collapse the whole row — a different behavior, covered
    // separately under "collapse").
    await column0.locator(".row-gap__button").last().click();
    await page
      .getByRole("button", { name: "Text (split)", exact: true })
      .click();

    await column0
      .locator(".section-frame")
      .first()
      .getByRole("button", { name: "Move this section" })
      .click();
    await column1.locator(".row-gap__button").last().click();

    await expect(column0.locator(".section-frame")).toHaveCount(1);
    await expect(column1.locator(".section-frame")).toHaveCount(2);
  });

  test("moving an item into a different split row's column", async ({
    page,
  }) => {
    const row = await buildSplitRow(page);
    const column0 = row.locator(".row-view__column").nth(0);
    await column0.locator(".row-gap__button").last().click();
    await page
      .getByRole("button", { name: "Text (split)", exact: true })
      .click();

    await addSection(page, "Contacts (split)");
    await clickEdgeSlot(page, page.locator(".row-view").nth(1));
    await page
      .getByRole("button", { name: "Quick Look (split)", exact: true })
      .click();

    const firstRow = page.locator(".row-view").nth(0);
    const secondRow = page.locator(".row-view").nth(1);

    await column0
      .locator(".section-frame")
      .first()
      .getByRole("button", { name: "Move this section" })
      .click();
    await secondRow
      .locator(".row-view__column")
      .nth(0)
      .locator(".row-gap__button")
      .last()
      .click();

    await expect(
      firstRow.locator(".row-view__column").nth(0).locator(".section-frame"),
    ).toHaveCount(1);
    await expect(
      secondRow.locator(".row-view__column").nth(0).locator(".section-frame"),
    ).toHaveCount(2);
  });
});

test.describe("collapse", () => {
  test("removing the sole item in one column collapses the layout into solo rows from the surviving column, in order", async ({
    page,
  }) => {
    await addFirstSection(page, "Contacts (split)");
    const row = page.locator(".row-view").first();
    await clickEdgeSlot(page, row);
    await page
      .getByRole("button", { name: "Quick Look (split)", exact: true })
      .click();

    // Stack a second item in Quick Look's column before collapsing.
    await row
      .locator(".row-view__column")
      .nth(1)
      .locator(".row-gap__button")
      .last()
      .click();
    await page
      .getByRole("button", { name: "Text (split)", exact: true })
      .click();

    await row
      .locator(".row-view__column")
      .nth(0)
      .locator(".section-frame")
      .getByRole("button", { name: "Delete section" })
      .click();

    await expect(page.locator(".row-view__column")).toHaveCount(0);
    const rows = page.locator(".row-view");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator(".quicklook-section")).toHaveCount(1);
    await expect(rows.nth(1).locator(".text-section__body")).toHaveCount(1);
  });

  test("moving the last item out of a column dissolves the layout the same way removal does", async ({
    page,
  }) => {
    await addFirstSection(page, "Contacts (split)");
    const row = page.locator(".row-view").first();
    await clickEdgeSlot(page, row);
    await page
      .getByRole("button", { name: "Quick Look (split)", exact: true })
      .click();

    await row
      .locator(".row-view__column")
      .nth(1)
      .locator(".section-frame")
      .getByRole("button", { name: "Move this section" })
      .click();
    await page.locator(".row-gap__button").last().click();

    await expect(page.locator(".row-view__column")).toHaveCount(0);
    const rows = page.locator(".row-view");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator(".contacts-section")).toHaveCount(1);
    await expect(rows.nth(1).locator(".quicklook-section")).toHaveCount(1);
  });

  test("moving a column item to a main-flow gap creates a new solo row, not a new split layout", async ({
    page,
  }) => {
    await addFirstSection(page, "Contacts (split)");
    const row = page.locator(".row-view").first();
    await clickEdgeSlot(page, row);
    await page
      .getByRole("button", { name: "Quick Look (split)", exact: true })
      .click();
    // Give the Quick Look column a second item so moving one of them away
    // doesn't empty the column and collapse the row — isolating "does a
    // main-flow drop always create a solo row" from the separate collapse
    // behavior covered above.
    await row
      .locator(".row-view__column")
      .nth(1)
      .locator(".row-gap__button")
      .last()
      .click();
    await page
      .getByRole("button", { name: "Text (split)", exact: true })
      .click();

    await row
      .locator(".row-view__column")
      .nth(1)
      .locator(".section-frame")
      .first()
      .getByRole("button", { name: "Move this section" })
      .click();
    await page.locator(".row-gap__button").last().click();

    const rows = page.locator(".row-view");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator(".row-view__column")).toHaveCount(2);
    await expect(rows.nth(1).locator(".split-edge-slot")).toHaveCount(1);
    await expect(rows.nth(1).locator(".row-view__column")).toHaveCount(0);
  });
});

test.describe("divider height", () => {
  test("the divider spans a multi-item column, not just the shorter single-item side", async ({
    page,
  }) => {
    await addFirstSection(page, "Contacts (split)");
    const row = page.locator(".row-view").first();
    await clickEdgeSlot(page, row);
    await page
      .getByRole("button", { name: "Quick Look (split)", exact: true })
      .click();

    const column0 = row.locator(".row-view__column").nth(0);
    const column1 = row.locator(".row-view__column").nth(1);
    const shortHeight = (await column0.boundingBox())!.height;

    for (let i = 0; i < 5; i++) {
      await column1.locator(".row-gap__button").last().click();
      await page
        .getByRole("button", { name: "Text (split)", exact: true })
        .click();
    }

    const column0HeightAfter = (await column0.boundingBox())!.height;
    const column1Height = (await column1.boundingBox())!.height;
    expect(column1Height).toBeGreaterThan(shortHeight);
    // `align-items: stretch` makes the shorter column's own box exactly as
    // tall as the taller one, so its divider-carrying sibling's border ends
    // up spanning the taller column's full height too.
    expect(column0HeightAfter).toBeCloseTo(column1Height, 0);
  });
});

test.describe("document-wide swap", () => {
  test("swapping two embedded items across different split rows", async ({
    page,
  }) => {
    await addFirstSection(page, "Contacts (split)");
    await clickEdgeSlot(page, page.locator(".row-view").nth(0));
    await page
      .getByRole("button", { name: "Quick Look (split)", exact: true })
      .click();

    await addSection(page, "Text (split)");
    await clickEdgeSlot(page, page.locator(".row-view").nth(1));
    await page
      .getByRole("button", { name: "Contacts (split)", exact: true })
      .click();

    const firstRow = page.locator(".row-view").nth(0);
    const secondRow = page.locator(".row-view").nth(1);

    await firstRow
      .locator(".row-view__column")
      .nth(1)
      .locator(".section-frame")
      .getByRole("button", { name: "Move this section" })
      .click();

    const target = secondRow
      .locator(".row-view__column")
      .nth(0)
      .locator(".section-frame");
    await expect(
      target.getByRole("button", { name: "Swap places with this section" }),
    ).toBeVisible();
    await target
      .getByRole("button", { name: "Swap places with this section" })
      .click();

    // firstRow's column1 (lifted: Quick Look) swapped with secondRow's
    // column0 (swap target: Text) — each row now holds the other's item.
    await expect(
      firstRow
        .locator(".row-view__column")
        .nth(1)
        .locator(".text-section__body"),
    ).toHaveCount(1);
    await expect(
      secondRow
        .locator(".row-view__column")
        .nth(0)
        .locator(".quicklook-section"),
    ).toHaveCount(1);
  });

  test("lifting a full-width row highlights every other full-width row, but never an embedded split section", async ({
    page,
  }) => {
    await addFirstSection(page, "Requirements");
    await addSection(page, "Contacts (split)");
    await clickEdgeSlot(page, page.locator(".row-view").nth(1));
    await page
      .getByRole("button", { name: "Quick Look (split)", exact: true })
      .click();
    await addSection(page, "Equipment");

    await page
      .locator(".row-view")
      .nth(0)
      .getByRole("button", { name: "Move this section" })
      .click();

    await expect(
      page
        .locator(".row-view")
        .nth(2)
        .getByRole("button", { name: "Swap places with this section" }),
    ).toBeVisible();
    // The split row's embedded sections never offer themselves — a
    // full-width row can't swap with an embedded split section.
    await expect(
      page
        .locator(".row-view")
        .nth(1)
        .getByRole("button", { name: "Swap places with this section" }),
    ).toHaveCount(0);
  });

  test("a solo split section can swap with a full-width row", async ({
    page,
  }) => {
    await addFirstSection(page, "Requirements");
    await addSection(page, "Contacts (split)");

    await page
      .locator(".row-view")
      .nth(1)
      .getByRole("button", { name: "Move this section" })
      .click();
    const target = page
      .locator(".row-view")
      .nth(0)
      .getByRole("button", { name: "Swap places with this section" });
    await expect(target).toBeVisible();
    await target.click();

    await expect(
      page.locator(".row-view").nth(0).locator(".contacts-section"),
    ).toHaveCount(1);
    await expect(
      page.locator(".row-view").nth(1).locator(".requirements-section"),
    ).toHaveCount(1);
  });
});
