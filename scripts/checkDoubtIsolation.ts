// scripts/checkDoubtIsolation.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");
initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

async function check() {
    const t1 = await auth.getUserByEmail("teacher1@test.com");
    const t2 = await auth.getUserByEmail("teacher2@test.com");
    for (const [name, uid] of [["teacher1", t1.uid], ["teacher2", t2.uid]]) {
        const snap = await db.collection("doubts").where("teacherId", "==", uid).get();
        console.log(`${name}: ${snap.size} doubts`, snap.docs.map(d => d.id));
    }
}
check().then(() => process.exit(0));