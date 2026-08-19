// scripts/migrateDoubtFields.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function migrate() {
    const snap = await db.collection("doubts").get();
    for (const doc of snap.docs) {
        const d = doc.data();

        await doc.ref.update({
            questionText: d.text ?? d.questionText ?? "",
            replyText: d.response ?? d.replyText ?? null,
            respondedAt: d.resolvedAt ?? d.respondedAt ?? null,
            text: FieldValue.delete(),
            response: FieldValue.delete(),
            resolvedAt: FieldValue.delete(),
        });
    }
    console.log(`Migrated ${snap.docs.length} doubts`);
}
migrate().then(() => process.exit(0));