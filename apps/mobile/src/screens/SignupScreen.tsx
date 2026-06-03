import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { UserPlus } from "lucide-react-native";
import { signUp } from "../services/authService";
import { supabase } from "../services/supabase";
import { Screen, Txt, Eyebrow, Button, Field } from "../components";
import { spacing, type } from "../theme";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  onSignedUp: () => void;
  onBackToLogin: () => void;
};

export function SignupScreen({ onSignedUp, onBackToLogin }: Props) {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!fullName || !username) {
      setError("Name and username are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (existing) {
        setError("This username is already taken");
        setLoading(false);
        return;
      }
      await signUp(email, password, { full_name: fullName, username, role: "operator" });
      onSignedUp();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setLoading(true);
    setError(null);
    try {
      const guestId = `guest_${Math.floor(Math.random() * 100000)}`;
      await signUp(`${guestId}@guest.iuu`, "GuestPassword123!", {
        full_name: "Anonymous Guest",
        username: guestId,
        role: "guest",
      });
      onSignedUp();
    } catch (err) {
      setError("Guest error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={{ flexGrow: 1, justifyContent: "center", gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <UserPlus color={colors.accent} size={26} />
          <Txt variant="displayLg">Register</Txt>
        </View>
        <Txt variant="body" color={colors.inkMuted}>Enrol a new patrol officer device.</Txt>
      </View>

      <View style={{ gap: spacing.md }}>
        <Field label="Full name" placeholder="Jane Officer" value={fullName} onChangeText={setFullName} textContentType="name" />
        <Field label="Username" placeholder="j.officer" value={username} onChangeText={setUsername} autoCapitalize="none" textContentType="username" />
        <Field label="Email" placeholder="you@agency.go" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" autoComplete="email" />
        <Field label="Password" placeholder="Create a strong password" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" autoComplete="password-new" />
        {error ? <Text style={[type.bodySm, { color: colors.danger }]}>{error}</Text> : null}

        <Button label="Create account" onPress={handleSignUp} loading={loading} full />
        <Button label="Continue as guest" onPress={handleGuestAccess} variant="secondary" disabled={loading} full />

        <Pressable onPress={onBackToLogin} style={{ alignItems: "center", paddingVertical: spacing.sm }}>
          <Eyebrow color={colors.inkMuted}>Already enrolled? Sign in</Eyebrow>
        </Pressable>
      </View>
    </Screen>
  );
}
