import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { createSeedWorkspace, OWNER_EMAIL, TRIP_ID } from "../src/data/seed";

function credentials() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("請先設定 FIREBASE_SERVICE_ACCOUNT_JSON（完整 service account JSON）。");
  return JSON.parse(raw.replace(/^'|'$/g, ""));
}

const app = getApps()[0] ?? initializeApp({ credential: cert(credentials()), projectId: process.env.FIREBASE_PROJECT_ID });
const db = getFirestore(app);
const workspace = createSeedWorkspace();
const now = FieldValue.serverTimestamp();
const updatedBy = { uid: "seed", name: "初始資料", email: OWNER_EMAIL };

function clean<T extends Record<string, unknown>>(value: T, omissions: string[] = []) {
  return Object.fromEntries(Object.entries(value).filter(([key, item]) => !omissions.includes(key) && item !== undefined));
}

async function seed() {
  const tripRef = db.doc(`trips/${TRIP_ID}`);
  await tripRef.set({
    ...clean(workspace.trip as unknown as Record<string, unknown>, ["id", "cities", "days"]),
    createdAt: now,
    updatedAt: now,
    updatedBy,
  }, { merge: true });

  const batch = db.batch();
  for (const city of workspace.cities) batch.set(tripRef.collection("cities").doc(city.id), { ...clean(city as unknown as Record<string, unknown>, ["id", "createdAt", "updatedAt"]), createdAt: now, updatedAt: now }, { merge: true });
  for (const day of workspace.days) {
    const dayRef = tripRef.collection("days").doc(day.id);
    batch.set(dayRef, { ...clean(day as unknown as Record<string, unknown>, ["id", "places", "transportation", "createdAt", "updatedAt"]), createdAt: now, updatedAt: now }, { merge: true });
    for (const place of day.places) batch.set(dayRef.collection("places").doc(place.id), { ...clean(place as unknown as Record<string, unknown>, ["id", "createdAt", "updatedAt"]), createdAt: now, updatedAt: now }, { merge: true });
    for (const transport of day.transportation ?? []) batch.set(dayRef.collection("transports").doc(transport.id), { ...clean(transport as unknown as Record<string, unknown>, ["id", "createdAt", "updatedAt"]), createdAt: now, updatedAt: now }, { merge: true });
  }
  for (const [name, items] of [
    ["todos", workspace.todos],
    ["accommodations", workspace.accommodations],
    ["transportBookings", workspace.transportBookings],
    ["tickets", workspace.tickets],
  ] as const) {
    for (const item of items) batch.set(tripRef.collection(name).doc(item.id), { ...clean(item as unknown as Record<string, unknown>, ["id", "createdAt", "updatedAt"]), createdAt: now, updatedAt: now }, { merge: true });
  }
  await batch.commit();
  console.log(`Seed completed: ${TRIP_ID} (${OWNER_EMAIL})`);
}

seed().catch((error) => { console.error(error); process.exitCode = 1; });
