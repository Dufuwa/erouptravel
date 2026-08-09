"use client";

import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "./client";
import { ConflictError, type AppUser, type CollectionEntity, type CollectionName, type NestedCollectionName, type NestedEntity, type TripWorkspace } from "@/types/app";
import type { Place, PlaceIdea, Trip } from "@/types/types";

function normalize(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalize(item)]));
  }
  return value;
}

function audit(user: AppUser) {
  return {
    updatedAt: serverTimestamp(),
    updatedBy: { uid: user.uid, name: user.displayName, email: user.email },
  };
}

function withoutUndefined(value: DocumentData) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

export async function loadWorkspace(tripId: string): Promise<TripWorkspace | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const tripSnapshot = await getDoc(doc(db, "trips", tripId));
  if (!tripSnapshot.exists()) return null;

  const names: CollectionName[] = ["cities", "days", "todos", "accommodations", "transportBookings", "tickets", "placeIdeas"];
  const snapshots = await Promise.all(names.map((name) => getDocs(collection(db, "trips", tripId, name))));
  const values = Object.fromEntries(
    snapshots.map((snapshot, index) => [
      names[index],
      snapshot.docs.map((item) => ({ id: item.id, ...(normalize(item.data()) as object) })).sort((a, b) => ((a as { sortOrder?: number }).sortOrder ?? 0) - ((b as { sortOrder?: number }).sortOrder ?? 0)),
    ]),
  ) as unknown as Omit<TripWorkspace, "trip">;

  const days = await Promise.all(
    values.days.map(async (day) => {
      const [places, transports] = await Promise.all([
        getDocs(collection(db, "trips", tripId, "days", day.id, "places")),
        getDocs(collection(db, "trips", tripId, "days", day.id, "transports")),
      ]);
      const mapDocs = (snapshot: typeof places) =>
        snapshot.docs
          .map((item) => ({ id: item.id, ...(normalize(item.data()) as object) }))
          .sort((a, b) => ((a as { sortOrder?: number }).sortOrder ?? 0) - ((b as { sortOrder?: number }).sortOrder ?? 0));
      return { ...day, places: mapDocs(places), transportation: mapDocs(transports) };
    }),
  );

  return {
    trip: { id: tripSnapshot.id, ...(normalize(tripSnapshot.data()) as Omit<Trip, "id">), cities: [], days: [] },
    ...values,
    days,
  } as unknown as TripWorkspace;
}

export async function saveEntity(
  tripId: string,
  collectionName: CollectionName,
  entity: CollectionEntity,
  user: AppUser,
  expectedUpdatedAt?: string,
) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase 尚未設定");
  const reference = doc(db, "trips", tripId, collectionName, entity.id);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(reference);
    const remoteUpdatedAt = existing.exists() ? (normalize(existing.data().updatedAt) as string | undefined) : undefined;
    if (expectedUpdatedAt && remoteUpdatedAt && expectedUpdatedAt !== remoteUpdatedAt) throw new ConflictError();
    const { id: _id, places: _places, transportation: _transportation, ...payload } = entity as CollectionEntity & {
      places?: unknown;
      transportation?: unknown;
    };
    void _id;
    void _places;
    void _transportation;
    transaction.set(reference, withoutUndefined({ ...payload, ...audit(user), ...(existing.exists() ? {} : { createdAt: serverTimestamp() }) }), { merge: true });
  });
}

export async function removeEntity(tripId: string, collectionName: CollectionName, id: string, user: AppUser, expectedUpdatedAt?: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase 尚未設定");
  const reference = doc(db, "trips", tripId, collectionName, id);
  const childSnapshots = collectionName === "days"
    ? (await Promise.all([
        getDocs(collection(db, "trips", tripId, "days", id, "places")),
        getDocs(collection(db, "trips", tripId, "days", id, "transports")),
      ])).flatMap((snapshot) => snapshot.docs)
    : [];
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(reference);
    const remoteUpdatedAt = existing.exists() ? (normalize(existing.data().updatedAt) as string | undefined) : undefined;
    if (expectedUpdatedAt && remoteUpdatedAt && expectedUpdatedAt !== remoteUpdatedAt) throw new ConflictError();
    if (collectionName === "placeIdeas" && ((existing.data()?.scheduledDayIds as string[] | undefined)?.length ?? 0) > 0) {
      throw new Error("此收藏仍在行程中，請先移除所有排程後再刪除。");
    }
    const sourceIdeaIds = [...new Set(childSnapshots.map((child) => child.data().sourceIdeaId as string | undefined).filter(Boolean))] as string[];
    const ideaReferences = sourceIdeaIds.map((ideaId) => doc(db, "trips", tripId, "placeIdeas", ideaId));
    const ideaSnapshots = await Promise.all(ideaReferences.map((ideaReference) => transaction.get(ideaReference)));
    childSnapshots.forEach((child) => transaction.delete(child.ref));
    ideaSnapshots.forEach((ideaSnapshot) => {
      if (ideaSnapshot.exists()) transaction.update(ideaSnapshot.ref, { scheduledDayIds: arrayRemove(id), ...audit(user) });
    });
    transaction.delete(reference);
  });
}

