import { expect, test } from "@playwright/test";

test("手機可透過更多選單使用完整景點操作", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/trip/central-europe-2027/itinerary");

  const moreButton = page.getByRole("button", { name: /更多操作/ }).first();
  await expect(moreButton).toBeVisible();
  await moreButton.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "上移" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "下移" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "編輯" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "刪除" })).toBeVisible();
});
