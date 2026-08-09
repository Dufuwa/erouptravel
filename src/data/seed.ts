import { accommodations, tickets, transportBookings } from "@/data/bookings";
import { todos } from "@/data/todos";
import { trip as sourceTrip } from "@/data/trip";
import type { TripWorkspace } from "@/types/app";

export const TRIP_ID = "central-europe-2027";
export const OWNER_EMAIL = "yishiuan81319@gmail.com";

export function createSeedWorkspace(): TripWorkspace {
  const now = new Date().toISOString();
  const updatedBy = { uid: "seed", name: "初始資料", email: OWNER_EMAIL };
  const audit = <T extends { id: string }>(items: T[]) =>
    items.map((item, index) => ({ ...item, sortOrder: index, createdAt: now, updatedAt: now, updatedBy }));

  const days = sourceTrip.days.map((day, dayIndex) => ({
    ...day,
    sortOrder: dayIndex,
    createdAt: now,
    updatedAt: now,
    updatedBy,
    places: audit(day.places),
    transportation: audit(day.transportation ?? []),
  }));

  return {
    trip: {
      ...sourceTrip,
      timezone: "Europe/Prague",
      ownerEmail: OWNER_EMAIL,
      memberEmails: [OWNER_EMAIL],
      cities: [],
      days: [],
    },
    cities: audit(sourceTrip.cities),
    days,
    todos: audit(todos),
    accommodations: audit(accommodations),
    transportBookings: audit(transportBookings),
    tickets: audit(tickets),
  };
}

export const seedWorkspace = createSeedWorkspace();
