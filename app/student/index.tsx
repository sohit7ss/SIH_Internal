import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Lecture, Student, LectureProgress, Attendance, Quiz, QuizResponse } from "../../lib/schema";
import { useAuthUser } from "../../lib/useAuthUser";
import NetInfo from "@react-native-community/netinfo";

// Rebuilt against the real schema (lib/schema.ts) and Firestore, matching
// this repo's existing fetch/render pattern (see original file). Subject
// tiles use a horizontal ScrollView with FIXED tile width (not flex:1
// dividing row width by subject count) — this is what caused the earlier
// tile-squeeze/text-wrap bug reported by the team; fixed from the start
// here rather than patched after the fact.
//
// ASSUMPTION (schema has no join table for these — flag if wrong):
// - lectureProgress collection, doc fields match LectureProgress, queried
//   by studentId
// - attendance collection, doc fields match Attendance, queried by studentId
// - quizzes collection has no classId/teacherId field in the locked schema,
//   so quizzes are filtered client-side by `subjects.includes(quiz.subject)`
// - quizResponses collection, doc fields match QuizResponse, queried by studentId

const TILE_WIDTH = 120;

export default function StudentDashboard() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuthUser();
  const student = profile as Student | null;

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [progress, setProgress] = useState<LectureProgress[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizResponses, setQuizResponses] = useState<QuizResponse[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  type NetworkStatus = "online" | "limited" | "offline";

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>("online");

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected || state.isInternetReachable === false) {
        setNetworkStatus("offline");
        return;
      }

      // Cellular gives a real generation signal — 2g/3g counts as limited
      if (state.type === "cellular") {
        const generation = (state.details as any)?.cellularGeneration;
        if (generation === "2g" || generation === "3g") {
          setNetworkStatus("limited");
          return;
        }
      }

      setNetworkStatus("online");
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => setIsOffline(!state.isConnected));
    return () => unsub();
  }, []);
  useEffect(() => {
    if (!student) return;
    const currentStudent = student; // capture for TS narrowing inside async closure
    async function fetchAll() {
      const [lectureSnap, progressSnap, attendanceSnap, quizSnap, responseSnap] = await Promise.all([
        getDocs(query(collection(db, "lectures"), where("classId", "==", currentStudent.classId))),
        getDocs(query(collection(db, "lectureProgress"), where("studentId", "==", currentStudent.id))),
        getDocs(query(collection(db, "attendance"), where("studentId", "==", currentStudent.id))),
        getDocs(collection(db, "quizzes")),
        getDocs(query(collection(db, "quizResponses"), where("studentId", "==", currentStudent.id))),
      ]);

      setLectures(lectureSnap.docs.map((d) => d.data() as Lecture));
      setProgress(progressSnap.docs.map((d) => d.data() as LectureProgress));
      setAttendance(attendanceSnap.docs.map((d) => d.data() as Attendance));
      setQuizzes(
        quizSnap.docs
          .map((d) => d.data() as Quiz)
          .filter((q) => currentStudent.subjects.includes(q.subject))
      );
      setQuizResponses(responseSnap.docs.map((d) => d.data() as QuizResponse));
      setLoadingData(false);
    }
    fetchAll();
  }, [student]);

  if (authLoading || loadingData) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Could not load student profile.</Text>
      </View>
    );
  }

  const upcomingAndLive = lectures.filter((l) => l.status === "upcoming" || l.status === "live");
  const chaptersPerSubject = subjectChapterCounts(lectures, progress, student.subjects);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F5F5", padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>
        Hi, {student.name}
      </Text>
      {networkStatus !== "online" && (
        <View
          style={{
            backgroundColor: networkStatus === "offline" ? "#FEE2E2" : "#FEF3C7",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: networkStatus === "offline" ? "#991B1B" : "#92400E",
            }}
          >
            {networkStatus === "offline"
              ? "⚠ Offline — changes will sync when reconnected"
              : "⚠ Slow connection — some features may be delayed"}
          </Text>
        </View>
      )}

      <SectionLabel text="Subjects" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}
      >
        {student.subjects.map((subject) => {
          const counts = chaptersPerSubject[subject] ?? { total: 0, completed: 0 };
          return (
            <Pressable
              key={subject}
              onPress={() => router.push(`/student/subject/${encodeURIComponent(subject)}` as any)} // TODO(Section A): remove `as any` once typed-routes regenerate for this file
              style={{
                width: TILE_WIDTH,
                minHeight: 70,
                backgroundColor: "white",
                borderWidth: 1,
                borderColor: "#eee",
                borderRadius: 8,
                padding: 12,
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600" }} numberOfLines={2} ellipsizeMode="tail">
                {subject}
              </Text>
              <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                {counts.completed}/{counts.total} chapters
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <SectionLabel text="Upcoming / Live Lectures" />
      {upcomingAndLive.length === 0 && <EmptyText text="No upcoming lectures" />}
      {upcomingAndLive.map((l) => (
        <LectureCard
          key={l.id}
          lecture={l}
          onPress={() => router.push(`/live-lecture/${l.id}?role=student` as any)} // TODO(Section A): Lecture Player route not built yet — pending LiveKit sync call
          badgeColor={l.status === "live" ? "#2563EB" : undefined}
          badgeText={l.status === "live" ? "LIVE" : undefined}
        />
      ))}

      <SectionLabel text="Attendance Summary" />
      <View style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 16 }}>
        {student.subjects.map((subject) => {
          const { present, total } = attendanceForSubject(attendance, lectures, subject);
          const pct = total === 0 ? 0 : Math.round((present / total) * 100);
          return (
            <View
              key={subject}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 8,
                borderTopWidth: 1,
                borderTopColor: "#eee",
              }}
            >
              <Text style={{ fontSize: 14 }}>{subject}</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: pct < 75 ? "#EF4444" : "#22C55E" }}>
                {present}/{total} ({pct}%)
              </Text>
            </View>
          );
        })}
      </View>

      <SectionLabel text="Quizzes & Due Dates" />
      {quizzes.length === 0 && <EmptyText text="No quizzes assigned" />}
      {quizzes.map((q) => {
        const resp = quizResponses.find((r) => r.quizId === q.id);
        return (
          <Pressable
            key={q.id}
            onPress={() => router.push(`/quiz/${q.id}` as any)} // TODO(Section A): wire to actual quiz route once created
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "white",
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "#eee",
              borderRadius: 8,
            }}
          >
            <View>
              <Text style={{ fontSize: 16, fontWeight: "600" }}>
                {q.subject} — {q.chapter}
              </Text>
              <Text style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                Due {new Date(q.dueDate).toLocaleDateString()}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: "#666" }}>{resp?.status ?? "not started"}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function subjectChapterCounts(
  lectures: Lecture[],
  progress: LectureProgress[],
  subjects: string[]
): Record<string, { total: number; completed: number }> {
  const result: Record<string, { total: number; completed: number }> = {};
  for (const subject of subjects) {
    const subjectLectures = lectures.filter((l) => l.subject === subject);
    const completed = subjectLectures.filter((l) =>
      progress.some((p) => p.lectureId === l.id && p.status === "completed")
    ).length;
    result[subject] = { total: subjectLectures.length, completed };
  }
  return result;
}

function attendanceForSubject(attendance: Attendance[], lectures: Lecture[], subject: string) {
  const subjectLectureIds = new Set(lectures.filter((l) => l.subject === subject).map((l) => l.id));
  const relevant = attendance.filter((a) => subjectLectureIds.has(a.lectureId));
  const present = relevant.filter((a) => a.present).length;
  return { present, total: relevant.length };
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text style={{ fontSize: 14, fontWeight: "600", marginTop: 20, marginBottom: 8, color: "#555" }}>
      {text}
    </Text>
  );
}

function EmptyText({ text }: { text: string }) {
  return <Text style={{ color: "#999", fontSize: 13 }}>{text}</Text>;
}

function LectureCard({
  lecture,
  badgeColor,
  badgeText,
  onPress,
}: {
  lecture: Lecture;
  badgeColor?: string;
  badgeText?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: "white", padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#eee", borderRadius: 8 }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 16, fontWeight: "600" }}>{lecture.chapter}</Text>
        {badgeText && (
          <View style={{ backgroundColor: badgeColor, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>{badgeText}</Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{lecture.subject}</Text>
      <Text style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
        {new Date(lecture.scheduledStart).toLocaleString()}
      </Text>
    </Pressable>
  );
}

