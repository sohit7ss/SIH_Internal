import { registerGlobals } from "@livekit/react-native";
registerGlobals();

import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { initDb } from "../lib/db";

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDb().then(() => setDbReady(true));
  }, []);

  if (!dbReady) return null; // or a loading spinner

  return (
    
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth/index" />
      <Stack.Screen name="student/index" />
      <Stack.Screen name="teacher/index" />
    </Stack>
  );
}