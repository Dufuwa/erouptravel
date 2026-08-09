// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";

let testEnv: RulesTestEnvironment;
const tripPath = "trips/central-europe-2027";

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({ projectId: "erouptravel-test", firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 } });
});
beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => setDoc(doc(context.firestore(), tripPath), { ownerEmail: "owner@example.com", memberEmails: ["owner@example.com", "member@example.com"], title: "Trip" }));
});
afterAll(async () => testEnv.cleanup());

describe("Firestore member rules", () => {
  it("拒絕未登入與非成員", async () => {
    await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), tripPath)));
    await assertFails(getDoc(doc(testEnv.authenticatedContext("outsider", { email: "other@example.com" }).firestore(), tripPath)));
  });
  it("允許成員讀寫子集合", async () => {
    const db = testEnv.authenticatedContext("member", { email: "member@example.com" }).firestore();
    await assertSucceeds(getDoc(doc(db, tripPath)));
    await assertSucceeds(setDoc(doc(db, `${tripPath}/todos/todo-1`), { title: "Book train" }));
    await assertSucceeds(setDoc(doc(db, `${tripPath}/placeIdeas/idea-1`), { name: "Museum", scheduledDayIds: [] }));
    await assertSucceeds(setDoc(doc(db, `${tripPath}/days/day-1/places/place-1`), { name: "Museum" }));
    await assertFails(setDoc(doc(db, `${tripPath}/private/secret-1`), { value: "not allowed" }));
    await assertFails(setDoc(doc(db, `${tripPath}/todos/todo-1/private/secret-1`), { value: "not allowed" }));
  });
  it("只有擁有者能調整旅伴名單", async () => {
    const memberDb = testEnv.authenticatedContext("member", { email: "member@example.com" }).firestore();
    const ownerDb = testEnv.authenticatedContext("owner", { email: "owner@example.com" }).firestore();
    await assertFails(updateDoc(doc(memberDb, tripPath), { memberEmails: ["member@example.com"] }));
    await assertSucceeds(updateDoc(doc(ownerDb, tripPath), { memberEmails: ["owner@example.com"] }));
    await assertFails(updateDoc(doc(ownerDb, tripPath), { memberEmails: [] }));
    await assertFails(updateDoc(doc(ownerDb, tripPath), { ownerEmail: "attacker@example.com" }));
  });
});
