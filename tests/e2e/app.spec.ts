import { expect, test } from "@playwright/test";

test("展示模式可瀏覽主要頁面", async ({ page }) => {
  await page.goto("/trip/central-europe-2027/today");
  await expect(page.getByRole("heading", { name: "準備出發" })).toBeVisible();
  await page.getByRole("link", { name: /行程/ }).first().click();
  await expect(page.getByRole("heading", { name: "每日行程" })).toBeVisible();
});

test("手機版顯示底部導覽", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/trip/central-europe-2027/today");
  await expect(page.locator("nav").filter({ hasText: "今日" }).last()).toBeVisible();
});
