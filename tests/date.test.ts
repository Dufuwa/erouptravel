import { describe, expect, it } from "vitest";
import { getDateInTimeZone, getTodayState, getTripPhase } from "@/lib/date";
import { seedWorkspace } from "@/data/seed";

describe("trip date helpers", () => {
  it("判斷出發前、旅途中與旅程後", () => {
    expect(getTripPhase(seedWorkspace.trip, "2027-03-01")).toBe("before");
    expect(getTripPhase(seedWorkspace.trip, "2027-04-01")).toBe("during");
    expect(getTripPhase(seedWorkspace.trip, "2027-04-13")).toBe("after");
  });

  it("依目的地時區產生日期", () => {
    expect(getDateInTimeZone(new Date("2027-03-27T00:30:00Z"), "Europe/Prague")).toBe("2027-03-27");
  });

  it("出發前顯示第一天與倒數", () => {
    const result = getTodayState(seedWorkspace.trip, seedWorkspace.days, new Date("2027-03-20T12:00:00Z"));
    expect(result.phase).toBe("before");
    expect(result.day?.dayNumber).toBe(1);
    expect(result.countdown).toBe(7);
  });
});
