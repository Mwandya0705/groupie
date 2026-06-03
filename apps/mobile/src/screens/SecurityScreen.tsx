import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Fingerprint, ShieldCheck, KeyRound, Delete, Undo2 } from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { gradients, radius, spacing, type, Palette } from "../theme";
import { useTheme } from "../theme/ThemeContext";

type Props = { onUnlock: () => void; onLogout: () => void };

const PIN_KEY = "security_pin";
const { width } = Dimensions.get("window");

export function SecurityScreen({ onUnlock, onLogout }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [pin, setPin] = useState("");
  const [bioSupported, setBioSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasStoredPin, setHasStoredPin] = useState(false);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setBioSupported(compatible);
      const stored = await AsyncStorage.getItem(PIN_KEY);
      setHasStoredPin(!!stored);
      if (compatible) handleBiometric();
    })();
  }, []);

  const handleBiometric = async () => {
    setLoading(true);
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock IUU Mission Control",
        fallbackLabel: "Use PIN",
      });
      if (res.success) onUnlock();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (pin.length < 4) { Alert.alert("Invalid PIN", "PIN must be at least 4 digits"); return; }
    const stored = await AsyncStorage.getItem(PIN_KEY);
    if (!stored) { await AsyncStorage.setItem(PIN_KEY, pin); onUnlock(); }
    else if (pin === stored) onUnlock();
    else { Alert.alert("Access denied", "Incorrect security PIN"); setPin(""); }
  };

  const dots = Array(6).fill(0).map((_, i) => i < pin.length);
  const rows = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["bio", "0", "del"]];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={{ alignItems: "center", gap: spacing.md }}>
          <LinearGradient colors={gradients.ocean} style={styles.iconCircle}>
            <ShieldCheck color="#fff" size={38} />
          </LinearGradient>
          <Text style={[type.displayMd, { textAlign: "center", color: colors.ink }]}>Secure lockdown</Text>
          <Text style={[type.eyebrow, { color: colors.accent }]}>
            {hasStoredPin ? "ENTER SERVICE PIN TO UNLOCK" : "INITIALISE NEW SECURITY PIN"}
          </Text>
        </View>

        <View style={styles.pinRow}>
          {dots.map((filled, i) => (
            <View key={i} style={[styles.pinDot, filled && styles.pinDotFilled]} />
          ))}
        </View>

        <Pressable
          style={[styles.unlock, pin.length >= 4 ? styles.unlockActive : styles.unlockDisabled]}
          onPress={submit}
          disabled={pin.length < 4}
        >
          <KeyRound color={pin.length >= 4 ? colors.onPrimary : colors.inkMuted} size={18} />
          <Text style={[type.button, { color: pin.length >= 4 ? colors.onPrimary : colors.inkMuted }]}>
            {hasStoredPin ? "Decrypt vault" : "Set PIN"}
          </Text>
        </Pressable>

        <View style={styles.numpad}>
          {rows.map((row, r) => (
            <View key={r} style={styles.numRow}>
              {row.map((cell) => {
                if (cell === "bio") {
                  return (
                    <Pressable key="bio" style={styles.key} onPress={bioSupported ? handleBiometric : undefined}>
                      {bioSupported && <Fingerprint color={colors.accent} size={30} />}
                    </Pressable>
                  );
                }
                if (cell === "del") {
                  return (
                    <Pressable key="del" style={styles.key} onPress={() => setPin((p) => p.slice(0, -1))}>
                      <Delete color={colors.inkMuted} size={24} />
                    </Pressable>
                  );
                }
                return (
                  <Pressable key={cell} style={styles.key} onPress={() => pin.length < 6 && setPin((p) => p + cell)}>
                    <Text style={styles.keyText}>{cell}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <Pressable style={styles.switch} onPress={onLogout}>
          <Undo2 color={colors.inkMuted} size={14} />
          <Text style={[type.eyebrow, { color: colors.inkMuted }]}>SWITCH OPERATOR</Text>
        </Pressable>
      </View>

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingTop: 90, paddingBottom: 40 },
  iconCircle: { width: 78, height: 78, borderRadius: 39, alignItems: "center", justifyContent: "center" },
  pinRow: { flexDirection: "row", gap: spacing.md, marginVertical: spacing.lg },
  pinDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: colors.hairline, backgroundColor: colors.surface1 },
  pinDotFilled: { borderColor: colors.accent, backgroundColor: colors.accent },
  unlock: { width: width * 0.8, height: 52, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs },
  unlockActive: { backgroundColor: colors.primary },
  unlockDisabled: { backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.hairline },
  numpad: { width: width * 0.82, gap: spacing.md },
  numRow: { flexDirection: "row", justifyContent: "space-between" },
  key: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.hairline },
  keyText: { fontSize: 28, color: colors.ink, fontWeight: "400" },
  switch: { flexDirection: "row", alignItems: "center", gap: spacing.xs, padding: spacing.sm },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(9,9,9,0.92)", alignItems: "center", justifyContent: "center" },
});
