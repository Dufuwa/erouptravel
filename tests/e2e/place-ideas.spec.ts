import { expect, test } from "@playwright/test";

test("收藏景點可排入行程", async ({ page }) => {
  await page.goto("/trip/central-europe-2027/places");
  await expect(page.getByRole("heading", { name: "景點清單" })).toBeVisible();
  await page.getByRole("button", { name: "新增景點" }).click();
  await page.getByLabel("景點名稱").fill("Playwright 測試景點");
  await page.getByLabel("Google Maps 搜尋文字").fill("Prague Test Place");
  await page.getByRole("button", { name: "儲存" }).click();
  const card = page.locator("article").filter({ hasText: "Playwright 測試景點" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "排入" }).click();
  const dialog = page.getByRole("dialog", { name: /排入行程/ });
  await dialog.locator("button:not([disabled])").filter({ hasText: "抵達日" }).click();
  await dialog.getByRole("button", { name: "排入日期" }).click();
  await expect(card.getByText("已排 1 天")).toBeVisible();
});
