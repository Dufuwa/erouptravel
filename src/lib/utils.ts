import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildGoogleMapsUrl(query: string, latitude?: number, longitude?: number) {
  const destination = latitude != null && longitude != null ? `${latitude},${longitude}` : query;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function buildGoogleMapsSearchUrl(query: string, latitude?: number, longitude?: number) {
  const location = latitude != null && longitude != null ? `${latitude},${longitude}` : query;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function isGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (url.hostname === "maps.app.goo.gl") return true;
    return /(^|\.)google\.[a-z.]+$/i.test(url.hostname) && (url.pathname.startsWith("/maps") || url.hostname.startsWith("maps."));
  } catch {
    return false;
  }
}

export function resolveGoogleMapsUrl(
  place: { googleMapsUrl?: string; mapQuery?: string; address?: string; name: string; latitude?: number; longitude?: number },
  mode: "search" | "directions" = "search",
) {
  if (place.googleMapsUrl && isGoogleMapsUrl(place.googleMapsUrl)) return place.googleMapsUrl;
  const query = place.mapQuery || place.address || place.name;
  return mode === "directions"
    ? buildGoogleMapsUrl(query, place.latitude, place.longitude)
    : buildGoogleMapsSearchUrl(query, place.latitude, place.longitude);
}

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function formatCurrency(value?: number, currency = "EUR") {
  if (value == null) return "—";
  return new Intl.NumberFormat("zh-TW", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function formatUpdatedAt(value?: string) {
  if (!value) return "尚未更新";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "尚未更新";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}
