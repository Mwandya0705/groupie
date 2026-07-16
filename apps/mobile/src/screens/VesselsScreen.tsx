import { useEffect, useMemo, useState, useCallback } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ship, Search, WifiOff } from "lucide-react-native";
import { searchVessels } from "../services/vesselService";
import { Vessel } from "../types/domain";
import { Card, Txt, Eyebrow, Field, StatusBadge } from "../components";
import { radius, spacing, Palette } from "../theme";
import { useTheme } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHED_VESSELS_KEY = "cached_vessels_registry";

type Props = { isOnline: boolean };

export function VesselsScreen({ isOnline }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      if (q === "") {
        try {
          const allVessels = await searchVessels("");
          await AsyncStorage.setItem(CACHED_VESSELS_KEY, JSON.stringify(allVessels));
          setVessels(allVessels);
          setIsOfflineMode(false);
        } catch (err) {
          const cached = await AsyncStorage.getItem(CACHED_VESSELS_KEY);
          if (cached) {
            setVessels(JSON.parse(cached));
            setIsOfflineMode(true);
          } else {
            throw err;
          }
        }
      } else {
        try {
          const results = await searchVessels(q);
          setVessels(results);
          setIsOfflineMode(false);
        } catch (err) {
          setIsOfflineMode(true);
          const cached = await AsyncStorage.getItem(CACHED_VESSELS_KEY);
          if (cached) {
            const allVessels: Vessel[] = JSON.parse(cached);
            const filtered = allVessels.filter(
              (v) =>
                v.name.toLowerCase().includes(q.toLowerCase()) ||
                v.registration_number.toLowerCase().includes(q.toLowerCase()) ||
                (v.vessel_type && v.vessel_type.toLowerCase().includes(q.toLowerCase()))
            );
            setVessels(filtered);
          } else {
            throw err;
          }
        }
      }
    } catch {
      setError("Could not reach vessel registry. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(""); }, [load]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(query), 350);
    return () => clearTimeout(t);
  }, [query, load]);

  const tone = (s: Vessel["status"]) =>
    s === "blacklisted" ? "danger" : s === "investigating" ? "warning" : "success";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.sm, paddingBottom: 120, gap: spacing.md }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <Eyebrow>Authorisation registry</Eyebrow>
        <Txt variant="displayLg">Vessels</Txt>
      </View>

      {/* Offline Mode Banner */}
      {isOfflineMode && (
        <Card style={styles.offlineBanner}>
          <WifiOff color={colors.warning} size={18} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodySm" color={colors.warning} style={{ fontWeight: "bold" }}>Offline Mode</Txt>
            <Txt variant="caption" color={colors.inkMuted}>Viewing cached watch registry. Search is filtering offline records.</Txt>
          </View>
        </Card>
      )}

      <Field
        placeholder="Search by name or registration #"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="characters"
      />

      {loading && vessels.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      ) : error ? (
        <Card><Txt variant="body" color={colors.inkMuted}>{error}</Txt></Card>
      ) : vessels.length === 0 ? (
        <Card style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xxl }}>
          <Search color={colors.inkFaint} size={44} strokeWidth={1.4} />
          <Txt variant="headline">No matches</Txt>
          <Txt variant="bodySm" color={colors.inkMuted}>Try a different name or registration number.</Txt>
        </Card>
      ) : (
        vessels.map((v) => (
          <Card key={v.id} style={{ gap: spacing.sm }}>
            <View style={styles.row}>
              <View style={styles.glyph}><Ship color={colors.accent} size={20} /></View>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyLg" numberOfLines={1}>{v.name}</Txt>
                <Txt variant="caption" color={colors.inkMuted}>{v.registration_number} · {(v.vessel_type ?? "unknown").toUpperCase()}</Txt>
              </View>
              <StatusBadge label={v.status.toUpperCase()} tone={tone(v.status)} />
            </View>
            {v.owner_info ? <Txt variant="bodySm" color={colors.inkMuted}>Owner: {v.owner_info}</Txt> : null}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  glyph: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center" },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + "20",
    backgroundColor: colors.warning + "05",
    padding: spacing.md,
    borderRadius: radius.lg,
  },
});
