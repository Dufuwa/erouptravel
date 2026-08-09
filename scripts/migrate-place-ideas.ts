import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, type DocumentReference, type WriteBatch } from "firebase-admin/firestore";
import { placeIdeaFingerprint, placeIdeaId } from "../src/lib/place-ideas";
import { TRIP_ID } from "../src/data/seed";
import type { Place, PlaceIdea } from "../src/types/types";

const projectId = process.env.FIREBASE_PROJECT_ID ?? "erouptravel";
const apply = process.argv.includes("--apply");
const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore(app);

interface PendingWrite { reference: DocumentReference; data: Record<string, unknown>; merge: boolean }

function omitUndefined(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

async function commitInChunks(writes: PendingWrite[]) {
  for (let offset = 0; offset < writes.length; offset += 400) {
    const batch: WriteBatch = db.batch();
    for (const write of writes.slice(offset, offset + 400)) batch.set(write.reference, write.data, { merge: write.merge });
    await batch.commit();
  }
}

async function migrate() {
  const tripRef = db.doc(`trips/${TRIP_ID}`);
  const [daysSnapshot, ideasSnapshot] = await Promise.all([
    tripRef.collection("days").get(),
    tripRef.collection("placeIdeas").get(),
  ]);
  const existingIdeas = new Map(ideasSnapshot.docs.map((item) => [item.id, item.data()]));
  const pendingIdeas = new Map<string, PlaceIdea & { migrationFingerprint: string }>();
  const seenByFingerprint = new Map<string, Set<string>>();
  const writes: PendingWrite[] = [];
  let placesRead = 0;
  let placeLinksAdded = 0;
  let existingLinks = 0;
  let reusedIdeas = 0;
  let nextSortOrder = ideasSnapshot.size;

  const dayDocs = [...daysSnapshot.docs].sort((a, b) => String(a.data().date).localeCompare(String(b.data().date)));
  for (const dayDoc of dayDocs) {
    const placesSnapshot = await dayDoc.ref.collection("places").get();
    const places = [...placesSnapshot.docs].sort((a, b) => Number(a.data().sortOrder ?? 0) - Number(b.data().sortOrder ?? 0));
    for (const placeDoc of places) {
      placesRead += 1;
      const place = { id: placeDoc.id, ...placeDoc.data() } as Place;
      if (place.sourceIdeaId && existingIdeas.has(place.sourceIdeaId)) {
        existingLinks += 1;
        const currentDays = (existingIdeas.get(place.sourceIdeaId)?.scheduledDayIds as string[] | undefined) ?? [];
        if (!currentDays.includes(dayDoc.id)) {
          writes.push({ reference: tripRef.collection("placeIdeas").doc(place.sourceIdeaId), data: { scheduledDayIds: FieldValue.arrayUnion(dayDoc.id), updatedAt: FieldValue.serverTimestamp() }, merge: true });
        }
        continue;
      }

      const baseFingerprint = placeIdeaFingerprint(dayDoc.data().cityId as string | undefined, place);
      const seenDays = seenByFingerprint.get(baseFingerprint) ?? new Set<string>();
      const fingerprint = seenDays.has(dayDoc.id) ? `${baseFingerprint}|${place.id}` : baseFingerprint;
      seenDays.add(dayDoc.id);
      seenByFingerprint.set(baseFingerprint, seenDays);
      let ideaId = placeIdeaId(fingerprint);
      const colliding = existingIdeas.get(ideaId);
      if (colliding && colliding.migrationFingerprint !== fingerprint) ideaId = `${ideaId}-${place.id}`;

      const existing = existingIdeas.get(ideaId);
      const pending = pendingIdeas.get(ideaId);
      if (existing || pending) reusedIdeas += 1;
      if (pending) {
        if (!pending.scheduledDayIds.includes(dayDoc.id)) pending.scheduledDayIds.push(dayDoc.id);
      } else if (!existing) {
        pendingIdeas.set(ideaId, {
          id: ideaId,
          name: place.name,
          englishName: place.englishName,
          cityId: dayDoc.data().cityId as string | undefined,
          type: place.type ?? "sight",
          status: "want_to_go",
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          durationMinutes: place.durationMinutes,
          mapQuery: place.mapQuery || place.name,
          googleMapsUrl: place.googleMapsUrl,
          note: place.note,
          scheduledDayIds: [dayDoc.id],
          sortOrder: nextSortOrder,
          migrationFingerprint: fingerprint,
        });
        nextSortOrder += 1;
      } else {
        writes.push({ reference: tripRef.collection("placeIdeas").doc(ideaId), data: { scheduledDayIds: FieldValue.arrayUnion(dayDoc.id), updatedAt: FieldValue.serverTimestamp() }, merge: true });
      }

      writes.push({ reference: placeDoc.ref, data: { sourceIdeaId: ideaId, updatedAt: FieldValue.serverTimestamp() }, merge: true });
      placeLinksAdded += 1;
    }
  }

  for (const idea of pendingIdeas.values()) {
    const { id, ...data } = idea;
    writes.push({
      reference: tripRef.collection("placeIdeas").doc(id),
      data: omitUndefined({ ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), updatedBy: { uid: "migration", name: "景點收藏遷移", email: "yishiuan81319@gmail.com" } }),
      merge: false,
    });
  }

  const summary = {
    mode: apply ? "apply" : "dry-run",
    projectId,
    tripId: TRIP_ID,
    daysRead: dayDocs.length,
    placesRead,
    existingIdeas: ideasSnapshot.size,
    newIdeas: pendingIdeas.size,
    reusedIdeas,
    existingLinks,
    placeLinksAdded,
    writes: writes.length,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (apply) {
    await commitInChunks(writes);
    console.log("Place idea migration applied successfully.");
  } else {
    console.log("Dry-run only. Re-run with --apply to write changes.");
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
