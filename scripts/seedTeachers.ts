// scripts/seedTeachers.ts
// Creates REAL Firebase Auth accounts + matching Firestore teacher docs,
// so Section A's teacher-side work has real accounts to log into.

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");

initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();

const teachers = [
  { email: "teacher1@test.com", password: "test1234", name: "Meera Nair", classesTaught: ["class_10a"] },
  { email: "teacher2@test.com", password: "test1234", name: "Arjun Malhotra", classesTaught: ["class_10a"] },
];

async function seedTeachers() {
  for (const t of teachers) {
    let uid: string;
    try {
      const userRecord = await auth.createUser({
        email: t.email,
        password: t.password,
        displayName: t.name,
      });
      uid = userRecord.uid;
      console.log(`Created auth account: ${t.email}`);
    } catch (err: any) {
      if (err.code === "auth/email-already-exists") {
        const existing = await auth.getUserByEmail(t.email);
        uid = existing.uid;
        console.log(`Auth account already exists: ${t.email}`);
      } else {
        throw err;
      }
    }

    await db.collection("teachers").doc(uid).set({
      id: uid,
      authUid: uid,
      name: t.name,
      email: t.email,
      classesTaught: t.classesTaught,
    });
    console.log(`Firestore teacher doc set for ${t.email}`);
  }

  console.log("✅ Teacher seeding complete");
}

seedTeachers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Teacher seed failed:", err);
    process.exit(1);
  });