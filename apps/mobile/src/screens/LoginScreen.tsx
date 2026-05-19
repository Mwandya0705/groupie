import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { signIn } from "../services/authService";

type Props = {
  onSignedIn: () => void;
  onGoToSignUp: () => void;
};

export function LoginScreen({ onSignedIn, onGoToSignUp }: Props) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn(identifier, password);
      onSignedIn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inner, { width: isLargeScreen ? 400 : "100%" }]}>
        <Text style={[styles.title, isLargeScreen && { textAlign: "center", fontSize: 32, marginBottom: 12 }]}>
          Officer Authentication
        </Text>
        <TextInput 
          placeholder="Username or Email" 
          style={styles.input} 
          value={identifier} 
          onChangeText={setIdentifier} 
          autoCapitalize="none" 
          textContentType="username"
          autoComplete="username"
        />
        <TextInput 
          placeholder="Security Passcode" 
          style={styles.input} 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
          textContentType="password"
          autoComplete="password"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Authenticate Session</Text>}
        </Pressable>
        <Pressable onPress={onGoToSignUp}>
          <Text style={styles.link}>Create account</Text>
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
