import { test, expect } from "@playwright/test";

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

  test("editing a member's name updates the initials fallback avatar", async ({
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
