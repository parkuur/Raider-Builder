import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { pointerDragTo } from "./utils/pointer-drag";

const fixturePhoto = fileURLToPath(
  new URL("../../public/fs-logo.png", import.meta.url),
);

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

  test("selecting a photo replaces the initials, and the edit control switches from a badge to a hover overlay", async ({
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
    await page.getByText("Show member photos").click();

    // Empty state: initials, and an always-visible "Add photo" badge.
    await expect(page.locator(".band-members__avatar span")).toHaveText("JH");
    await expect(
      page.locator(".band-members__avatar-edit--badge"),
    ).toBeVisible();
    await expect(page.locator(".band-members__avatar img")).toHaveCount(0);
    await expect(page.getByLabel("Add photo", { exact: true })).toHaveCount(1);

    await page
      .locator(".band-members__photo-input")
      .setInputFiles(fixturePhoto);

    // Filled state: an image, no initials span, and the badge is replaced
    // by a hover-only "Change photo" overlay covering the whole circle.
    await expect(page.locator(".band-members__avatar img")).toBeVisible();
    await expect(page.locator(".band-members__avatar span")).toHaveCount(0);
    await expect(page.locator(".band-members__avatar-edit--badge")).toHaveCount(
      0,
    );
    const overlay = page.locator(".band-members__avatar-edit--overlay");
    await expect(overlay).toHaveCount(1);
    await expect(page.getByLabel("Change photo", { exact: true })).toHaveCount(
      1,
    );
    await expect(overlay).toHaveCSS("opacity", "0");

    await page.locator(".band-members__avatar").hover();
    await expect(overlay).toHaveCSS("opacity", "1");
  });

  test("the avatar circle's side gaps match its top gap, so it isn't off-center in its card", async ({
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
    await page.getByText("Show member photos").click();

    const card = page.locator(".band-members__card").first();
    const avatar = page.locator(".band-members__avatar").first();
    const cardBox = (await card.boundingBox())!;
    const avatarBox = (await avatar.boundingBox())!;

    const topGap = avatarBox.y - cardBox.y;
    const leftGap = avatarBox.x - cardBox.x;
    const rightGap =
      cardBox.x + cardBox.width - (avatarBox.x + avatarBox.width);
    expect(leftGap).toBeCloseTo(topGap, 0);
    expect(rightGap).toBeCloseTo(topGap, 0);
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
