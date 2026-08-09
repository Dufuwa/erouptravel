import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "@/lib/auth-errors";

describe("getAuthErrorMessage", () => {
  it("提示使用者允許被阻擋的登入視窗", () => {
    expect(getAuthErrorMessage({ code: "auth/popup-blocked" })).toContain("允許彈出式視窗");
  });

  it("未知錯誤提供可操作的瀏覽器提示", () => {
    expect(getAuthErrorMessage(new Error("unknown"))).toContain("Safari 或 Chrome");
  });
});
