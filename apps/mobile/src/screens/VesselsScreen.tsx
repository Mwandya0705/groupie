import { useEffect, useMemo, useState, useCallback } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ship, Search } from "lucide-react-native";
import { searchVessels } from "../services/vesselService";
import { Vessel } from "../types/domain";
import { Card, Txt, Eyebrow, Field, StatusBadge } from "../components";
import { radius, spacing, Palette } from "../theme";
import { useTheme } from "../theme/ThemeContext";

export function VesselsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      setError(null);
      setVessels(await searchVessels(q));
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

      <Field
        placeholder="Search by name or registration #"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="characters"
      />

      {loading ? (
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
});
