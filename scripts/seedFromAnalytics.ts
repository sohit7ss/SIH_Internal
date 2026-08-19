// scripts/seedFromAnalytics.ts
// Imports the trimmed/transformed analytics dataset into real Firestore collections.

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");

const students = require("./data/students_seed.json");
const lectures = require("./data/lectures_seed.json");
const quizzes = require("./data/quizzes_seed.json");
const lectureProgress = require("./data/lectureProgress_seed.json");
const quizResponses = require("./data/quizResponses_seed.json");
const appUsage = require("./data/appUsage_seed.json");
const aiUsage = require("./data/aiUsage_seed.json");
const weeklyActivity = require("./data/weeklyActivity_seed.json");

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

async function batchWrite(collectionName: string, docs: any[], idField: string) {
    const batchSize = 400; // Firestore batch limit is 500
    for (let i = 0; i < docs.length; i += batchSize) {
        const batch = db.batch();
        const chunk = docs.slice(i, i + batchSize);
        for (const d of chunk) {
            const ref = db.collection(collectionName).doc(d[idField]);
            batch.set(ref, d);
        }
        await batch.commit();
        console.log(`${collectionName}: wrote ${i + chunk.length}/${docs.length}`);
    }
}

async function seed() {
    // Resolve real teacher UIDs to substitute for placeholder tokens
    const teacher1 = await auth.getUserByEmail("teacher1@test.com");
    const teacher2 = await auth.getUserByEmail("teacher2@test.com");

    const resolvedLectures = lectures.map((l: any) => ({
        ...l,
        teacherId: l.teacherId === "{{teacher1}}" ? teacher1.uid : teacher2.uid,
    }));

    await batchWrite("students", students, "id");
    await batchWrite("lectures", resolvedLectures, "id");
    await batchWrite("quizzes", quizzes, "id");

    // composite-key docs
    const progressWithIds = lectureProgress.map((p: any) => ({ ...p, __docId: `${p.studentId}_${p.lectureId}` }));
    await batchWrite("lectureProgress", progressWithIds, "__docId");

    const respWithIds = quizResponses.map((r: any) => ({ ...r, __docId: `${r.studentId}_${r.quizId}` }));
    await batchWrite("quizResponses", respWithIds, "__docId");

    await batchWrite("appUsage", appUsage, "id");
    await batchWrite("aiUsage", aiUsage, "id");

    const weeklyWithIds = weeklyActivity.map((w: any) => ({ ...w, __docId: `${w.studentId}_week${w.week}` }));
    await batchWrite("weeklyActivity", weeklyWithIds, "__docId");

    console.log("✅ Analytics seed complete");
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Seed failed:", err);
        process.exit(1);
    });