/**
 * weakestTopics.mock.ts
 *
 * TEMPORARY mock data for the Teacher Dashboard's "Weakest Topics" section,
 * used until Section F confirms and seeds the real `weakestTopics` Firestore
 * collection. Values below use REAL subject/chapter/classId strings that
 * exist in the app's actual Firestore data (matches lectures.json/quizzes.json).
 *
 * TODO: swap for a live Firestore query once Section F confirms the real
 * write path — collection("weakestTopics").where("classId", "==", ...).
 * The WeakestTopic shape itself should not need to change.
 */

export interface WeakestTopic {
    id: string; // e.g. "SUB01_L003" or similar unique key
    subject: string; // full subject name — must match `subject` on Lecture/Quiz docs exactly
    chapter: string; // must match `chapter` on Lecture/Quiz docs exactly
    classId: string; // e.g. "class_10a"
    avgScorePct: number; // average quiz score % for this chapter across the class
    strugglingStudentCount: number; // students below the struggle threshold (<60%)
    aiQuestionsAskedCount: number; // optional signal — how often students asked AI for help
}

export const MOCK_WEAKEST_TOPICS: WeakestTopic[] = [
    {
        id: "Data_Structures_and_Algorithms_Trees",
        subject: "Data Structures and Algorithms",
        chapter: "Trees",
        classId: "class_10a",
        avgScorePct: 42,
        strugglingStudentCount: 7,
        aiQuestionsAskedCount: 22,
    },
    {
        id: "Computer_Networks_Routing",
        subject: "Computer Networks",
        chapter: "Routing",
        classId: "class_10a",
        avgScorePct: 47,
        strugglingStudentCount: 6,
        aiQuestionsAskedCount: 18,
    },
    {
        id: "Artificial_Intelligence_and_Machine_Learning_Neural_Networks",
        subject: "Artificial Intelligence and Machine Learning",
        chapter: "Neural Networks",
        classId: "class_10a",
        avgScorePct: 39,
        strugglingStudentCount: 9,
        aiQuestionsAskedCount: 31,
    },
    {
        id: "Database_Management_Systems_Transactions",
        subject: "Database Management Systems",
        chapter: "Transactions",
        classId: "class_10a",
        avgScorePct: 54,
        strugglingStudentCount: 4,
        aiQuestionsAskedCount: 11,
    },
    {
        id: "Probability_and_Statistics_Probability_Distributions",
        subject: "Probability and Statistics",
        chapter: "Probability Distributions",
        classId: "class_10a",
        avgScorePct: 58,
        strugglingStudentCount: 3,
        aiQuestionsAskedCount: 7,
    },
];

/** Helper matching how Section E said they'll query in real Firestore. */
export function getWeakestTopicsForClass(
    classId: string,
    sortBy: "avgScorePct" | "strugglingStudentCount" = "avgScorePct"
): WeakestTopic[] {
    const filtered = MOCK_WEAKEST_TOPICS.filter((t) => t.classId === classId);
    return sortBy === "avgScorePct"
        ? filtered.sort((a, b) => a.avgScorePct - b.avgScorePct) // ascending: weakest first
        : filtered.sort((a, b) => b.strugglingStudentCount - a.strugglingStudentCount); // descending
}