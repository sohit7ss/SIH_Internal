// scripts/promoteDemoStudent.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();

async function promote() {
    const email = "demo_S001@test.local"; // pick which demo student to promote
    const password = "test1234";

    const userRecord = await auth.createUser({ email, password });
    const oldDoc = await db.collection("students").doc("demo_S001").get();
    const data = oldDoc.data()!;

    // Write under the REAL uid, update authUid/id to match, delete old placeholder doc
    await db.collection("students").doc(userRecord.uid).set({
        ...data,
        id: userRecord.uid,
        authUid: userRecord.uid,
    });
    await db.collection("students").doc("demo_S001").delete();

    console.log(`✅ demo_S001 promoted — login: ${email} / ${password}`);
}
promote().then(() => process.exit(0));