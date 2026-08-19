import { useRouter } from "expo-router";
import LoginScreen from "../../components/LoginScreen";
import { loginAndGetRole, sendOtp, verifyOtp, resetPasswordWithOtp } from "../../lib/auth";

export default function LoginContainer() {
    const router = useRouter();

    return (
        <LoginScreen
            onLogin={async (email, password) => {
                try {
                    const { role } = await loginAndGetRole(email, password);
                    router.replace(role === "student" ? "/student" : "/teacher");
                    return true;
                } catch {
                    return false;
                }
            }}
            onSendOtp={sendOtp}
            onVerifyOtp={verifyOtp}
            onResetPassword={resetPasswordWithOtp}
            onLoginSuccess={() => { }}
        />
    );
}