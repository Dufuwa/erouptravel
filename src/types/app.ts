import type {
  Accommodation,
  City,
  DayTransport,
  Ticket,
  Todo,
  TransportBooking,
  Trip,
  TripDay,
} from "./types";

export interface TripWorkspace {
  trip: Trip;
  cities: City[];
  days: TripDay[];
  todos: Todo[];
  accommodations: Accommodation[];
  transportBookings: TransportBooking[];
  tickets: Ticket[];
}

export type CollectionName =
  | "cities"
  | "days"
  | "todos"
  | "accommodations"
  | "transportBookings"
  | "tickets";

export type CollectionEntity =
  | City
  | TripDay
  | Todo
  | Accommodation
  | TransportBooking
  | Ticket;

export type NestedCollectionName = "places" | "transports";
export type NestedEntity = TripDay["places"][number] | DayTransport;

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  isDemo?: boolean;
}

export interface MutationOptions {
  expectedUpdatedAt?: string;
}

export class ConflictError extends Error {
  constructor() {
    super("這筆資料已被其他旅伴更新，請重新整理後再試一次。");
    this.name = "ConflictError";
  }
}
