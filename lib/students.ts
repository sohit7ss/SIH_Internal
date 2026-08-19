// lib/students.ts
import { collection, getDocs, query, where, documentId } from "firebase/firestore";
import { db } from "./firebase";

export async function getStudentNamesByIds(ids: string[]): Promise<Record<string, string>> {
    if (ids.length === 0) return {};
    const uniqueIds = [...new Set(ids)];
    const result: Record<string, string> = {};
    // Firestore 'in' queries cap at 30 IDs — chunk if needed
    for (let i = 0; i < uniqueIds.length; i += 30) {
        const chunk = uniqueIds.slice(i, i + 30);
        const q = query(collection(db, "students"), where(documentId(), "in", chunk));
        const snap = await getDocs(q);
        snap.docs.forEach((d) => { result[d.id] = d.data().name; });
    }
    return result;
}