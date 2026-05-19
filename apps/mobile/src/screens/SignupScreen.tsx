import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { signUp } from "../services/authService";
import { supabase } from "../services/supabase";

type Props = {
  onSignedUp: () => void;
  onBackToLogin: () => void;
};

export function SignupScreen({ onSignedUp, onBackToLogin }: Props) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!fullName || !username) {
      setError("Name and Username are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Check username uniqueness
      const { data: existing } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
      if (existing) {
        setError("This username is already taken");
        setLoading(false);
        return;
      }

      await signUp(email, password, {
        full_name: fullName,
        username: username,
        role: "operator"
      });
      onSignedUp();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setLoading(true);
    try {
      const guestId = `guest_${Math.floor(Math.random() * 10000)}`;
      await signUp(`${guestId}@guest.iuu`, "GuestPassword123!", {
        full_name: "Anonymous Guest",
        username: "Guest",
        role: "guest"
      });
      onSignedUp();
    } catch (err) {
      setError("Guest error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inner, { width: isLargeScreen ? 400 : "100%" }]}>
        <Text style={[styles.title, isLargeScreen && { textAlign: "center", fontSize: 32, marginBottom: 12 }]}>
          Officer Registration
        </Text>
        <TextInput placeholder="Full Name" style={styles.input} value={fullName} onChangeText={setFullName} textContentType="name" />
        <TextInput placeholder="Username" style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" textContentType="username" />
        <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" textContentType="emailAddress" autoComplete="email" />
        <TextInput placeholder="Password" style={styles.input} secureTextEntry value={password} onChangeText={setPassword} textContentType="newPassword" autoComplete="password-new" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <View style={{ gap: 10 }}>
          <Pressable style={styles.button} onPress={handleSignUp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </Pressable>
          
          <Pressable style={[styles.button, { backgroundColor: "#64748b" }]} onPress={handleGuestAccess} disabled={loading}>
            <Text style={styles.buttonText}>Proceed as Guest</Text>
          </Pressable>
        </View>

        <Pressable onPress={onBackToLogin}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  inner: { gap: 14 },
  title: { fontSize: 24, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 14, backgroundColor: "#fff", fontSize: 16 },
  button: { backgroundColor: "#0f766e", padding: 16, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  link: { textAlign: "center", color: "#1d4ed8", marginTop: 8 },
  error: { color: "#b91c1c", textAlign: "center" }
});
