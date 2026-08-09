import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { TRIP_ID } from "../src/data/seed";

const projectId = process.env.FIREBASE_PROJECT_ID ?? "erouptravel";
const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore(app);

async function verify() {
  const tripRef = db.doc(`trips/${TRIP_ID}`);
  const [trip, cities, days, todos, accommodations, transportBookings, tickets, placeIdeas] = await Promise.all([
    tripRef.get(),
    tripRef.collection("cities").get(),
    tripRef.collection("days").get(),
    tripRef.collection("todos").get(),
    tripRef.collection("accommodations").get(),
    tripRef.collection("transportBookings").get(),
    tripRef.collection("tickets").get(),
    tripRef.collection("placeIdeas").get(),
  ]);

  if (!trip.exists) throw new Error(`Missing trip document: ${TRIP_ID}`);

  const nested = await Promise.all(days.docs.map(async (day) => {
    const [places, transports] = await Promise.all([
      day.ref.collection("places").get(),
      day.ref.collection("transports").get(),
    ]);
    return { places: places.size, linkedPlaces: places.docs.filter((place) => Boolean(place.get("sourceIdeaId"))).length, transports: transports.size };
  }));

  const summary = {
    projectId,
    tripId: TRIP_ID,
    ownerEmail: trip.get("ownerEmail"),
    cities: cities.size,
    days: days.size,
    places: nested.reduce((total, item) => total + item.places, 0),
    linkedPlaces: nested.reduce((total, item) => total + item.linkedPlaces, 0),
    dayTransports: nested.reduce((total, item) => total + item.transports, 0),
    todos: todos.size,
    accommodations: accommodations.size,
    transportBookings: transportBookings.size,
    tickets: tickets.size,
    placeIdeas: placeIdeas.size,
  };

  console.log(JSON.stringify(summary, null, 2));
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
