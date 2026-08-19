// lib/useAuthUser.ts
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { Student, Teacher } from "./schema";

export function useAuthUser() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Student | Teacher | null>(null);
    const [role, setRole] = useState<"student" | "teacher" | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (!firebaseUser) {
                setProfile(null);
                setRole(null);
                setLoading(false);
                return;
            }
            const studentSnap = await getDoc(doc(db, "students", firebaseUser.uid));
            if (studentSnap.exists()) {
                setProfile(studentSnap.data() as Student);
                setRole("student");
            } else {
                const teacherSnap = await getDoc(doc(db, "teachers", firebaseUser.uid));
                if (teacherSnap.exists()) {
                    setProfile(teacherSnap.data() as Teacher);
                    setRole("teacher");
                }
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    return { user, profile, role, loading };
}