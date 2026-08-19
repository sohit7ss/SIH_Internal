// scripts/checkDoubts.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function check() {
    const snap = await db.collection("doubts").get();
    snap.docs.forEach((doc) => {
        const d = doc.data();
        console.log(doc.id, {
            subject: d.subject,
            subjectIsString: typeof d.subject === "string",
            questionText: d.questionText,
            replyText: d.replyText,
            status: d.status,
            teacherId: d.teacherId,
        });
    });
}
check().then(() => process.exit(0));