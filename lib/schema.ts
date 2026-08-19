// lib/schema.ts
// Locked schema — single source of truth. All screens/components import types from here.

export type LectureStatus = "upcoming" | "live" | "completed";

export interface Lecture {
  id: string;
  subject: string;
  chapter: string;
  teacherId: string;
  classId: string;
  scheduledStart: string; // ISO timestamp
  scheduledEnd: string;   // ISO timestamp
  status: LectureStatus;
  recordingUrl: string | null;
  summaryPdfUrl: string | null;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  classId: string;
  subjects: string[];
}

export type LectureProgressStatus = "not_started" | "in_progress" | "completed";

export interface LectureProgress {
  studentId: string;
  lectureId: string;
  status: LectureProgressStatus;
  watchDurationSec: number;
}

export interface Attendance {
  studentId: string;
  lectureId: string;
  connectedDurationSec: number;
  requiredDurationSec: number;
  present: boolean; // connectedDurationSec >= 0.75 * requiredDurationSec
}

export interface Quiz {
  id: string;
  subject: string;
  chapter: string;
  questions: QuizQuestion[];
  dueDate: string; // ISO timestamp
}

// QuizQuestion — replace correctIndex with correctAnswer (string, matches an option exactly)
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

// QuizResponse — answers now maps questionId -> selected option TEXT, not index
export interface QuizResponse {
  studentId: string;
  quizId: string;
  answers: Record<string, string>;
  status: QuizResponseStatus;
  score: number | null;
  lastSavedAt: string;
}

// Doubt — renamed fields to match Section E's component
export interface Doubt {
  id: string;
  studentId: string;
  teacherId: string;
  classId: string;
  subject: string;
  lectureId: string | null;
  questionText: string;      // was: text
  status: DoubtStatus;
  replyText: string | null;  // was: response
  createdAt: string;
  respondedAt: string | null; // was: resolvedAt
}

export interface Student {
  id: string;
  authUid: string;        // ← added: links this doc to a Firebase Auth account
  name: string;
  email: string;
  classId: string;
  subjects: string[];
}

// New — coordinate this shape with Section B before they seed teacher accounts
export interface Teacher {
  id: string;
  authUid: string;
  name: string;
  email: string;
  classesTaught: string[]; // classId values
}