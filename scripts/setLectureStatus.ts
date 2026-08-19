// scripts/setLectureStatus.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
    // L001 (Arrays, teacher1's subject) -> live, for the two-device test
    await db.collection("lectures").doc("L001").update({ status: "live" });
    console.log("L001 set to live");

    // L002 -> upcoming, so you can also test the "Start Lecture" (non-live) button state
    await db.collection("lectures").doc("L002").update({ status: "upcoming" });
    console.log("L002 set to upcoming");
}
run().then(() => process.exit(0));