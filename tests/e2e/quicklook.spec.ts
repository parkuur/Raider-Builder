import { test, expect } from "@playwright/test";

test.describe("Quick Look section", () => {
  test("row and table topics both render an icon, and changing a table topic's icon via the picker updates it", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    await page.getByRole("button", { name: "+ Add Row Topic" }).click();
    await page.getByRole("button", { name: "+ Add Table Topic" }).click();

    const topics = page.locator(".quicklook-section__topic");
    await expect(topics).toHaveCount(2);

    // Both a row topic and a table topic render an icon — the direct
    // regression test for the prototype's row/table icon-parity bug.
    await expect(topics.nth(0).locator(".icon-glyph")).toHaveAttribute(
      "data-icon",
      "zap",
    );
    await expect(topics.nth(1).locator(".icon-glyph")).toHaveAttribute(
      "data-icon",
      "zap",
    );

    await topics.nth(1).getByRole("combobox").selectOption("headphones");
    await expect(topics.nth(1).locator(".icon-glyph")).toHaveAttribute(
      "data-icon",
      "headphones",
    );
    // The row topic's icon is unaffected by changing the table topic's icon.
    await expect(topics.nth(0).locator(".icon-glyph")).toHaveAttribute(
      "data-icon",
      "zap",
    );
  });

  test("row topic has a value field and table topic has addable label/value lines", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    await page.getByRole("button", { name: "+ Add Row Topic" }).click();
    const rowTopic = page.locator(".quicklook-section__topic").first();
    await rowTopic
      .locator(".quicklook-topic-header__title")
      .fill("Wireless Mics");
    await rowTopic.locator(".quicklook-section__value").fill("2 handhelds");
    await expect(rowTopic.locator(".quicklook-section__value")).toHaveValue(
      "2 handhelds",
    );

    await page.getByRole("button", { name: "+ Add Table Topic" }).click();
    const tableTopic = page.locator(".quicklook-section__topic").nth(1);
    await tableTopic.locator(".quicklook-topic-header__title").fill("Schedule");

    await tableTopic.getByRole("button", { name: "+ Add Line" }).click();
    const line = tableTopic.locator(".quicklook-section__line").first();
    await line.locator(".quicklook-section__line-label").fill("Load-in");
    await line.locator(".quicklook-section__line-value").fill("6:00 PM");
    await expect(line.locator(".quicklook-section__line-label")).toHaveValue(
      "Load-in",
    );

    await line.getByRole("button", { name: "Remove line" }).click();
    await expect(tableTopic.locator(".quicklook-section__line")).toHaveCount(0);
  });

  test("dragging a topic's handle onto another topic reorders them", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    await page.getByRole("button", { name: "+ Add Row Topic" }).click();
    await page.getByRole("button", { name: "+ Add Row Topic" }).click();

    const topics = page.locator(".quicklook-section__topic");
    await topics.nth(0).locator(".quicklook-topic-header__title").fill("First");
    await topics
      .nth(1)
      .locator(".quicklook-topic-header__title")
      .fill("Second");

    await topics.nth(1).locator(".drag-handle").dragTo(topics.nth(0));

    await expect(
      topics.nth(0).locator(".quicklook-topic-header__title"),
    ).toHaveValue("Second");
    await expect(
      topics.nth(1).locator(".quicklook-topic-header__title"),
    ).toHaveValue("First");
  });

  test("editing controls are hidden in print, content stays visible", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Row Topic" }).click();
    await page.locator(".quicklook-topic-header__title").fill("Wireless");
    await page.locator(".quicklook-section__value").fill("2 handhelds");

    await page.emulateMedia({ media: "print" });

    await expect(
      page.getByRole("button", { name: "+ Add Row Topic" }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Remove topic" }),
    ).toBeHidden();
    await expect(page.locator(".icon-picker__select")).toBeHidden();
    await expect(page.locator(".quicklook-topic-header__title")).toBeVisible();
    await expect(page.locator(".quicklook-section__value")).toBeVisible();
  });
});
