// scripts/seed.ts
// Seeds Firestore with sample data for: lectures, students, lectureProgress,
// attendance, quizzes, quizResponses — matching the locked schema exactly.
// scripts/seed.ts

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");

initializeApp({
    credential: cert(serviceAccount),
});

const db = getFirestore();

async function seed() {
    // ---------- students ----------
    const students = [
        { id: "student_1", name: "Aarav Sharma", email: "aarav@test.com", classId: "class_10a", subjects: ["math", "science"] },
        { id: "student_2", name: "Priya Verma", email: "priya@test.com", classId: "class_10a", subjects: ["math", "english"] },
        { id: "student_3", name: "Rohan Gupta", email: "rohan@test.com", classId: "class_10a", subjects: ["science", "english"] },
    ];
    for (const s of students) {
        await db.collection("students").doc(s.id).set(s);
    }

    // ---------- lectures ----------
    const lectures = [
        {
            id: "lecture_1",
            subject: "math",
            chapter: "Quadratic Equations",
            teacherId: "teacher_1",
            classId: "class_10a",
            scheduledStart: "2026-08-16T09:00:00.000Z",
            scheduledEnd: "2026-08-16T10:00:00.000Z",
            status: "upcoming",
            recordingUrl: null,
            summaryPdfUrl: null,
        },
        {
            id: "lecture_2",
            subject: "science",
            chapter: "Newton's Laws",
            teacherId: "teacher_1",
            classId: "class_10a",
            scheduledStart: "2026-08-15T09:00:00.000Z",
            scheduledEnd: "2026-08-15T10:00:00.000Z",
            status: "completed",
            recordingUrl: "https://res.cloudinary.com/demo/video/upload/sample.mp4",
            summaryPdfUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        },
        {
            id: "lecture_3",
            subject: "english",
            chapter: "Poetry Basics",
            teacherId: "teacher_2",
            classId: "class_10a",
            scheduledStart: "2026-08-15T11:00:00.000Z",
            scheduledEnd: "2026-08-15T11:45:00.000Z",
            status: "live",
            recordingUrl: null,
            summaryPdfUrl: null,
        },
    ];
    for (const l of lectures) {
        await db.collection("lectures").doc(l.id).set(l);
    }

    // ---------- lectureProgress ----------
    const lectureProgress = [
        { studentId: "student_1", lectureId: "lecture_2", status: "completed", watchDurationSec: 3600 },
        { studentId: "student_2", lectureId: "lecture_2", status: "in_progress", watchDurationSec: 1800 },
        { studentId: "student_3", lectureId: "lecture_2", status: "not_started", watchDurationSec: 0 },
    ];
    for (const p of lectureProgress) {
        await db.collection("lectureProgress").doc(`${p.studentId}_${p.lectureId}`).set(p);
    }

    // ---------- attendance ----------
    const attendance = [
        { studentId: "student_1", lectureId: "lecture_2", connectedDurationSec: 3600, requiredDurationSec: 3600, present: true },
        { studentId: "student_2", lectureId: "lecture_2", connectedDurationSec: 1800, requiredDurationSec: 3600, present: false },
        { studentId: "student_3", lectureId: "lecture_2", connectedDurationSec: 0, requiredDurationSec: 3600, present: false },
    ];
    for (const a of attendance) {
        await db.collection("attendance").doc(`${a.studentId}_${a.lectureId}`).set(a);
    }

    // ---------- quizzes ----------
    const quizzes = [
        {
            id: "quiz_1",
            subject: "math",
            chapter: "Quadratic Equations",
            questions: [
                { id: "q1", text: "What is the standard form of a quadratic equation?", options: ["ax+b=0", "ax^2+bx+c=0", "ax^3+b=0", "a/x=0"], correctIndex: 1 },
                { id: "q2", text: "How many roots does a quadratic equation have?", options: ["1", "2", "3", "0"], correctIndex: 1 },
            ],
            dueDate: "2026-08-20T23:59:00.000Z",
        },
        {
            id: "quiz_2",
            subject: "science",
            chapter: "Newton's Laws",
            questions: [
                { id: "q1", text: "Newton's first law is also called the law of?", options: ["Gravity", "Inertia", "Motion", "Energy"], correctIndex: 1 },
            ],
            dueDate: "2026-08-18T23:59:00.000Z",
        },
    ];
    for (const q of quizzes) {
        await db.collection("quizzes").doc(q.id).set(q);
    }

    // ---------- quizResponses ----------
    const quizResponses = [
        { studentId: "student_1", quizId: "quiz_2", answers: { q1: 1 }, status: "submitted", score: 100, lastSavedAt: "2026-08-15T12:00:00.000Z" },
        { studentId: "student_2", quizId: "quiz_2", answers: {}, status: "in_progress", score: null, lastSavedAt: "2026-08-15T12:05:00.000Z" },
    ];
    for (const r of quizResponses) {
        await db.collection("quizResponses").doc(`${r.studentId}_${r.quizId}`).set(r);
    }

    // ---------- doubts ----------
    const doubts = [
        {
            id: "doubt_1",
            studentId: "student_1",
            teacherId: "teacher_1",
            classId: "class_10a",
            subject: "math",
            lectureId: "lecture_1",
            text: "Why does the discriminant tell us the number of real roots?",
            status: "open",
            response: null,
            createdAt: "2026-08-15T10:00:00.000Z",
            resolvedAt: null,
        },
        {
            id: "doubt_2",
            studentId: "student_2",
            teacherId: "teacher_1",
            classId: "class_10a",
            subject: "science",
            lectureId: "lecture_2",
            text: "Is the third law true even when objects aren't touching?",
            status: "resolved",
            response: "Yes — action-reaction pairs apply to non-contact forces too, like gravity.",
            createdAt: "2026-08-14T15:30:00.000Z",
            resolvedAt: "2026-08-14T16:10:00.000Z",
        },
        {
            id: "doubt_3",
            studentId: "student_3",
            teacherId: "teacher_2",
            classId: "class_10a",
            subject: "english",
            lectureId: null, // general doubt, not tied to a specific lecture
            text: "What's the difference between a simile and a metaphor?",
            status: "open",
            response: null,
            createdAt: "2026-08-15T18:00:00.000Z",
            resolvedAt: null,
        },
    ];
    for (const d of doubts) {
        await db.collection("doubts").doc(d.id).set(d);
    }

    console.log("✅ Seed complete: students, lectures, lectureProgress, attendance, quizzes, quizResponses, doubts");
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Seed failed:", err);
        process.exit(1);
    });