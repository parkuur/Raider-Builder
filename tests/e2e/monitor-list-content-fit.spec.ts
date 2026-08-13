import { test, expect } from "@playwright/test";

test.describe("Monitor List content-fit columns", () => {
  test("Player/Type widen to their longest value across all rows, uniformly", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Monitor List", exact: true })
      .click();

    const addMonitor = page.getByRole("button", { name: "+ Add Monitor" });
    await addMonitor.click();
    await addMonitor.click();

    const players = page.locator(".monitor-list__player-input");
    await players.nth(0).fill("Bass");
    await players.nth(1).fill("Lead Vocalist / Bandleader");

    const playerCells = page.locator(".monitor-list tbody tr td:nth-child(3)");
    const shortWidth = (await playerCells.nth(0).boundingBox())!.width;
    const longWidth = (await playerCells.nth(1).boundingBox())!.width;
    expect(shortWidth).toBeCloseTo(longWidth, 0);
    expect(shortWidth).toBeGreaterThan(150);
  });

  test("Mix Notes wraps and grows instead of overflowing, on screen and in print", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Monitor List", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Monitor" }).click();

    const notes = page.locator(".monitor-list textarea").first();
    const emptyHeight = (await notes.boundingBox())!.height;

    await notes.fill(
      "This is a long mix note that should wrap across several lines instead of overflowing the cell or scrolling internally.",
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
