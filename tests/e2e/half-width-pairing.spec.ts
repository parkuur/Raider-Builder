import { test, expect } from "@playwright/test";

test.describe("half-width pairing UI", () => {
  test("a full-width section shows no Pair control", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Requirements", exact: true })
      .click();
    await expect(page.locator(".pair-slot")).toHaveCount(0);
  });

  test("pairing a Quick Look section onto a Contacts section renders them side-by-side, with no Unpair button and a move control on each side", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (half)", exact: true })
      .click();

    await page
      .locator(".row-view")
      .getByRole("button", { name: "Add paired section" })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Add section" }),
    ).toBeVisible();
    // The menu is filtered to half-width types only.
    await expect(
      page.getByRole("button", { name: "Equipment", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    await expect(page.locator(".row-view")).toHaveCount(1);
    const frames = page.locator(".row-view").first().locator(".section-frame");
    await expect(frames).toHaveCount(2);

    await expect(
      frames.getByRole("button", { name: "Unpair", exact: true }),
    ).toHaveCount(0);
    await expect(
      frames.getByRole("button", { name: "Move or unpair this section" }),
    ).toHaveCount(2);
    // The link badge marks the pairing itself — exactly one per pair, on
    // the trailing section, not duplicated per side.
    await expect(page.locator(".section-frame__pair-badge")).toHaveCount(1);
  });

  test("deleting one side of a pair removes the pairing, leaving the other section standalone", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (half)", exact: true })
      .click();
    await page
      .locator(".row-view")
      .getByRole("button", { name: "Add paired section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    const frames = page.locator(".row-view").first().locator(".section-frame");
    await frames.nth(1).getByRole("button", { name: "Delete section" }).click();

    await expect(page.locator(".row-view")).toHaveCount(1);
    await expect(page.locator(".section-frame")).toHaveCount(1);
    await expect(page.locator(".pair-slot")).toHaveCount(1);
  });

  test("lifting one side of a pair and placing it at a row gap unpairs it vertically", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (half)", exact: true })
      .click();
    await page
      .locator(".row-view")
      .getByRole("button", { name: "Add paired section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    await expect(page.locator(".row-view")).toHaveCount(1);
    const frames = page.locator(".row-view").first().locator(".section-frame");

    // Lift the second (Quick Look) section, then place it at the trailing
    // gap, below the paired row.
    await frames
      .nth(1)
      .getByRole("button", { name: "Move or unpair this section" })
      .click();
    await page.locator(".row-gap__button").last().click();

    await expect(page.locator(".row-view")).toHaveCount(2);
    await expect(
      page.locator(".row-view").nth(0).locator(".section-frame"),
    ).toHaveCount(1);
    await expect(
      page.locator(".row-view").nth(1).locator(".section-frame"),
    ).toHaveCount(1);
    // Both are now standalone half-width sections, so each shows a pair
    // slot instead of a lingering move control.
    await expect(page.locator(".pair-slot")).toHaveCount(2);
  });

  test("the divider between paired sections spans the taller section, not just the shorter one", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (half)", exact: true })
      .click();
    await page
      .locator(".row-view")
      .getByRole("button", { name: "Add paired section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    const frames = page.locator(".row-view").first().locator(".section-frame");
    const shortHeight = (await frames.nth(0).boundingBox())!.height;

    // Make the second (Quick Look) section much taller than the first
    // (Contacts, left empty) by giving it several topics.
    for (let i = 0; i < 6; i++) {
      await page.getByRole("button", { name: "+ Add Topic" }).click();
      await page.getByRole("menuitem", { name: "Row", exact: true }).click();
    }

    const contactsHeight = (await frames.nth(0).boundingBox())!.height;
    const quicklookHeight = (await frames.nth(1).boundingBox())!.height;
    expect(quicklookHeight).toBeGreaterThan(shortHeight);
    // The shorter (Contacts) section's own box is stretched to match its
    // taller partner, so the divider border on the second section — which
    // spans that section's own box height — ends up exactly as tall as the
    // taller side, not stopping short at the empty Contacts section's
    // natural content height.
    expect(contactsHeight).toBeCloseTo(quicklookHeight, 0);
  });

  test("lifting one side of a pair and dropping it on its own sibling swaps their positions", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (half)", exact: true })
      .click();
    await page
      .locator(".row-view")
      .getByRole("button", { name: "Add paired section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    const row = page.locator(".row-view").first();
    // No swap affordance appears until a lift is in progress.
    await expect(row.getByRole("button", { name: "Swap places" })).toHaveCount(
      0,
    );

    const frames = row.locator(".section-frame");
    await frames
      .nth(0)
      .getByRole("button", { name: "Move or unpair this section" })
      .click();

    const swapTarget = frames
      .nth(1)
      .getByRole("button", { name: "Swap places with this section" });
    await expect(swapTarget).toBeVisible();
    // The lifted section itself never offers to swap with itself.
    await expect(
      frames.nth(0).getByRole("button", { name: "Swap places" }),
    ).toHaveCount(0);

    await swapTarget.click();

    await expect(frames).toHaveCount(2);
    // Contacts (originally first) is now second, Quick Look now first.
    await expect(frames.nth(0).locator(".quicklook-section")).toHaveCount(1);
    await expect(frames.nth(1).locator(".contacts-section")).toHaveCount(1);
  });

  test("lifting a standalone half section and placing it on another's pair slot pairs them", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Contacts (half)", exact: true })
      .click();
    await page.getByRole("button", { name: "Add Section" }).last().click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    await expect(page.locator(".row-view")).toHaveCount(2);
    await expect(page.locator(".pair-slot")).toHaveCount(2);

    await page
      .locator(".row-view")
      .nth(1)
      .getByRole("button", { name: "Move this section" })
      .click();
    await page
      .locator(".pair-slot")
      .first()
      .getByRole("button", { name: "Move here to pair" })
      .click();

    await expect(page.locator(".row-view")).toHaveCount(1);
    await expect(page.locator(".section-frame")).toHaveCount(2);
    await expect(page.locator(".pair-slot")).toHaveCount(0);
  });
});
