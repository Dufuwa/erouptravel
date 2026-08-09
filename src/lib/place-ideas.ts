import type { Place, PlaceIdea, TripDay } from "@/types/types";

function normalize(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
}

function stableHash(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}

export function placeIdeaFingerprint(cityId: string | undefined, place: Pick<Place, "name" | "mapQuery" | "latitude" | "longitude">) {
  const location = place.latitude != null && place.longitude != null
    ? `${place.latitude.toFixed(6)},${place.longitude.toFixed(6)}`
    : normalize(place.mapQuery || place.name);
  return `${cityId ?? "unclassified"}|${location}`;
}

export function placeIdeaId(fingerprint: string) {
  return `idea-${stableHash(fingerprint)}`;
}

export function buildPlaceIdeaCatalog(sourceDays: TripDay[]) {
  const ideas = new Map<string, PlaceIdea>();
  const fingerprints = new Map<string, string>();
  const seenByFingerprint = new Map<string, Set<string>>();
  let sortOrder = 0;

  const days = sourceDays.map((day) => ({
    ...day,
    places: day.places.map((place) => {
      const baseFingerprint = placeIdeaFingerprint(day.cityId, place);
      const seenDays = seenByFingerprint.get(baseFingerprint) ?? new Set<string>();
      const fingerprint = seenDays.has(day.id) ? `${baseFingerprint}|${place.id}` : baseFingerprint;
      seenDays.add(day.id);
      seenByFingerprint.set(baseFingerprint, seenDays);

      let id = placeIdeaId(fingerprint);
      let suffix = 1;
      while (fingerprints.has(id) && fingerprints.get(id) !== fingerprint) {
        id = `${placeIdeaId(fingerprint)}-${suffix}`;
        suffix += 1;
      }
      fingerprints.set(id, fingerprint);

      const existing = ideas.get(id);
      if (existing) {
        if (!existing.scheduledDayIds.includes(day.id)) existing.scheduledDayIds.push(day.id);
      } else {
        ideas.set(id, {
          id,
          name: place.name,
          englishName: place.englishName,
          cityId: day.cityId,
          type: place.type ?? "sight",
          status: "want_to_go",
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          durationMinutes: place.durationMinutes,
          mapQuery: place.mapQuery || `${place.name}`,
          googleMapsUrl: place.googleMapsUrl,
          note: place.note,
          scheduledDayIds: [day.id],
          sortOrder,
        });
        sortOrder += 1;
      }

      return { ...place, sourceIdeaId: id };
    }),
  }));

  return { days, placeIdeas: [...ideas.values()] };
}

export function filterPlaceIdeas(
  ideas: PlaceIdea[],
  filters: { query: string; cityId: string; type: string; status: string; schedule: string },
) {
  const query = normalize(filters.query);
  return ideas.filter((idea) => {
    const haystack = normalize([idea.name, idea.englishName, idea.address, idea.note, idea.mapQuery].filter(Boolean).join(" "));
    const scheduled = idea.scheduledDayIds.length > 0;
    return (!query || haystack.includes(query))
      && (filters.cityId === "all" || idea.cityId === filters.cityId)
      && (filters.type === "all" || idea.type === filters.type)
      && (filters.status === "all" || idea.status === filters.status)
      && (filters.schedule === "all" || (filters.schedule === "scheduled" ? scheduled : !scheduled));
  });
}
