"use client";

import {
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
import type { Trip } from "@/types/types";

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

  const names: CollectionName[] = ["cities", "days", "todos", "accommodations", "transportBookings", "tickets"];
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

export async function removeEntity(tripId: string, collectionName: CollectionName, id: string, expectedUpdatedAt?: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase 尚未設定");
  const reference = doc(db, "trips", tripId, collectionName, id);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(reference);
    const remoteUpdatedAt = existing.exists() ? (normalize(existing.data().updatedAt) as string | undefined) : undefined;
    if (expectedUpdatedAt && remoteUpdatedAt && expectedUpdatedAt !== remoteUpdatedAt) throw new ConflictError();
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

export async function removeNestedEntity(tripId: string, dayId: string, collectionName: NestedCollectionName, id: string, expectedUpdatedAt?: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase 尚未設定");
  const reference = doc(db, "trips", tripId, "days", dayId, collectionName, id);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(reference);
    const remoteUpdatedAt = existing.exists() ? (normalize(existing.data().updatedAt) as string | undefined) : undefined;
    if (expectedUpdatedAt && remoteUpdatedAt && expectedUpdatedAt !== remoteUpdatedAt) throw new ConflictError();
    transaction.delete(reference);
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
