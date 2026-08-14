import { test, expect } from "@playwright/test";
import { pointerDragTo } from "./utils/pointer-drag";

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
      "circle",
    );
    await expect(topics.nth(1).locator(".icon-glyph")).toHaveAttribute(
      "data-icon",
      "circle",
    );

    await topics.nth(1).locator(".icon-picker__trigger").click();
    await topics.nth(1).getByRole("option", { name: "Monitoring" }).click();
    await expect(topics.nth(1).locator(".icon-glyph")).toHaveAttribute(
      "data-icon",
      "headphones",
    );
    // The row topic's icon is unaffected by changing the table topic's icon.
    await expect(topics.nth(0).locator(".icon-glyph")).toHaveAttribute(
      "data-icon",
      "circle",
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
    await expect(rowTopic.locator(".quicklook-section__value")).toHaveCSS(
      "text-align",
      "right",
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

    await pointerDragTo(
      page,
      topics.nth(1).locator(".drag-handle"),
      topics.nth(0),
    );

    await expect(
      topics.nth(0).locator(".quicklook-topic-header__title"),
    ).toHaveValue("Second");
    await expect(
      topics.nth(1).locator(".quicklook-topic-header__title"),
    ).toHaveValue("First");
  });

  test("dragging a line's handle onto another line reorders them within the table topic", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    await page.getByRole("button", { name: "+ Add Table Topic" }).click();
    const tableTopic = page.locator(".quicklook-section__topic").first();
    await tableTopic.getByRole("button", { name: "+ Add Line" }).click();
    await tableTopic.getByRole("button", { name: "+ Add Line" }).click();

    const lines = tableTopic.locator(".quicklook-section__line");
    await lines.nth(0).locator(".quicklook-section__line-label").fill("First");
    await lines.nth(1).locator(".quicklook-section__line-label").fill("Second");

    await pointerDragTo(
      page,
      lines.nth(1).locator(".drag-handle"),
      lines.nth(0),
    );

    await expect(
      lines.nth(0).locator(".quicklook-section__line-label"),
    ).toHaveValue("Second");
    await expect(
      lines.nth(1).locator(".quicklook-section__line-label"),
    ).toHaveValue("First");
  });

  test("a long Value in one line widens the Value column for every line in that table topic", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    await page.getByRole("button", { name: "+ Add Table Topic" }).click();
    const tableTopic = page.locator(".quicklook-section__topic").first();
    await tableTopic.getByRole("button", { name: "+ Add Line" }).click();
    await tableTopic.getByRole("button", { name: "+ Add Line" }).click();

    const lines = tableTopic.locator(".quicklook-section__line");
    await lines
      .nth(0)
      .locator(".quicklook-section__line-value")
      .fill("6:00 PM");
    await lines
      .nth(1)
      .locator(".quicklook-section__line-value")
      .fill("A much longer value describing the second line in detail");

    const valueInputs = tableTopic.locator(".quicklook-section__line-value");
    const w0 = (await valueInputs.nth(0).boundingBox())!.width;
    const w1 = (await valueInputs.nth(1).boundingBox())!.width;
    expect(w0).toBeCloseTo(w1, 0);
    expect(w0).toBeGreaterThan(200);

    // A long Label doesn't affect the Value column's width — Label is the
    // stretch side, Value is the fit-to-content side.
    await lines
      .nth(0)
      .locator(".quicklook-section__line-label")
      .fill("A very long label that should not affect the value column");
    const w0After = (await valueInputs.nth(0).boundingBox())!.width;
    expect(w0After).toBeCloseTo(w0, 0);
  });

  test("the value-alignment toggle cycles a table topic's Value column, without affecting other topics", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Quick Look (half)", exact: true })
      .click();

    await page.getByRole("button", { name: "+ Add Table Topic" }).click();
    await page.getByRole("button", { name: "+ Add Table Topic" }).click();

    const topics = page.locator(".quicklook-section__topic");
    const firstTopic = topics.nth(0);
    const secondTopic = topics.nth(1);
    await firstTopic.getByRole("button", { name: "+ Add Line" }).click();
    await secondTopic.getByRole("button", { name: "+ Add Line" }).click();

    const firstValue = firstTopic.locator(".quicklook-section__line-value");
    const secondValue = secondTopic.locator(".quicklook-section__line-value");
    const toggle = firstTopic.locator(".quicklook-section__align-toggle");

    await expect(firstValue).toHaveCSS("text-align", "left");
    await expect(toggle).toHaveAccessibleName("Center-align values");

    await toggle.click();
    await expect(firstValue).toHaveCSS("text-align", "center");
    await expect(toggle).toHaveAccessibleName("Right-align values");

    await toggle.click();
    await expect(firstValue).toHaveCSS("text-align", "right");
    await expect(toggle).toHaveAccessibleName("Left-align values");

    // The second topic's alignment is untouched by the first's toggle.
    await expect(secondValue).toHaveCSS("text-align", "left");
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
    await expect(page.locator(".icon-picker__trigger")).toBeVisible();
    await expect(page.locator(".quicklook-topic-header__title")).toBeVisible();
    await expect(page.locator(".quicklook-section__value")).toBeVisible();
  });
});