export async function saveNestedEntity(
  tripId: string,
  dayId: string,
  collectionName: NestedCollectionName,
  entity: NestedEntity,
  user: AppUser,
  expectedUpdatedAt?: string,
) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase 尚未設定");
  const reference = doc(db, "trips", tripId, "days", dayId, collectionName, entity.id);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(reference);
    const remoteUpdatedAt = existing.exists() ? (normalize(existing.data().updatedAt) as string | undefined) : undefined;
    if (expectedUpdatedAt && remoteUpdatedAt && expectedUpdatedAt !== remoteUpdatedAt) throw new ConflictError();
    const { id: _id, ...payload } = entity;
    void _id;
    transaction.set(reference, withoutUndefined({ ...payload, ...audit(user), ...(existing.exists() ? {} : { createdAt: serverTimestamp() }) }), { merge: true });
  });
}

export async function removeNestedEntity(tripId: string, dayId: string, collectionName: NestedCollectionName, entity: NestedEntity, user: AppUser, expectedUpdatedAt?: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase 尚未設定");
  const reference = doc(db, "trips", tripId, "days", dayId, collectionName, entity.id);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(reference);
    const remoteUpdatedAt = existing.exists() ? (normalize(existing.data().updatedAt) as string | undefined) : undefined;
    if (expectedUpdatedAt && remoteUpdatedAt && expectedUpdatedAt !== remoteUpdatedAt) throw new ConflictError();
    const sourceIdeaId = collectionName === "places" ? (entity as Place).sourceIdeaId : undefined;
    const ideaReference = sourceIdeaId ? doc(db, "trips", tripId, "placeIdeas", sourceIdeaId) : null;
    const ideaSnapshot = ideaReference ? await transaction.get(ideaReference) : null;
    transaction.delete(reference);
    if (ideaSnapshot?.exists()) transaction.update(ideaSnapshot.ref, { scheduledDayIds: arrayRemove(dayId), ...audit(user) });
  });
}

export async function schedulePlaceIdea(
  tripId: string,
  dayId: string,
  idea: PlaceIdea,
  sortOrder: number,
  user: AppUser,
) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase 尚未設定");
  const ideaReference = doc(db, "trips", tripId, "placeIdeas", idea.id);
  const placeReference = doc(db, "trips", tripId, "days", dayId, "places", idea.id);
  await runTransaction(db, async (transaction) => {
    const [ideaSnapshot, placeSnapshot] = await Promise.all([
      transaction.get(ideaReference),
      transaction.get(placeReference),
    ]);
    if (!ideaSnapshot.exists()) throw new Error("找不到這筆收藏，請重新整理後再試。");
    const scheduledDayIds = (ideaSnapshot.data().scheduledDayIds as string[] | undefined) ?? [];
    if (scheduledDayIds.includes(dayId) || placeSnapshot.exists()) throw new Error("這個景點已排入該日期。");
    const place: Omit<Place, "id"> = {
      name: idea.name,
      englishName: idea.englishName,
      type: idea.type,
      address: idea.address,
      latitude: idea.latitude,
      longitude: idea.longitude,
      durationMinutes: idea.durationMinutes,
      mapQuery: idea.mapQuery,
      googleMapsUrl: idea.googleMapsUrl,
      note: idea.note,
      sourceIdeaId: idea.id,
      sortOrder,
    };
    transaction.set(placeReference, withoutUndefined({ ...place, createdAt: serverTimestamp(), ...audit(user) }));
    transaction.update(ideaReference, { scheduledDayIds: arrayUnion(dayId), ...audit(user) });
  });
}

export async function saveTrip(tripId: string, patch: Partial<Trip>, user: AppUser, expectedUpdatedAt?: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase 尚未設定");
  const reference = doc(db, "trips", tripId);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(reference);
    if (!existing.exists()) throw new Error("找不到行程");
    const remoteUpdatedAt = normalize(existing.data().updatedAt) as string | undefined;
    if (expectedUpdatedAt && remoteUpdatedAt && expectedUpdatedAt !== remoteUpdatedAt) throw new ConflictError();
    const cleaned = Object.fromEntries(Object.entries(patch).map(([key, value]) => [key, value === undefined ? deleteField() : value]));
    transaction.update(reference, { ...cleaned, ...audit(user) });
  });
}
