import { useEffect, useRef, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant } from "livekit-client";
import { VideoView } from "@livekit/react-native";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuthUser } from "../../lib/useAuthUser";
import { LectureProgress, Student } from "../../lib/schema";

const LIVEKIT_URL = "wss://classroom-app-yiz1eoxq.livekit.cloud";
const TOKEN_SERVER = "http://192.168.137.8:8000"; // your Section C teammate's FastAPI server

async function fetchToken(room: string, identity: string): Promise<string> {
    const res = await fetch(`${TOKEN_SERVER}/livekit/token?room=${room}&identity=${identity}`);
    const data = await res.json();
    return data.token;
}

export default function LiveLectureScreen() {
    const { lectureId, role } = useLocalSearchParams<{ lectureId: string; role?: string }>();
    const [status, setStatus] = useState("connecting...");
    const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null);
    const [remoteIdentity, setRemoteIdentity] = useState<string | null>(null);
    const roomRef = useRef<Room | null>(null);
    const { profile } = useAuthUser();
    const student = profile as Student | null;
    const watchedSecondsRef = useRef(0);
    const lectureDurationSecRef = useRef<number | null>(null);
    const watchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (role !== "student" || !student || !lectureId) return;

        async function setupProgressTracking() {
            // Get lecture's total duration to decide the "completed" threshold later
            const lectureSnap = await getDoc(doc(db, "lectures", lectureId));
            if (lectureSnap.exists()) {
                const lec = lectureSnap.data();
                const durationMs = new Date(lec.scheduledEnd).getTime() - new Date(lec.scheduledStart).getTime();
                lectureDurationSecRef.current = Math.max(durationMs / 1000, 60); // avoid divide-by-zero on bad data
            }

            // Mark as in_progress the moment they join
            await writeProgress("in_progress");

            // Tick every 10s while connected, tracking real watch time
            watchIntervalRef.current = setInterval(() => {
                watchedSecondsRef.current += 10;
                writeProgress("in_progress");
            }, 10_000);
        }

        async function writeProgress(status: "in_progress" | "completed") {
            if (!student) return;
            const progressDoc: LectureProgress = {
                studentId: student.authUid,
                lectureId,
                status,
                watchDurationSec: watchedSecondsRef.current,
            };
            await setDoc(doc(db, "lectureProgress", `${student.authUid}_${lectureId}`), progressDoc, { merge: true });
        }

        setupProgressTracking();

        // On leaving the screen (disconnect), decide if it counts as "completed"
        return () => {
            if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
            const totalDuration = lectureDurationSecRef.current ?? 0;
            const watchedEnough = totalDuration > 0 && watchedSecondsRef.current >= totalDuration * 0.75;
            writeProgress(watchedEnough ? "completed" : "in_progress");
        };
    }, [role, student, lectureId]);

    useEffect(() => {
        if (!lectureId) return;

        let cancelled = false;

        async function connect() {
            const identity = role === "teacher" ? "teacher1" : "student1"; // swap for real user id once auth is wired through here
            const token = await fetchToken(lectureId, identity);
            if (cancelled) return;

            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
                videoCaptureDefaults: {
                    resolution: { width: 640, height: 360, frameRate: 24 },
                },
                publishDefaults: {
                    videoSimulcastLayers: [
                        { width: 640, height: 360, encoding: { maxBitrate: 500_000, maxFramerate: 24 } },
                    ],
                },
            });
            roomRef.current = room;

            room.on(RoomEvent.Connected, async () => {
                setStatus("✅ connected — publishing camera...");
                await room.localParticipant.setCameraEnabled(true);
                await room.localParticipant.setMicrophoneEnabled(true);
            });

            room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
                console.log("Quality changed:", participant.identity, quality);
            });

            room.on(RoomEvent.LocalTrackPublished, (publication) => {
                if (publication.kind === Track.Kind.Video && publication.videoTrack) {
                    setLocalVideoTrack(publication.videoTrack);
                    setStatus("✅ camera publishing");
                }
            });

            room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication, participant: RemoteParticipant) => {
                if (track.kind === Track.Kind.Video) {
                    setRemoteVideoTrack(track);
                    setRemoteIdentity(participant.identity);
                    setStatus(`✅ receiving video from ${participant.identity}`);
                }
            });

            room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
                if (track.kind === Track.Kind.Video) {
                    setRemoteVideoTrack(null);
                    setRemoteIdentity(null);
                }
            });

            room.on(RoomEvent.Disconnected, (reason) => setStatus("❌ disconnected: " + reason));

            room.connect(LIVEKIT_URL, token).catch((err) => {
                setStatus("❌ error: " + err.message);
            });
        }

        connect();

        return () => {
            cancelled = true;
            roomRef.current?.disconnect();
        };
    }, [lectureId, role]);

    async function setQualityTier(tier: "720p" | "480p" | "360p" | "audio-only") {
        const room = roomRef.current;
        if (!room) return;
        if (tier === "audio-only") {
            await room.localParticipant.setCameraEnabled(false);
            setLocalVideoTrack(null);
            return;
        }
        const resolutions = {
            "720p": { width: 1280, height: 720 },
            "480p": { width: 854, height: 480 },
            "360p": { width: 640, height: 360 },
        };
        await room.localParticipant.setCameraEnabled(true, { resolution: resolutions[tier] });
    }

    return (
        <View style={styles.container}>
            <Text style={styles.status}>{status} — room: {lectureId}</Text>

            <View style={styles.remoteContainer}>
                {remoteVideoTrack ? (
                    <VideoView style={StyleSheet.absoluteFill} videoTrack={remoteVideoTrack} objectFit="cover" />
                ) : (
                    <Text style={styles.waitingText}>Waiting for remote participant's video...</Text>
                )}
                {remoteIdentity && <Text style={styles.remoteLabel}>{remoteIdentity}</Text>}
            </View>

            <View style={styles.localBox}>
                {localVideoTrack ? (
                    <VideoView style={StyleSheet.absoluteFill} videoTrack={localVideoTrack} objectFit="cover" mirror />
                ) : (
                    <Text style={styles.localOffText}>Camera off</Text>
                )}
            </View>

            <View style={styles.buttonRow}>
                <Button title="720p" onPress={() => setQualityTier("720p")} />
                <Button title="480p" onPress={() => setQualityTier("480p")} />
                <Button title="360p" onPress={() => setQualityTier("360p")} />
                <Button title="Audio Only" onPress={() => setQualityTier("audio-only")} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "black" },
    status: { color: "white", padding: 10, fontSize: 11 },
    remoteContainer: { flex: 1, backgroundColor: "#111", justifyContent: "center", alignItems: "center" },
    waitingText: { color: "#888" },
    remoteLabel: { position: "absolute", bottom: 12, left: 12, color: "white", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 8, paddingVertical: 4 },
    localBox: { position: "absolute", top: 40, right: 12, width: 100, height: 140, backgroundColor: "#222", borderWidth: 1, borderColor: "#2563EB", overflow: "hidden" },
    localOffText: { color: "#666", fontSize: 10, textAlign: "center", marginTop: 60 },
    buttonRow: { flexDirection: "row", justifyContent: "space-around", padding: 12, backgroundColor: "#111", flexWrap: "wrap" },
});