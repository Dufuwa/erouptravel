import { describe, expect, it } from "vitest";
import { trip } from "@/data/trip";
import { buildPlaceIdeaCatalog, filterPlaceIdeas, placeIdeaFingerprint, placeIdeaId } from "@/lib/place-ideas";
import type { PlaceIdea } from "@/types/types";

describe("place idea catalog", () => {
  it("將全部既有每日景點建立收藏來源", () => {
    const sourceCount = trip.days.reduce((total, day) => total + day.places.length, 0);
    const catalog = buildPlaceIdeaCatalog(trip.days);
    expect(sourceCount).toBe(117);
    expect(catalog.days.flatMap((day) => day.places)).toHaveLength(117);
    expect(catalog.days.flatMap((day) => day.places).every((place) => Boolean(place.sourceIdeaId))).toBe(true);
    expect(catalog.placeIdeas.length).toBeLessThanOrEqual(117);
    expect(catalog.placeIdeas.every((idea) => idea.scheduledDayIds.length > 0)).toBe(true);
  });

  it("相同城市與地圖查詢產生穩定識別碼", () => {
    const place = { name: "Castle", mapQuery: "Prague   Castle" };
    expect(placeIdeaId(placeIdeaFingerprint("prague", place))).toBe(placeIdeaId(placeIdeaFingerprint("prague", { ...place, mapQuery: "prague castle" })));
  });

  it("支援文字、城市、狀態與排程篩選", () => {
    const ideas: PlaceIdea[] = [
      { id: "one", name: "Prague Castle", cityId: "prague", type: "sight", status: "want_to_go", scheduledDayIds: ["day-1"] },
      { id: "two", name: "Vienna Café", cityId: "vienna", type: "food", status: "considering", scheduledDayIds: [] },
    ];
    expect(filterPlaceIdeas(ideas, { query: "café", cityId: "all", type: "food", status: "considering", schedule: "unscheduled" })).toEqual([ideas[1]]);
    expect(filterPlaceIdeas(ideas, { query: "", cityId: "prague", type: "all", status: "all", schedule: "scheduled" })).toEqual([ideas[0]]);
  });
});
