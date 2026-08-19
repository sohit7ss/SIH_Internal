import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function LiveKitPicker() {
    const router = useRouter();
    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: "#F5F5F5" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>LiveKit Test — Join as</Text>
            <Pressable
                onPress={() => router.push("/livekit-test?role=teacher")}
                style={{ backgroundColor: "#2563EB", padding: 16 }}
            >
                <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>Join as Teacher</Text>
            </Pressable>
            <Pressable
                onPress={() => router.push("/livekit-test?role=student")}
                style={{ borderColor: "#2563EB", borderWidth: 1, padding: 16 }}
            >
                <Text style={{ color: "#2563EB", textAlign: "center", fontWeight: "600" }}>Join as Student</Text>
            </Pressable>
        </View>
    );
}