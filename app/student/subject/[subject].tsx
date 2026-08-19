import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { Lecture, LectureProgress, Student } from "../../../lib/schema";
import { useAuthUser } from "../../../lib/useAuthUser";

// Fills the gap flagged by Section A: tapping a subject tile previously
// went nowhere. Route: /student/subject/[subject] — subject name comes
// through the URL param (encoded on the dashboard side).

export default function SubjectDetail() {
  const { subject } = useLocalSearchParams<{ subject: string }>();
  const router = useRouter();
  const { profile } = useAuthUser();
  const student = profile as Student | null;

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [progress, setProgress] = useState<LectureProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student || !subject) return;
    const currentStudent = student; // capture for TS narrowing inside async closure
    async function fetchData() {
      const [lectureSnap, progressSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, "lectures"),
            where("classId", "==", currentStudent.classId),
            where("subject", "==", subject)
          )
        ),
        getDocs(query(collection(db, "lectureProgress"), where("studentId", "==", currentStudent.id))),
      ]);
      setLectures(lectureSnap.docs.map((d) => d.data() as Lecture));
      setProgress(progressSnap.docs.map((d) => d.data() as LectureProgress));
      setLoading(false);
    }
    fetchData();
  }, [student, subject]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  const completedCount = lectures.filter((l) =>
    progress.some((p) => p.lectureId === l.id && p.status === "completed")
  ).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F5F5", padding: 16 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: "#2563EB", fontSize: 14, marginBottom: 12 }}>‹ Back</Text>
      </Pressable>

      <Text style={{ fontSize: 20, fontWeight: "700" }}>{subject}</Text>
      <Text style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
        {completedCount}/{lectures.length} chapters completed
      </Text>

      <View style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 16 }}>
        {lectures.map((lec) => {
          const p = progress.find((pr) => pr.lectureId === lec.id);
          const status = p?.status ?? "not_started";
          const statusColors: Record<string, { bg: string; text: string }> = {
            completed: { bg: "#DCFCE7", text: "Completed" },
            in_progress: { bg: "#FEF3C7", text: "In Progress" },
            not_started: { bg: "#F5F5F5", text: "Not Started" },
          };
          const s = statusColors[status];

          return (
            <View
              key={lec.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: "#eee",
                gap: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600" }}>{lec.chapter}</Text>
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: s.bg,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "600" }}>{s.text}</Text>
                </View>
              </View>
              <View style={{ gap: 4 }}>
                <Pressable
                  disabled={!lec.recordingUrl}
                  onPress={() => lec.recordingUrl && Linking.openURL(lec.recordingUrl)}
                  style={{
                    borderWidth: 1,
                    borderColor: lec.recordingUrl ? "#2563EB" : "#eee",
                    borderRadius: 6,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                  }}
                >
                  <Text style={{ fontSize: 11, color: lec.recordingUrl ? "#2563EB" : "#999" }}>Recording</Text>
                </Pressable>
                <Pressable
                  disabled={!lec.summaryPdfUrl}
                  onPress={() => lec.summaryPdfUrl && Linking.openURL(lec.summaryPdfUrl)}
                  style={{
                    borderWidth: 1,
                    borderColor: lec.summaryPdfUrl ? "#2563EB" : "#eee",
                    borderRadius: 6,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                  }}
                >
                  <Text style={{ fontSize: 11, color: lec.summaryPdfUrl ? "#2563EB" : "#999" }}>PDF</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
