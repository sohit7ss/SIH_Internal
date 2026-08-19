// app/auth/index.tsx
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, radius, typography } from "../../theme";


export default function AuthLanding() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.brandBlock}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.appName}>GyaanSaarthi</Text>
        <Text style={styles.tagline}>Guiding Knowledge. Connecting Futures.</Text>
      </View>

      <View style={styles.buttonBlock}>
        <Pressable
          onPress={() => router.push("/auth/login")}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>Log In</Text>
        </Pressable>

        <Text style={styles.dividerText}>New here?</Text>

        <Pressable
          onPress={() => router.push("/auth/signup-student")}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Sign Up as Student</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/auth/signup-teacher")}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Sign Up as Teacher</Text>
        </Pressable>
      </View>

      <Text style={styles.footerText}>Built for classrooms, on-site or remote</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
  },
  brandBlock: {
    alignItems: "center",
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.base,
  },
  logoText: {
    color: colors.cardWhite,
    fontSize: 24,
    fontWeight: typography.weightSemiBold,
    letterSpacing: 1,
  },
  appName: {
    fontSize: typography.size.title + 4,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.size.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  buttonBlock: {
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    paddingVertical: spacing.base,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    color: colors.cardWhite,
    fontSize: typography.size.body,
    fontWeight: typography.weightSemiBold,
  },
  dividerText: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: typography.size.small,
    marginBottom: spacing.xs,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.card,
    paddingVertical: spacing.base,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: typography.size.body,
    fontWeight: typography.weightSemiBold,
  },
  pressed: {
    opacity: 0.75,
  },
  footerText: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: typography.size.small,
  },
});