import { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Quiz, QuizResponse } from "../../lib/schema";
import { useAuthUser } from "../../lib/useAuthUser";
import QuizScreen from "../../components/QuizScreen";
import NetInfo from "@react-native-community/netinfo";

export default function QuizContainer() {
    const { quizId } = useLocalSearchParams<{ quizId: string }>();
    const router = useRouter();
    const { profile } = useAuthUser();
    const studentId = profile?.authUid;

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [response, setResponse] = useState<QuizResponse | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = NetInfo.addEventListener((state) => setIsOffline(!state.isConnected));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!studentId || !quizId) return;
        async function load() {
            const quizSnap = await getDoc(doc(db, "quizzes", quizId));
            if (!quizSnap.exists()) { setLoading(false); return; }
            setQuiz(quizSnap.data() as Quiz);

            const respRef = doc(db, "quizResponses", `${studentId}_${quizId}`);
            const respSnap = await getDoc(respRef);
            if (respSnap.exists()) {
                setResponse(respSnap.data() as QuizResponse);
            } else {
                const fresh: QuizResponse = {
                    studentId: studentId!,
                    quizId,
                    answers: {},
                    status: "in_progress",
                    score: null,
                    lastSavedAt: new Date().toISOString(),
                };
                await setDoc(respRef, fresh);
                setResponse(fresh);
            }
            setLoading(false);
        }
        load();
    }, [studentId, quizId]);

    const handleAnswerChange = useCallback((questionId: string, option: string) => {
        setResponse((prev) => prev ? { ...prev, answers: { ...prev.answers, [questionId]: option } } : prev);
    }, []);

    const handleAutosave = useCallback(async () => {
        if (!response || !studentId) return;
        const now = new Date().toISOString();
        const respRef = doc(db, "quizResponses", `${studentId}_${quizId}`);
        try {
            await updateDoc(respRef, { answers: response.answers, lastSavedAt: now });
            setResponse((prev) => prev ? { ...prev, lastSavedAt: now } : prev);
        } catch (err) {
            // Firestore write fails while offline — that's expected here, not an error to surface
            console.log("Autosave will retry when back online:", err);
        }
    }, [response, studentId, quizId]);

    const handleSubmit = useCallback(async () => {
        if (!response || !studentId || !quiz) return;
        let correct = 0;
        quiz.questions.forEach((q) => {
            if (response.answers[q.id] === q.correctAnswer) correct++;
        });
        const score = Math.round((correct / quiz.questions.length) * 100);
        const now = new Date().toISOString();
        const respRef = doc(db, "quizResponses", `${studentId}_${quizId}`);
        await updateDoc(respRef, { status: "submitted", score, lastSavedAt: now });
        router.back();
    }, [response, studentId, quiz, quizId]);

    if (loading || !quiz || !response) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator color="#2563EB" />
            </View>
        );
    }

    return (
        <QuizScreen
            quiz={quiz}
            response={response}
            isOffline={isOffline}
            onAnswerChange={handleAnswerChange}
            onAutosave={handleAutosave}
            onSubmit={handleSubmit}
        />
    );
}