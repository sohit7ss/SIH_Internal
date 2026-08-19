import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { signUpTeacher } from "../../lib/auth";

export default function SignupTeacher() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSignup() {
        setLoading(true);
        try {
            await signUpTeacher(email, password, name);
            router.replace("/teacher");
        } catch (err: any) {
            Alert.alert("Signup failed", err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12, backgroundColor: "#F5F5F5" }}>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 8 }}>Teacher Sign Up</Text>
            <TextInput placeholder="Full name" value={name} onChangeText={setName} style={inputStyle} />
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={inputStyle} />
            <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={inputStyle} />
            <Pressable onPress={handleSignup} disabled={loading} style={{ backgroundColor: "#2563EB", padding: 16, marginTop: 8 }}>
                <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
                    {loading ? "Signing up..." : "Sign Up"}
                </Text>
            </Pressable>
        </View>
    );
}

const inputStyle = {
    backgroundColor: "black",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    color : "white"
};