import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { UserCircle2, ShieldCheck, Wifi, WifiOff, KeyRound, LogOut, Moon, Sun, MapPin } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabase";
import { Screen, Card, Txt, Eyebrow, Button, StatusBadge, Divider, SegTabs } from "../components";
import { radius, spacing, Palette } from "../theme";
import { useTheme } from "../theme/ThemeContext";

const PIN_KEY = "security_pin";
const ACCURACY_KEY = "gps_accuracy";

type Props = {
  userId: string;
  userName: string | null;
  isOnline: boolean;
  pendingCount: number;
  onSignOut: () => void;
};

export function ProfileScreen({ userId, userName, isOnline, pendingCount, onSignOut }: Props) {
  const { colors, scheme, setScheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [role, setRole] = useState<string>("operator");
  const [email, setEmail] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<string>("balanced");

  useEffect(() => {
    supabase
      .from("profiles")
      .select("role,email")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.role) setRole(data.role);
        if (data?.email) setEmail(data.email);
      });

    AsyncStorage.getItem(ACCURACY_KEY).then((val) => {
      if (val) setGpsAccuracy(val);
    });
  }, [userId]);

  const resetPin = () => {
    Alert.alert("Reset security PIN", "You'll set a new PIN next time the vault locks.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset PIN",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(PIN_KEY);
          Alert.alert("Done", "Security PIN cleared.");
        },
      },
    ]);
  };

  const confirmSignOut = () => {
    Alert.alert("Close session", "Sign out of this device?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: onSignOut },
    ]);
  };

  const initials = (userName || "Officer").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Screen>
      <View>
        <Eyebrow>Account</Eyebrow>
        <Txt variant="displayLg">Profile</Txt>
      </View>

      <Card style={{ gap: spacing.md }}>
        <View style={styles.row}>
          <View style={styles.avatar}><Txt variant="headline">{initials}</Txt></View>
          <View style={{ flex: 1 }}>
            <Txt variant="headline" numberOfLines={1}>{userName || "Officer"}</Txt>
            {email ? <Txt variant="caption" color={colors.inkMuted}>{email}</Txt> : null}
          </View>
        </View>
        <Divider />
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Eyebrow color={colors.inkMuted}>ROLE</Eyebrow>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <ShieldCheck color={colors.accent} size={16} />
              <Txt variant="bodyLg" style={{ textTransform: "capitalize" }}>{role}</Txt>
            </View>
          </View>
          <View style={styles.meta}>
            <Eyebrow color={colors.inkMuted}>LINK</Eyebrow>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {isOnline ? <Wifi color={colors.success} size={16} /> : <WifiOff color={colors.danger} size={16} />}
              <Txt variant="bodyLg" color={isOnline ? colors.success : colors.danger}>{isOnline ? "Online" : "Offline"}</Txt>
            </View>
          </View>
        </View>
      </Card>

      <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Eyebrow color={colors.inkMuted}>VAULT</Eyebrow>
          <Txt variant="bodyLg">{pendingCount} pending report{pendingCount === 1 ? "" : "s"}</Txt>
        </View>
        <StatusBadge label={pendingCount > 0 ? "AWAITING SYNC" : "ALL SYNCED"} tone={pendingCount > 0 ? "warning" : "success"} />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {scheme === "dark" ? <Moon color={colors.accent} size={16} /> : <Sun color={colors.accent} size={16} />}
          <Eyebrow color={colors.inkMuted}>APPEARANCE</Eyebrow>
        </View>
        <SegTabs
          options={[{ label: "Dark", value: "dark" }, { label: "Light", value: "light" }]}
          value={scheme}
          onChange={(v) => setScheme(v as "dark" | "light")}
        />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MapPin color={colors.accent} size={16} />
          <Eyebrow color={colors.inkMuted}>GPS ACCURACY PRESET</Eyebrow>
        </View>
        <SegTabs
          options={[
            { label: "Balanced", value: "balanced" },
            { label: "High", value: "high" },
            { label: "Highest", value: "highest" }
          ]}
          value={gpsAccuracy}
          onChange={async (v) => {
            setGpsAccuracy(v);
            await AsyncStorage.setItem(ACCURACY_KEY, v);
          }}
        />
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Button label="Reset security PIN" variant="secondary" onPress={resetPin} icon={<KeyRound color={colors.ink} size={18} />} full />
        <Button label="Close session" variant="danger" onPress={confirmSignOut} icon={<LogOut color="#fff" size={18} />} full />
      </View>

      <Txt variant="caption" color={colors.inkFaint} style={{ textAlign: "center", marginTop: spacing.sm }}>
        IUU Patrol Mobile · v1.0
      </Txt>
    </Screen>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.surface3, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.hairline },
  metaRow: { flexDirection: "row", gap: spacing.md },
  meta: { flex: 1, gap: 6 },
});
