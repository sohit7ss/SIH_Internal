// lib/db.ts
// Local SQLite setup — mirrors the locked schema for offline-first storage.
// Tables: LectureProgress, QuizResponse, Attendance

import * as SQLite from "expo-sqlite";

const DB_NAME = "classroom.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbInstance;
}

export async function initDb(): Promise<void> {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS LectureProgress (
      studentId TEXT NOT NULL,
      lectureId TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
      watchDurationSec INTEGER NOT NULL DEFAULT 0,
      synced INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (studentId, lectureId)
    );

    CREATE TABLE IF NOT EXISTS Attendance (
      studentId TEXT NOT NULL,
      lectureId TEXT NOT NULL,
      connectedDurationSec INTEGER NOT NULL DEFAULT 0,
      requiredDurationSec INTEGER NOT NULL DEFAULT 0,
      present INTEGER NOT NULL DEFAULT 0,
      synced INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (studentId, lectureId)
    );

    CREATE TABLE IF NOT EXISTS QuizResponse (
      studentId TEXT NOT NULL,
      quizId TEXT NOT NULL,
      answers TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL CHECK (status IN ('in_progress', 'submitted')),
      score INTEGER,
      lastSavedAt TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (studentId, quizId)
    );
  `);

  // One-time migration for tables created before `synced` existed on your phone.
  // Safe to run every app boot — ALTER TABLE throws if the column already exists,
  // which we just catch and ignore.
  const migrations = [
    `ALTER TABLE LectureProgress ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE Attendance ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE QuizResponse ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
  ];
  for (const sql of migrations) {
    try {
      await db.execAsync(sql);
    } catch {
      // column already exists — expected on repeat runs, ignore
    }
  }

  console.log("[db] SQLite tables ready: LectureProgress, Attendance, QuizResponse");
}