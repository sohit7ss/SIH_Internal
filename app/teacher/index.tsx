import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Lecture, Teacher, Attendance, QuizResponse, Quiz, Doubt, Student } from "../../lib/schema";
import { useAuthUser } from "../../lib/useAuthUser";
import { getWeakestTopicsForClass } from "../../lib/mocks/weakestTopics.mock";

export default function TeacherDashboard() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuthUser();
  const teacher = profile as Teacher | null;

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizResponses, setQuizResponses] = useState<QuizResponse[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!teacher) return;
    const currentTeacher = teacher;
    async function fetchAll() {
      const [lectureSnap, doubtSnap] = await Promise.all([
        getDocs(query(collection(db, "lectures"), where("teacherId", "==", currentTeacher.id))),
        getDocs(query(collection(db, "doubts"), where("teacherId", "==", currentTeacher.id))),
      ]);
      const teacherLectures = lectureSnap.docs.map((d) => d.data() as Lecture);
      setLectures(teacherLectures);
      setDoubts(doubtSnap.docs.map((d) => d.data() as Doubt));

      const classIds = Array.from(new Set(teacherLectures.map((l) => l.classId)));
      const lectureIds = teacherLectures.map((l) => l.id);

      const [studentSnap, attendanceSnap, quizSnap] = await Promise.all([
        classIds.length
          ? getDocs(query(collection(db, "students"), where("classId", "in", classIds.slice(0, 10))))
          : Promise.resolve({ docs: [] } as any),
        lectureIds.length
          ? getDocs(query(collection(db, "attendance"), where("lectureId", "in", lectureIds.slice(0, 10))))
          : Promise.resolve({ docs: [] } as any),
        getDocs(collection(db, "quizzes")),
      ]);
      setStudents(studentSnap.docs.map((d: any) => d.data() as Student));
      setAttendance(attendanceSnap.docs.map((d: any) => d.data() as Attendance));
      const subjectsTaught = new Set(teacherLectures.map((l) => l.subject));
      setQuizzes(quizSnap.docs.map((d) => d.data() as Quiz).filter((q) => subjectsTaught.has(q.subject)));

      const responseSnap = await getDocs(collection(db, "quizResponses"));
      setQuizResponses(responseSnap.docs.map((d) => d.data() as QuizResponse));

      setLoadingData(false);
    }
    fetchAll();
  }, [teacher]);

  async function handleReply(doubtId: string, replyText: string) {
    const respondedAt = new Date().toISOString();
    await updateDoc(doc(db, "doubts", doubtId), {
      replyText,
      status: "resolved",
      respondedAt,
    });
    setDoubts((prev) =>
      prev.map((d) => (d.id === doubtId ? { ...d, replyText, status: "resolved", respondedAt } : d))
    );
  }

  if (authLoading || loadingData) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  if (!teacher) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Could not load teacher profile.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F5F5", padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>Welcome, {teacher.name}</Text>

      <SectionLabel text="Your Lectures" />
      {lectures.length === 0 && <EmptyText text="No lectures scheduled" />}
      {lectures.map((l) => (
        <LectureRow key={l.id} lecture={l} onStartLecture={() => router.push(`/live-lecture/${l.id}?role=teacher` as any)} />
      ))}

      <SectionLabel text="Attendance Overview" />
      <View style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 16 }}>
        <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 6 }}>
          <Text style={{ flex: 1.4, fontSize: 12, color: "#666", fontWeight: "600" }}>Student</Text>
          <Text style={{ flex: 1, fontSize: 12, color: "#666", fontWeight: "600" }}>Overall</Text>
        </View>
        {students.map((s) => {
          const studentRecords = attendance.filter((a) => a.studentId === s.id);
          const present = studentRecords.filter((a) => a.present).length;
          const pct = studentRecords.length === 0 ? 0 : Math.round((present / studentRecords.length) * 100);
          return (
            <View key={s.id} style={{ flexDirection: "row", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#eee" }}>
              <Text style={{ flex: 1.4, fontSize: 13, fontWeight: "500" }}>{s.name}</Text>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: "700", color: pct < 75 ? "#EF4444" : "#22C55E" }}>
                {pct}%
              </Text>
            </View>
          );
        })}
      </View>

      <SectionLabel text="Quiz Results" />
      <View style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 16 }}>
        {quizzes.map((q) => {
          const responses = quizResponses.filter((r) => r.quizId === q.id && r.status === "submitted");
          const avg =
            responses.length === 0
              ? 0
              : Math.round(responses.reduce((sum, r) => sum + (r.score ?? 0), 0) / responses.length);
          return (
            <View key={q.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#eee" }}>
              <Text style={{ fontSize: 14, fontWeight: "500" }}>{q.subject} — {q.chapter}</Text>
              <Text style={{ fontSize: 13, color: "#666" }}>{avg}% avg · {responses.length} submitted</Text>
            </View>
          );
        })}
      </View>

      <SectionLabel text="Weakest Topics" />
      <View style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 16 }}>
        {getWeakestTopicsForClass("class_10a").length === 0 && <EmptyText text="No data yet" />}
        {getWeakestTopicsForClass("class_10a").map((t) => (
          <View key={t.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#eee" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "500" }}>{t.subject} — {t.chapter}</Text>
              <Text style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{t.strugglingStudentCount} students struggling</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#EF4444" }}>{t.avgScorePct}% avg</Text>
          </View>
        ))}
      </View>

      <SectionLabel text="Student Queries / Doubts" />
      <View style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 16 }}>
        {doubts.length === 0 && <EmptyText text="No doubts submitted yet" />}
        {doubts.map((d) => (
          <DoubtRow key={d.id} doubt={d} onReply={handleReply} />
        ))}
      </View>
    </ScrollView>
  );
}

