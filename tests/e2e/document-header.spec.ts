import { test, expect } from "@playwright/test";

test.describe("Document header", () => {
  test("meta fields size themselves to their content, not a fixed width", async ({
    page,
  }) => {
    await page.goto("/");

    const revValue = page.locator(".document-header__meta-input").first();
    const shortWidth = (await revValue.boundingBox())!.width;

    await revValue.fill("A much longer revision string than before");
    const longWidth = (await revValue.boundingBox())!.width;

    expect(longWidth).toBeGreaterThan(shortWidth + 50);
  });

  test("the date meta field shows a full year, not truncated", async ({
    page,
  }) => {
    await page.goto("/");

    const dateValue = page.locator('.document-header__meta-input[type="date"]');
    await dateValue.evaluate((el: HTMLInputElement) => {
      el.value = "2026-05-01";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const box = (await dateValue.boundingBox())!;
    // A truncated field (the old fixed 70px) can't fit "dd.mm.yyyy" at this
    // app's body font size — a wide-enough box is the regression signal
    // for the year segment no longer being clipped off-screen.
    expect(box.width).toBeGreaterThan(90);
  });

  test("credit line: icon reflects current visibility, text fades when hidden, button never wraps below the text", async ({
    page,
  }) => {
    await page.goto("/");

    const visibleText = page.locator(".document-header__credit-text");
    const hideButton = page.locator('button[aria-label="Hide credit line"]');
    await expect(visibleText).toBeVisible();
    await expect(hideButton).toBeVisible();

    const textBoxBefore = (await visibleText.boundingBox())!;
    const buttonBoxBefore = (await hideButton.boundingBox())!;
    expect(Math.abs(textBoxBefore.y - buttonBoxBefore.y)).toBeLessThan(5);

    await hideButton.click();

    const nudge = page.locator(".document-header__credit-nudge");
    const showButton = page.locator('button[aria-label="Show credit line"]');
    await expect(nudge).toBeVisible();
    await expect(showButton).toBeVisible();

    const nudgeBox = (await nudge.boundingBox())!;
    const showButtonBox = (await showButton.boundingBox())!;
    expect(Math.abs(nudgeBox.y - showButtonBox.y)).toBeLessThan(5);

    const nudgeOpacity = Number(
      await nudge.evaluate((el) => getComputedStyle(el).opacity),
    );
    expect(nudgeOpacity).toBeLessThan(1);

    await showButton.click();
    await expect(visibleText).toBeVisible();
  });

  test("logos grow taller than the default max relative to a taller title/band block, capped by the width budget", async ({
    page,
  }) => {
    await page.goto("/");

    const logoPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );

    await page.locator(".header-logos__file-input").setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: logoPng,
    });

    const titlesHeight = await page
      .locator(".document-header__titles")
      .evaluate((el) => el.getBoundingClientRect().height);
    const logoHeight = await page
      .locator(".header-logos__item img")
      .first()
      .evaluate((el) => el.getBoundingClientRect().height);

    // Allowed to grow past the plain "a bit taller than the title" default
    // (44px) toward 1.5x the title block's height, width budget permitting.
    expect(logoHeight).toBeGreaterThan(44);
    expect(logoHeight).toBeLessThanOrEqual(titlesHeight * 1.5 + 1);
  });
});
