import { test, expect } from "@playwright/test";

test.describe("Channel List content-fit columns", () => {
  test("Name/Source widen to their longest value across all rows, uniformly", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Channel List", exact: true })
      .click();

    const addChannel = page.getByRole("button", { name: "+ Add Channel" });
    await addChannel.click();
    await addChannel.click();

    const names = page.locator(".channel-list__name-input");
    await names.nth(0).fill("Kick");
    await names.nth(1).fill("Overhead Left Condenser Microphone");

    // Every row's Name cell shares one column width, so the short row's
    // cell grows to match the long row's, not just the long row itself.
    const nameCells = page.locator(".channel-list tbody tr td:nth-child(3)");
    const shortWidth = (await nameCells.nth(0).boundingBox())!.width;
    const longWidth = (await nameCells.nth(1).boundingBox())!.width;
    expect(shortWidth).toBeCloseTo(longWidth, 0);
    expect(shortWidth).toBeGreaterThan(150);
  });

  test("Notes wraps and grows instead of overflowing, on screen and in print", async ({
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

    const notes = page.locator(".channel-list textarea").first();
    const emptyHeight = (await notes.boundingBox())!.height;

    await notes.fill(
      "This is a long note that should wrap across several lines instead of overflowing the cell or scrolling internally.",
    );

    const filledHeight = (await notes.boundingBox())!.height;
    expect(filledHeight).toBeGreaterThan(emptyHeight);

    const noClipping = async () =>
      notes.evaluate(
        (el: HTMLTextAreaElement) => el.scrollHeight <= el.clientHeight + 1,
      );
    expect(await noClipping()).toBe(true);

    await page.emulateMedia({ media: "print" });
    expect(await noClipping()).toBe(true);
  });
});
