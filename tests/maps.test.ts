import { describe, expect, it } from "vitest";
import { buildGoogleMapsSearchUrl, isGoogleMapsUrl, resolveGoogleMapsUrl } from "@/lib/utils";

describe("Google Maps collection links", () => {
  it("建立搜尋連結並限制可信任網址", () => {
    expect(buildGoogleMapsSearchUrl("Prague Castle")).toContain("/maps/search/");
    expect(isGoogleMapsUrl("https://maps.app.goo.gl/example")).toBe(true);
    expect(isGoogleMapsUrl("https://www.google.at/maps/place/Vienna")).toBe(true);
    expect(isGoogleMapsUrl("https://example.com/maps/place/Vienna")).toBe(false);
    expect(resolveGoogleMapsUrl({ name: "Vienna", googleMapsUrl: "https://maps.app.goo.gl/example" })).toBe("https://maps.app.goo.gl/example");
    expect(resolveGoogleMapsUrl({ name: "Vienna" })).toContain("query=Vienna");
  });
});
