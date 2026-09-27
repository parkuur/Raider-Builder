import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { pointerDragTo } from "./utils/pointer-drag";
import { saveClearAndReload } from "./utils/save-load";

async function addSetlist(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page
    .getByRole("button", { name: "Setlist (split)", exact: true })
    .click();
}

test.describe("Setlist section", () => {
  test("songs are numbered in running order through add, reorder and remove", async ({
    page,
  }) => {
    await addSetlist(page);
    const addSong = page.getByRole("button", { name: "+ Add Song" });
    await addSong.click();
    await addSong.click();
    await addSong.click();

    const rows = page.locator(".setlist tbody tr");
    const songs = page.locator(".setlist__song-input");
    const numbers = page.locator(".setlist tbody .setlist__num");
    await songs.nth(0).fill("Opener");
    await songs.nth(1).fill("Ballad");
    await songs.nth(2).fill("Closer");
    await page.locator(".setlist__artist-input").nth(1).fill("Cover Artist");
    await page.locator(".setlist__notes-input").nth(1).fill("Capo 2");

    await expect(numbers).toHaveText(["1", "2", "3"]);

    await pointerDragTo(page, rows.nth(2).locator(".drag-handle"), rows.nth(0));
    await expect(songs.nth(0)).toHaveValue("Closer");
    await expect(songs.nth(1)).toHaveValue("Opener");
    await expect(numbers).toHaveText(["1", "2", "3"]);

    await rows.nth(0).getByRole("button", { name: "Remove song" }).click();
    await expect(songs).toHaveCount(2);
    await expect(songs.nth(0)).toHaveValue("Opener");
    await expect(numbers).toHaveText(["1", "2"]);
    await expect(page.locator(".setlist__artist-input").nth(1)).toHaveValue(
      "Cover Artist",
    );
  });

  test("column labels are editable and survive a save → load round trip", async ({
    page,
  }) => {
    await addSetlist(page);
    await page.getByRole("button", { name: "+ Add Song" }).click();
    await page.locator(".setlist__song-input").fill("Opener");

    const headers = page.locator(".setlist thead input");
    await expect(headers).toHaveCount(4);
    await expect(headers.nth(0)).toHaveValue("#");
    await headers.nth(3).fill("Key");

    await saveClearAndReload(page);

    await expect(page.locator(".setlist thead input").nth(3)).toHaveValue(
      "Key",
    );
    await expect(page.locator(".setlist__song-input")).toHaveValue("Opener");
  });

  test("sits in a split layout beside another split section", async ({
    page,
  }) => {
    await addSetlist(page);
    await page.locator(".split-edge-slot__button").click();
    await page
      .getByRole("button", { name: "Setlist (split)", exact: true })
      .click();

    const columns = page.locator(".row-view__column");
    await expect(columns).toHaveCount(2);
    await expect(columns.nth(0).locator(".setlist")).toHaveCount(1);
    await expect(columns.nth(1).locator(".setlist")).toHaveCount(1);

    await columns.nth(1).getByRole("button", { name: "+ Add Song" }).click();
    await expect(columns.nth(0).locator(".setlist tbody tr")).toHaveCount(0);
    await expect(columns.nth(1).locator(".setlist tbody tr")).toHaveCount(1);
  });

  test("editing controls are hidden in print, songs and numbers stay visible", async ({
    page,
  }) => {
    await addSetlist(page);
    await page.getByRole("button", { name: "+ Add Song" }).click();
    await page.locator(".setlist__song-input").fill("Opener");

    await page.emulateMedia({ media: "print" });
    await expect(page.getByRole("button", { name: "+ Add Song" })).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Remove song" }),
    ).toBeHidden();
    await expect(page.locator(".setlist__song-input")).toBeVisible();
    await expect(page.locator(".setlist tbody .setlist__num")).toHaveText("1");
  });
});
