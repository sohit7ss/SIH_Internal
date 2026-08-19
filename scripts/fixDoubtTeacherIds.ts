
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

async function fix() {
    const teacher1 = await auth.getUserByEmail("teacher1@test.com");
    const teacher2 = await auth.getUserByEmail("teacher2@test.com");

    const map: Record<string, string> = {
        teacher_1: teacher1.uid,
        teacher_2: teacher2.uid,
    };

    const snap = await db.collection("doubts").get();
    for (const doc of snap.docs) {
        const d = doc.data();
        const realUid = map[d.teacherId];
        if (realUid) {
            await doc.ref.update({ teacherId: realUid });
            console.log(`Updated ${doc.id}: ${d.teacherId} -> ${realUid}`);
        }
    }
    console.log("✅ Done");
}
fix().then(() => process.exit(0));