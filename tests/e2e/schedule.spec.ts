import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { pointerDragTo } from "./utils/pointer-drag";
import { saveClearAndReload } from "./utils/save-load";

async function addSchedule(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Add your first section" }).click();
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
}

const table = (page: Page) => page.locator(".schedule");
const slotBodies = (page: Page) =>
  table(page).locator("tbody.grouped-table__row");
const groupBodies = (page: Page) =>
  table(page).locator("tbody.grouped-table__group");
const itemRows = (page: Page) => table(page).locator("tr.schedule__item");

/** e.g. ["18:00 [Soundcheck, Line check]", "# Packing up", "  23:30 [Drums]"]. */
async function structure(page: Page): Promise<string[]> {
  return table(page)
    .locator("tbody")
    .evaluateAll((bodies) =>
      bodies
        .filter((b) => !b.classList.contains("grouped-table__end"))
        .map((b) => {
          if (b.classList.contains("grouped-table__group")) {
            return `# ${(b.querySelector("input") as HTMLInputElement).value}`;
          }
          const start = (
            b.querySelector(".schedule__start-input") as HTMLInputElement
          ).value;
          const titles = [
            ...b.querySelectorAll<HTMLTextAreaElement>(
              ".schedule__title-input",
            ),
          ].map((t) => t.value);
          const indent = b.classList.contains("grouped-table__row--in-group")
            ? "  "
            : "";
          return `${indent}${start} [${titles.join(", ")}]`;
        }),
    );
}

/**
 * 17:00 [Soundcheck, Line check]
 * # Packing up
 *   23:30 [Stage left]
 *   23:45 [Drums]
 */
async function buildSample(page: Page) {
  await addSchedule(page);
  await page.getByRole("button", { name: "+ Add slot" }).click();
  await page.locator(".schedule__start-input").nth(0).fill("17:00");
  await page.locator(".schedule__end-input").nth(0).fill("18:00");
  await page.getByRole("button", { name: "+ Add row" }).nth(0).click();
  await page.locator(".schedule__title-input").nth(0).fill("Soundcheck");
  await page.locator(".schedule__title-input").nth(1).fill("Line check");

  await page.getByRole("button", { name: "+ Add group" }).click();
  await page.getByRole("textbox", { name: "Group heading" }).fill("Packing up");
  const addToGroup = page.getByRole("button", { name: "Add slot to group" });
  await addToGroup.click();
  await addToGroup.click();
  await page.locator(".schedule__start-input").nth(1).fill("23:30");
  await page.locator(".schedule__title-input").nth(2).fill("Stage left");
  await page.locator(".schedule__start-input").nth(2).fill("23:45");
  await page.locator(".schedule__title-input").nth(3).fill("Drums");

  await expect
    .poll(() => structure(page))
    .toEqual([
      "17:00 [Soundcheck, Line check]",
      "# Packing up",
      "  23:30 [Stage left]",
      "  23:45 [Drums]",
    ]);
}

