// lib/auth.ts
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";
import { Student, Teacher } from "./schema";

export async function signUpTeacher(
    email: string,
    password: string,
    name: string
): Promise<Teacher> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const teacher: Teacher = {
        id: cred.user.uid,
        authUid: cred.user.uid,
        name,
        email,
        classesTaught: [],
    };
    await setDoc(doc(db, "teachers", cred.user.uid), teacher);
    return teacher;
}

/** Logs in, then figures out if this account is a student or teacher. */
export async function loginAndGetRole(
    email: string,
    password: string
): Promise<{ role: "student" | "teacher"; data: Student | Teacher }> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    const studentSnap = await getDoc(doc(db, "students", uid));
    if (studentSnap.exists()) {
        return { role: "student", data: studentSnap.data() as Student };
    }

    const teacherSnap = await getDoc(doc(db, "teachers", uid));
    if (teacherSnap.exists()) {
        return { role: "teacher", data: teacherSnap.data() as Teacher };
    }

    throw new Error("No student or teacher record found for this account.");
}

export async function logout() {
    await signOut(auth);
}

// add to lib/auth.ts
const API_BASE = "http://<their-lan-ip>:8000"; // same server as the LiveKit token endpoint

export async function sendOtp(email: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    return res.ok;
}

let cachedVerifyToken: string | null = null;

export async function verifyOtp(email: string, otp: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    cachedVerifyToken = data.verifyToken;
    return true;
}

export async function resetPasswordWithOtp(email: string, newPassword: string): Promise<boolean> {
    if (!cachedVerifyToken) return false;
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword, verifyToken: cachedVerifyToken }),
    });
    cachedVerifyToken = null;
    return res.ok;
}

export async function signUpStudent(
    email: string,
    password: string,
    name: string,
    classId: string
): Promise<Student> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const student: Student = {
        id: cred.user.uid,
        authUid: cred.user.uid,
        name,
        email,
        classId,
        subjects: [
            "Data Structures and Algorithms",
            "Object Oriented Programming",
            "Database Management Systems",
            "Computer Networks",
            "Artificial Intelligence and Machine Learning",
            "Probability and Statistics",
        ], // default: enrolled in all demo subjects — adjust if real subject selection is added later
    };
    await setDoc(doc(db, "students", cred.user.uid), student);
    return student;
}