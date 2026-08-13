import { test, expect } from "@playwright/test";
import { pointerDragTo } from "./utils/pointer-drag";

test.describe("Band Members section", () => {
  test("cards are grouped into balanced rows as members are added", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Band Members", exact: true })
      .click();

    const addMember = page.getByRole("button", { name: "+ Add Member" });
    const rows = page.locator(".band-members__row");

    async function rowCounts(): Promise<number[]> {
      return rows.evaluateAll((els) =>
        els.map((el) => el.querySelectorAll(".band-members__card").length),
      );
    }

    for (let i = 0; i < 4; i++) await addMember.click();
    expect(await rowCounts()).toEqual([4]);

    await addMember.click();
    expect(await rowCounts()).toEqual([3, 2]);

    await addMember.click();
    await addMember.click();
    expect(await rowCounts()).toEqual([4, 3]);

    await addMember.click();
    await addMember.click();
    expect(await rowCounts()).toEqual([3, 3, 3]);
  });

  test("member cards are centered horizontally within each row", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Band Members", exact: true })
      .click();

    const addMember = page.getByRole("button", { name: "+ Add Member" });
    // A row with fewer cards than the widest row makes centering visible.
    for (let i = 0; i < 5; i++) await addMember.click();

    const justifyContent = await page
      .locator(".band-members__row")
      .first()
      .evaluate((el) => getComputedStyle(el).justifyContent);
    expect(justifyContent).toBe("center");
  });

  test("dragging a card across a visual-row boundary reorders the underlying member list", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Band Members", exact: true })
      .click();

    const addMember = page.getByRole("button", { name: "+ Add Member" });
    // 5 members balance into rows of [3, 2] (see balanced-rows), so the 5th
    // card lands in the second visual row.
    for (let i = 0; i < 5; i++) await addMember.click();

    const cards = page.locator(".band-members__card");
    await expect(cards).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await cards
        .nth(i)
        .locator(".band-members__name")
        .fill(`Member ${i + 1}`);
    }

    await pointerDragTo(
      page,
      cards.nth(4).locator(".drag-handle"),
      cards.nth(0),
    );

    const names = await page
      .locator(".band-members__name")
      .evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value));
    expect(names).toEqual([
      "Member 5",
      "Member 1",
      "Member 2",
      "Member 3",
      "Member 4",
    ]);
  });

  test("avatar circle only appears once photos are enabled, with an initials fallback", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Band Members", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Member" }).click();
    await page.locator(".band-members__name").fill("Jimi Hendrix");

    // No photo toggle yet — no avatar circle on the card at all.
    await expect(page.locator(".band-members__avatar")).toHaveCount(0);

    await page.getByText("Show member photos").click();
    await expect(page.locator(".band-members__avatar span")).toHaveText("JH");

    await page.getByRole("button", { name: "Remove member" }).click();
    await expect(page.locator(".band-members__card")).toHaveCount(0);
  });

  test("show member photos toggle reveals the upload control", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Band Members", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Member" }).click();

    await expect(page.locator(".band-members__photo-input")).toHaveCount(0);
    await page.getByText("Show member photos").click();
    await expect(page.locator(".band-members__photo-input")).toHaveCount(1);
  });

  test("editing controls are hidden in print, content stays visible", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await page
      .getByRole("button", { name: "Band Members", exact: true })
      .click();
    await page.getByRole("button", { name: "+ Add Member" }).click();
    await page.locator(".band-members__name").fill("Jimi Hendrix");

    await page.emulateMedia({ media: "print" });

    await expect(
      page.getByRole("button", { name: "+ Add Member" }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Remove member" }),
    ).toBeHidden();
    await expect(page.locator(".band-members__toggle")).toBeHidden();
    await expect(page.locator(".band-members__name")).toBeVisible();
  });
});