function LectureRow({ lecture, onStartLecture }: { lecture: Lecture; onStartLecture: () => void }) {
  const showStart = lecture.status === "upcoming" || lecture.status === "live";
  return (
    <View
      style={{
        backgroundColor: "white",
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 8,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            {lecture.subject} — {lecture.chapter}
          </Text>
          <Text style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
            {new Date(lecture.scheduledStart).toLocaleString()}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: lecture.status === "live" ? "#EF4444" : "#F5F5F5",
            borderWidth: lecture.status === "live" ? 0 : 1,
            borderColor: "#eee",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: lecture.status === "live" ? "white" : "#666" }}>
            {lecture.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {showStart && (
        <Pressable
          onPress={onStartLecture}
          style={{
            backgroundColor: "#2563EB",
            borderRadius: 6,
            paddingVertical: 10,
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>
            {lecture.status === "live" ? "Join Live" : "Start Lecture"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function DoubtRow({ doubt, onReply }: { doubt: Doubt; onReply: (id: string, text: string) => Promise<void> }) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!replyText.trim()) return;
    setSending(true);
    await onReply(doubt.id, replyText.trim());
    setSending(false);
  }

  return (
    <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#eee" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Text style={{ fontSize: 13, color: "#666" }}>{doubt.subject}</Text>
        <View
          style={{
            marginLeft: "auto",
            backgroundColor: doubt.status === "open" ? "#FEF3C7" : "#DCFCE7",
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "600" }}>{doubt.status === "open" ? "Open" : "Resolved"}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 14, color: "#11181C", marginBottom: 8 }}>{doubt.questionText}</Text>

      {doubt.status === "resolved" && doubt.replyText && (
        <View style={{ backgroundColor: "#F5F5F5", borderRadius: 6, padding: 10 }}>
          <Text style={{ fontSize: 11, color: "#666", marginBottom: 2 }}>Your response</Text>
          <Text style={{ fontSize: 13, color: "#11181C" }}>{doubt.replyText}</Text>
        </View>
      )}

      {doubt.status === "open" && (
        <View style={{ gap: 8 }}>
          <TextInput
            placeholder="Type a response…"
            multiline
            value={replyText}
            onChangeText={setReplyText}
            style={{
              borderWidth: 1,
              borderColor: "#eee",
              borderRadius: 6,
              padding: 10,
              minHeight: 50,
              fontSize: 14,
              textAlignVertical: "top",
            }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!replyText.trim() || sending}
            style={{
              backgroundColor: replyText.trim() ? "#2563EB" : "#eee",
              borderRadius: 6,
              padding: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: replyText.trim() ? "white" : "#999", fontWeight: "600", fontSize: 13 }}>
              {sending ? "Sending…" : "Send response"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
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