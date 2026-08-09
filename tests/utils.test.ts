import { describe, expect, it } from "vitest";
import { buildGoogleMapsUrl, formatCurrency } from "@/lib/utils";

describe("utility helpers", () => {
  it("建立安全的 Google Maps deep link", () => {
    expect(buildGoogleMapsUrl("Prague Castle")).toBe("https://www.google.com/maps/dir/?api=1&destination=Prague%20Castle");
    expect(buildGoogleMapsUrl("ignored", 50.1, 14.4)).toContain("50.1%2C14.4");
  });

  it("格式化不同幣別", () => {
    expect(formatCurrency(120, "EUR")).toContain("120");
    expect(formatCurrency()).toBe("—");
  });
});
