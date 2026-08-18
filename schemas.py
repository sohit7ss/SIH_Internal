# schemas.py
from pydantic import BaseModel
from typing import Literal, Optional


class Lecture(BaseModel):
    id: str
    subject: str
    chapter: str
    teacherId: str
    classId: str
    scheduledStart: str  # ISO timestamp
    scheduledEnd: str    # ISO timestamp
    status: Literal["upcoming", "live", "completed"]
    recordingUrl: Optional[str] = None
    summaryPdfUrl: Optional[str] = None


class Student(BaseModel):
    id: str
    name: str
    email: str
    classId: str
    subjects: list[str]


class LectureProgress(BaseModel):
    studentId: str
    lectureId: str
    status: Literal["not_started", "in_progress", "completed"]
    watchDurationSec: int


class Attendance(BaseModel):
    studentId: str
    lectureId: str
    connectedDurationSec: int
    requiredDurationSec: int
    present: bool  # server computes this — see services/attendance.py


class Quiz(BaseModel):
    id: str
    subject: str
    chapter: str
    questions: list[dict]  # keeping loose for now — tighten if question shape gets locked
    dueDate: str  # ISO timestamp


class QuizResponse(BaseModel):
    studentId: str
    quizId: str
    answers: dict[str, str]  # option text values, not indices — per Section A's Day-2 change
    status: Literal["in_progress", "submitted"]
    score: Optional[float] = None
    lastSavedAt: str  # ISO timestamp


class Doubt(BaseModel):
    id: str
    studentId: str
    teacherId: str
    classId: str
    subject: str
    lectureId: Optional[str] = None
    questionText: str
    status: Literal["open", "resolved"]
    replyText: Optional[str] = None
    createdAt: str        # ISO timestamp
    respondedAt: Optional[str] = None



class SyncRecord(BaseModel):
    record_type: Literal["quizResponse", "attendance", "lectureProgress"]
    record_id: str  # e.g. f"{studentId}_{lectureId}" — app decides the composite key
    data: dict


class SyncBatch(BaseModel):
    records: list[SyncRecord]