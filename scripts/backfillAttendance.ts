// scripts/backfillAttendance.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function backfill() {
    const [progressSnap, lecturesSnap] = await Promise.all([
        db.collection("lectureProgress").get(),
        db.collection("lectures").get(),
    ]);

    const lectureDurationSec: Record<string, number> = {};
    lecturesSnap.docs.forEach((d) => {
        const l = d.data();
        const start = new Date(l.scheduledStart).getTime();
        const end = new Date(l.scheduledEnd).getTime();
        lectureDurationSec[d.id] = Math.max((end - start) / 1000, 60);
    });

    const batchSize = 400;
    const docs = progressSnap.docs;
    for (let i = 0; i < docs.length; i += batchSize) {
        const batch = db.batch();
        const chunk = docs.slice(i, i + batchSize);
        for (const doc of chunk) {
            const p = doc.data();
            const required = lectureDurationSec[p.lectureId] ?? 0;
            if (required === 0) continue;
            const connected = p.watchDurationSec ?? 0;
            const present = connected >= required * 0.75;
            const ref = db.collection("attendance").doc(`${p.studentId}_${p.lectureId}`);
            batch.set(ref, {
                studentId: p.studentId,
                lectureId: p.lectureId,
                connectedDurationSec: connected,
                requiredDurationSec: required,
                present,
            });
        }
        await batch.commit();
        console.log(`Backfilled ${i + chunk.length}/${docs.length}`);
    }
    console.log("✅ Attendance backfill complete");
}
backfill().then(() => process.exit(0));