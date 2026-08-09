import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Trip, TripDay } from "@/types/types";

export type TripPhase = "before" | "during" | "after";

export function getDateInTimeZone(now = new Date(), timeZone = "Europe/Prague") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function getTripPhase(trip: Pick<Trip, "startDate" | "endDate">, today: string): TripPhase {
  if (today < trip.startDate) return "before";
  if (today > trip.endDate) return "after";
  return "during";
}

export function getTodayState(trip: Trip, days: TripDay[], now = new Date()) {
  const today = getDateInTimeZone(now, trip.timezone ?? "Europe/Prague");
  const phase = getTripPhase(trip, today);
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const day = phase === "during" ? sorted.find((item) => item.date === today) : phase === "before" ? sorted[0] : sorted.at(-1);
  const countdown = phase === "before" ? differenceInCalendarDays(parseISO(trip.startDate), parseISO(today)) : 0;
  return { today, phase, day, countdown };
}

export function formatTripDate(date: string) {
  return format(parseISO(date), "M月d日");
}

export function formatWeekday(date: string) {
  return new Intl.DateTimeFormat("zh-TW", { weekday: "short", timeZone: "UTC" }).format(parseISO(date));
}
