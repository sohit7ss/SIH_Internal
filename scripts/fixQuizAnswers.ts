// scripts/fixQuizAnswers.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function fix() {
    const snap = await db.collection("quizzes").get();
    for (const doc of snap.docs) {
        const q = doc.data();
        const updatedQuestions = q.questions.map((question: any) => ({
            id: question.id,
            text: question.text,
            options: question.options,
            correctAnswer: question.options[question.correctIndex ?? 0], // was Option A for all placeholders
        }));
        await doc.ref.update({ questions: updatedQuestions });
    }
    console.log(`Fixed ${snap.docs.length} quizzes`);
}
fix().then(() => process.exit(0));