test.describe("Schedule section", () => {
  test("is listed under Planning in the Add Section menu", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "+ Add your first section" })
      .click();
    await expect(
      page
        .getByRole("region", { name: "Planning" })
        .getByRole("button", { name: "Schedule", exact: true }),
    ).toBeVisible();
  });

  test("a new slot has one row; rows can be added and removed, never below one", async ({
    page,
  }) => {
    await addSchedule(page);
    await page.getByRole("button", { name: "+ Add slot" }).click();
    await expect(itemRows(page)).toHaveCount(1);
    await expect(
      itemRows(page).getByRole("button", { name: "Remove row" }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "+ Add row" }).click();
    await expect(itemRows(page)).toHaveCount(2);
    await page.locator(".schedule__title-input").nth(1).fill("Second");
    await page.locator(".schedule__who-input").nth(1).fill("Drummer");
    await page.locator(".schedule__notes-input").nth(1).fill("Bring sticks");

    await itemRows(page)
      .nth(0)
      .getByRole("button", { name: "Remove row" })
      .click();
    await expect(itemRows(page)).toHaveCount(1);
    await expect(page.locator(".schedule__title-input")).toHaveValue("Second");
    await expect(
      itemRows(page).getByRole("button", { name: "Remove row" }),
    ).toHaveCount(0);

    await slotBodies(page).getByRole("button", { name: "Remove slot" }).click();
    await expect(slotBodies(page)).toHaveCount(0);
  });

  test("slots group under a heading and can be dragged between groups", async ({
    page,
  }) => {
    await buildSample(page);
    // 17:00 slot → onto the Drums slot, inside the group.
    await pointerDragTo(
      page,
      slotBodies(page).nth(0).locator(".data-table__drag .drag-handle"),
      itemRows(page).nth(3),
    );
    await expect
      .poll(() => structure(page))
      .toEqual([
        "# Packing up",
        "  23:30 [Stage left]",
        "  17:00 [Soundcheck, Line check]",
        "  23:45 [Drums]",
      ]);
  });

  test("a row can be dragged from one slot into another", async ({ page }) => {
    await buildSample(page);
    // Line check → onto Drums, in a grouped slot.
    await pointerDragTo(
      page,
      itemRows(page).nth(1).locator(".data-table__actions .drag-handle"),
      itemRows(page).nth(3),
    );
    await expect
      .poll(() => structure(page))
      .toEqual([
        "17:00 [Soundcheck]",
        "# Packing up",
        "  23:30 [Stage left]",
        "  23:45 [Line check, Drums]",
      ]);

    // Stage left was its slot's only row: the slot keeps its time with a
    // fresh empty row.
    await pointerDragTo(
      page,
      itemRows(page).nth(1).locator(".data-table__actions .drag-handle"),
      itemRows(page).nth(0),
    );
    await expect
      .poll(() => structure(page))
      .toEqual([
        "17:00 [Stage left, Soundcheck]",
        "# Packing up",
        "  23:30 []",
        "  23:45 [Line check, Drums]",
      ]);
  });

  test("prints each slot's time spanning its rows, without editing controls or hidden slots", async ({
    page,
  }) => {
    await buildSample(page);
    await slotBodies(page)
      .nth(1)
      .getByRole("button", { name: "Hide slot" })
      .click();

    await page.emulateMedia({ media: "print" });
    const firstTime = slotBodies(page).nth(0).locator(".schedule__time");
    await expect(firstTime).toHaveAttribute("rowspan", "2");
    await expect(firstTime.locator(".schedule__time-print")).toHaveText(
      "17:00–18:00",
    );
    await expect(
      slotBodies(page).nth(2).locator(".schedule__time-print"),
    ).toHaveText("23:45");
    await expect(firstTime.locator(".schedule__start-input")).toBeHidden();
    await expect(slotBodies(page).nth(1)).toBeHidden();
    // Screen-only controls: the per-slot "+ Add row" buttons.
    await expect(page.locator(".schedule__add-item")).toHaveCount(3);
    for (const button of await page.locator(".schedule__add-item").all()) {
      await expect(button).toBeHidden();
    }

    // The time cell spans both of the first slot's rows.
    const timeBox = (await firstTime.boundingBox())!;
    const secondRowBox = (await itemRows(page).nth(1).boundingBox())!;
    expect(timeBox.y + timeBox.height).toBeGreaterThanOrEqual(
      secondRowBox.y + secondRowBox.height - 1,
    );
  });

  test("slots, rows, groups and column labels survive a save → load round trip", async ({
    page,
  }) => {
    await buildSample(page);
    await page.locator(".schedule__who-input").nth(0).fill("Everyone");
    const headers = table(page).locator("thead input");
    await expect(headers).toHaveCount(4);
    await expect(headers.nth(2)).toHaveValue("Who");
    await headers.nth(2).fill("Crew");

    await saveClearAndReload(page);

    await expect
      .poll(() => structure(page))
      .toEqual([
        "17:00 [Soundcheck, Line check]",
        "# Packing up",
        "  23:30 [Stage left]",
        "  23:45 [Drums]",
      ]);
    await expect(page.locator(".schedule__end-input").nth(0)).toHaveValue(
      "18:00",
    );
    await expect(page.locator(".schedule__who-input").nth(0)).toHaveValue(
      "Everyone",
    );
    await expect(table(page).locator("thead input").nth(2)).toHaveValue("Crew");
    await expect(groupBodies(page)).toHaveCount(1);
  });
});
