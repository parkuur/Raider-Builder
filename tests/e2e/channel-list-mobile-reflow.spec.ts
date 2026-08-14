import { test, expect } from "@playwright/test";

test.describe("Channel List mobile reflow", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("Notes and the stereo toggle move to a labeled second row; 48V stays on the primary row", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Channel List", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Channel" }).click();

    // Header keeps 48V but drops the Notes column entirely on mobile.
    await expect(
      page.locator(".channel-list thead th.channel-list__phantom input"),
    ).toHaveValue("48V");
    await expect(page.locator(".channel-list thead th input")).toHaveCount(4);

    // Primary row keeps 48V but no longer carries Notes/stereo.
    const primaryRow = page.locator(".channel-list tbody tr").first();
    await expect(primaryRow.locator(".channel-list__phantom")).toBeVisible();
    await expect(primaryRow.locator(".channel-list__notes")).toHaveCount(0);
    await expect(
      primaryRow.getByRole("button", { name: "Mono", exact: true }),
    ).toHaveCount(0);

    // The mobile second row carries Notes and the stereo toggle instead.
    const mobileRow = page.locator(".channel-list__row-mobile");
    await expect(mobileRow).toBeVisible();
    await expect(mobileRow.locator(".channel-list__notes-label")).toHaveText(
      "Notes",
    );
    await expect(mobileRow.locator("textarea")).toBeVisible();
    await expect(
      mobileRow.getByRole("button", { name: "Mono", exact: true }),
    ).toBeVisible();

    // Only the primary row is a drag target; the mobile row is a visual
    // continuation of the same channel, not an independent one.
    await expect(mobileRow).not.toHaveAttribute("data-reorder-item");
  });

  test("the mobile row's Notes textarea left edge aligns with the Channel input's left edge above it", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Channel List", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Channel" }).click();

    const nameInputBox = await page
      .locator(".channel-list__name-input")
      .boundingBox();
    const notesTextareaBox = await page
      .locator(".channel-list__row-mobile textarea")
      .boundingBox();

    expect(nameInputBox).not.toBeNull();
    expect(notesTextareaBox).not.toBeNull();
    expect(notesTextareaBox!.x).toBeCloseTo(nameInputBox!.x, 0);
  });

  test("Name becomes the stretch column on mobile, absorbing the space Notes would otherwise take on desktop", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Channel List", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Channel" }).click();

    // Same length as Source's placeholder-derived width, so any difference
    // in rendered width comes from Name being unconstrained/stretchy on
    // mobile rather than from having more characters to fit.
    await page.locator(".channel-list__name-input").fill("Same Len.");

    const nameWidth = (await page
      .locator(".channel-list__name-input")
      .boundingBox())!.width;
    const sourceWidth = (await page
      .locator('.channel-list input[placeholder="SM58 / DI"]')
      .boundingBox())!.width;
    expect(nameWidth).toBeGreaterThan(sourceWidth);
  });

  test("the stereo toggle stays within the 48V column, so only the remove button extends further right", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Channel List", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Channel" }).click();

    const phantomCellBox = await page
      .locator(".channel-list__phantom")
      .first()
      .boundingBox();
    const toggleBox = await page
      .getByRole("button", { name: "Mono", exact: true })
      .first()
      .boundingBox();
    const removeBox = await page
      .getByRole("button", { name: "Remove channel" })
      .first()
      .boundingBox();

    expect(phantomCellBox).not.toBeNull();
    expect(toggleBox).not.toBeNull();
    expect(removeBox).not.toBeNull();

    // The toggle sits inside the 48V column's horizontal extent...
    expect(toggleBox!.x).toBeGreaterThanOrEqual(phantomCellBox!.x);
    expect(toggleBox!.x + toggleBox!.width).toBeLessThanOrEqual(
      phantomCellBox!.x + phantomCellBox!.width + 1,
    );
    // ...while the remove button is the only thing further right than it.
    expect(removeBox!.x).toBeGreaterThan(toggleBox!.x + toggleBox!.width);
  });

  test("print always renders the desktop single-row shape, regardless of the mobile viewport it was opened from", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Channel List", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Channel" }).click();

    await expect(page.locator(".channel-list__row-mobile")).toBeVisible();

    await page.emulateMedia({ media: "print" });

    await expect(
      page.locator(".channel-list thead th.channel-list__phantom input"),
    ).toHaveValue("48V");
    await expect(page.locator(".channel-list thead th input")).toHaveCount(5);
    await expect(page.locator(".channel-list__phantom").first()).toBeVisible();
    await expect(page.locator(".channel-list__notes").first()).toBeVisible();
    await expect(page.locator(".channel-list__row-mobile")).toBeHidden();
  });
});
