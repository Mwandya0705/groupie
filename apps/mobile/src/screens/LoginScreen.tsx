import { useState } from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";
import { ShieldCheck } from "lucide-react-native";
import { signIn } from "../services/authService";
import { Screen, Txt, Eyebrow, Button, Field, SpotlightCard } from "../components";
import { spacing, type } from "../theme";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  onSignedIn: () => void;
  onGoToSignUp: () => void;
};

export function LoginScreen({ onSignedIn, onGoToSignUp }: Props) {
  const { colors } = useTheme();
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
    <Screen contentStyle={{ flexGrow: 1, justifyContent: "center", gap: spacing.lg }}>
      <SpotlightCard variant="ocean" style={{ alignItems: "flex-start", gap: spacing.sm }}>
        <View style={styles.glyph}>
          <ShieldCheck color="#fff" size={26} />
        </View>
        <Txt variant="displayLg" color="#fff">Mission{"\n"}Control</Txt>
        <Txt variant="body" color="rgba(255,255,255,0.85)">
          Maritime IUU surveillance &amp; patrol command.
        </Txt>
      </SpotlightCard>

      <View style={{ gap: spacing.md }}>
        <Eyebrow>Officer authentication</Eyebrow>
        <Field
          label="Username or email"
          placeholder="j.officer or you@agency.go"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          textContentType="username"
          autoComplete="username"
        />
        <Field
          label="Security passcode"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          autoComplete="password"
        />
        {error ? <Text style={[type.bodySm, { color: colors.danger }]}>{error}</Text> : null}

        <Button label="Authenticate session" onPress={handleLogin} loading={loading} full />
        <Pressable onPress={onGoToSignUp} style={{ alignItems: "center", paddingVertical: spacing.sm }}>
          <Text style={[type.bodySm, { color: colors.accent }]}>Create an account</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  glyph: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
});
