export type TodoCategory = "accommodation" | "transport" | "ticket" | "other";
export type TodoStatus = "not_started" | "in_progress" | "completed" | "not_applicable";
export type Priority = "high" | "medium" | "low";
export type BookingStatus = "not_booked" | "booked" | "confirmed" | "cancelled";
export type TicketStatus = "not_purchased" | "purchased";
export type TransportType = "flight" | "train" | "bus" | "shuttle" | "rental_car" | "local_transport";

export interface AuditFields {
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: {
    uid: string;
    name: string;
    email: string;
  };
}

export interface Trip extends AuditFields {
  id: string;
  title: string;
  subtitle?: string;
  startDate: string;
  endDate: string;
  countries: string[];
  cities: City[];
  days: TripDay[];
  timezone?: string;
  ownerEmail?: string;
  memberEmails?: string[];
}

export interface City extends AuditFields {
  id: string;
  name: string;
  englishName: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  accommodationId?: string;
  note?: string;
}

export interface TripDay extends AuditFields {
  id: string;
  dayNumber: number;
  date: string;
  cityId: string;
  title: string;
  subtitle?: string;
  places: Place[];
  transportation?: DayTransport[];
  note?: string;
}

export interface Place extends AuditFields {
  id: string;
  name: string;
  englishName?: string;
  time?: string;
  type?: "sight" | "food" | "shopping" | "hotel" | "transport" | "viewpoint" | "activity" | "other";
  address?: string;
  latitude?: number;
  longitude?: number;
  durationMinutes?: number;
  ticketId?: string;
  note?: string;
  mapQuery?: string;
}

export interface DayTransport extends AuditFields {
  id: string;
  type: TransportType;
  label: string;
  from?: string;
  to?: string;
  departureTime?: string;
  arrivalTime?: string;
  bookingId?: string;
  note?: string;
}

export interface Todo extends AuditFields {
  id: string;
  category: TodoCategory;
  title: string;
  city?: string;
  tripDate?: string;
  recommendedCompleteDate?: string;
  priority: Priority;
  status: TodoStatus;
  nextAction?: string;
  platform?: string;
  bookingNumber?: string;
  amount?: number;
  currency?: string;
  note?: string;
}

export interface Accommodation extends AuditFields {
  id: string;
  cityId: string;
  city: string;
  hotelName?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  bookingPlatform?: string;
  bookingNumber?: string;
  price?: number;
  currency?: string;
  parking?: string;
  breakfast?: boolean;
  status: BookingStatus;
  bookingUrl?: string;
  note?: string;
}

export interface TransportBooking extends AuditFields {
  id: string;
  type: TransportType;
  title: string;
  from: string;
  to: string;
  date: string;
  departureTime?: string;
  arrivalTime?: string;
  provider?: string;
  serviceNumber?: string;
  seat?: string;
  bookingNumber?: string;
  price?: number;
  currency?: string;
  status: BookingStatus;
  ticketUrl?: string;
  note?: string;
}

export interface Ticket extends AuditFields {
  id: string;
  name: string;
  cityId: string;
  date: string;
  time?: string;
  placeId?: string;
  bookingNumber?: string;
  ticketUrl?: string;
  fileUrl?: string;
  price?: number;
  currency?: string;
  status: TicketStatus;
  note?: string;
}
