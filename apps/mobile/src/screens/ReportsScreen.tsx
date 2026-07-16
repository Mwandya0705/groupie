import { useEffect, useMemo, useState, useCallback } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FileWarning, MapPin, ImageOff, FileText, Trash2, ShieldAlert, WifiOff } from "lucide-react-native";
import { fetchRecentIncidents, deleteIncident, shareReportAsDoc } from "../services/incidentService";
import { IncidentRecord } from "../types/domain";
import { Card, Txt, Eyebrow, StatusBadge, SpotlightCard } from "../components";
import { radius, spacing, Palette } from "../theme";
import { useTheme } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPendingItems, removePendingItem } from "../store/offlineStore";

type Props = { isOnline: boolean; pendingCount: number };

const CACHED_INCIDENTS_KEY = "cached_incidents_feed";

export function ReportsScreen({ isOnline, pendingCount }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setIsOfflineMode(false);
    try {
      // 1. Load locally queued pending incidents waiting to sync
      let pendingIncidents: IncidentRecord[] = [];
      try {
        const pendingItems = await getPendingItems();
        pendingIncidents = pendingItems
          .filter((item) => item.kind === "incident")
          .map((item) => ({
            id: item.id || `local_${Math.random()}`,
            type: item.payload.type,
            description: item.payload.description || null,
            latitude: item.payload.latitude,
            longitude: item.payload.longitude,
            created_at: item.timestamp || new Date().toISOString(),
            evidence: item.imageBase64 ? [{ id: "temp", image_url: `data:image/jpeg;base64,${item.imageBase64}`, created_at: "" }] : [],
            ai_analysis: {
              threat_level: "pending",
              confidence_score: 0,
              detected_objects: [],
              ai_summary: "Awaiting sync..."
            }
          }));
      } catch (err) {
        console.warn("Failed to load pending items:", err);
      }

      // 2. Fetch live incidents or fallback to offline local cache
      let liveIncidents: IncidentRecord[] = [];
      try {
        liveIncidents = await fetchRecentIncidents(40);
        await AsyncStorage.setItem(CACHED_INCIDENTS_KEY, JSON.stringify(liveIncidents));
      } catch (err) {
        setIsOfflineMode(true);
        const cached = await AsyncStorage.getItem(CACHED_INCIDENTS_KEY);
        if (cached) {
          liveIncidents = JSON.parse(cached);
        }
      }

      setIncidents([...pendingIncidents, ...liveIncidents]);
    } catch (err) {
      console.warn("Failed to load reports feed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, pendingCount]);

  const handleDelete = (id: string) => {
    const isPendingIncident = id.startsWith("local_") || id.startsWith("sim_");
    Alert.alert(
      "Delete Report",
      `Are you sure you want to permanently delete this ${isPendingIncident ? "pending " : ""}report?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (isPendingIncident) {
                await removePendingItem(id);
              } else {
                await deleteIncident(id);
              }
              setIncidents((prev) => prev.filter((inc) => inc.id !== id));
            } catch (err: any) {
              Alert.alert("Error", "Failed to delete report: " + (err.message || err));
            }
          },
        },
      ]
    );
  };

  const handleShare = async (reportText: string) => {
    try {
      await shareReportAsDoc(reportText);
    } catch (err: any) {
      Alert.alert("Error", "Failed to generate Word document: " + (err.message || err));
    }
  };

  const threatTone = (lvl?: string) =>
    lvl === "high" || lvl === "critical" ? "danger" : lvl === "pending" ? "neutral" : "warning";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.sm, paddingBottom: 120, gap: spacing.md }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accent} />}
    >
      <View>
        <Eyebrow>Command center feed</Eyebrow>
        <Txt variant="displayLg">Reports</Txt>
      </View>

      {/* Offline Mode Banner */}
      {isOfflineMode && (
        <Card style={styles.offlineBanner}>
          <WifiOff color={colors.warning} size={18} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodySm" color={colors.warning} style={{ fontWeight: "bold" }}>Offline Mode</Txt>
            <Txt variant="caption" color={colors.inkMuted}>Showing cached and pending reports. Pull to refresh when online.</Txt>
          </View>
        </Card>
      )}

      {pendingCount > 0 && (
        <SpotlightCard variant="orange">
          <Eyebrow color="rgba(255,255,255,0.8)">Awaiting sync</Eyebrow>
          <Txt variant="displayMd" color="#fff">{pendingCount} report{pendingCount > 1 ? "s" : ""} in vault</Txt>
          <Txt variant="bodySm" color="rgba(255,255,255,0.85)">These will upload automatically when you reconnect.</Txt>
        </SpotlightCard>
      )}

      {loading && incidents.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
      ) : incidents.length === 0 ? (
        <Card style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xxl }}>
          <FileWarning color={colors.inkFaint} size={48} strokeWidth={1.4} />
          <Txt variant="headline">No reports available</Txt>
          <Txt variant="bodySm" color={colors.inkMuted} style={{ textAlign: "center" }}>
            Connect online to sync with the central watch command database.
          </Txt>
        </Card>
      ) : (
        incidents.map((inc) => {
          const img = inc.evidence?.[0]?.image_url;
          return (
            <Card key={inc.id} style={{ gap: spacing.sm }}>
              <View style={styles.row}>
                <View style={styles.thumb}>
                  {img ? <Image source={{ uri: img }} style={styles.thumbImg} /> : <ImageOff color={colors.inkFaint} size={20} />}
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt variant="bodyLg" numberOfLines={1}>{inc.type}</Txt>
                  <Txt variant="caption" color={colors.inkMuted}>{new Date(inc.created_at).toLocaleString([], { timeZone: "Africa/Nairobi" })}</Txt>
                </View>
                <StatusBadge label={(inc.ai_analysis?.threat_level ?? "n/a").toUpperCase()} tone={threatTone(inc.ai_analysis?.threat_level)} />
              </View>

              {inc.description ? <Txt variant="body" color={colors.inkMuted} numberOfLines={2}>{inc.description}</Txt> : null}

              <View style={styles.footer}>
                <View style={styles.loc}>
                  <MapPin color={colors.inkFaint} size={13} />
                  <Txt variant="caption" color={colors.inkMuted}>{inc.latitude.toFixed(3)}, {inc.longitude.toFixed(3)}</Txt>
                </View>
                {inc.ai_analysis && inc.ai_analysis.threat_level !== "pending" ? (
                  <Txt variant="caption" color={colors.accent}>AI {(inc.ai_analysis.confidence_score * 100).toFixed(0)}%</Txt>
                ) : (
                  <Txt variant="caption" color={colors.warning} style={{ fontWeight: "bold" }}>⚠️ Requires AI Analysis</Txt>
                )}
              </View>

              <View style={styles.actionRow}>
                {inc.ai_analysis?.report ? (
                  <Pressable style={styles.reportBtn} onPress={() => handleShare(inc.ai_analysis!.report!)}>
                    <FileText color={colors.accent} size={14} />
                    <Txt variant="caption" color={colors.accent}>Share / download (.doc)</Txt>
                  </Pressable>
                ) : (
                  <View style={styles.reportPending}>
                    <ShieldAlert color={colors.inkMuted} size={14} />
                    <Txt variant="caption" color={colors.inkMuted} style={{ fontStyle: "italic" }}>
                      Report to be generated upon sync
                    </Txt>
                  </View>
                )}

                <Pressable style={styles.deleteBtn} onPress={() => handleDelete(inc.id)}>
                  <Trash2 color={colors.danger} size={14} />
                  <Txt variant="caption" color={colors.danger}>Delete</Txt>
                </Pressable>
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  thumb: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  thumbImg: { width: "100%", height: "100%" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xxs },
  loc: { flexDirection: "row", alignItems: "center", gap: 5 },
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
  actionRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: spacing.sm, marginTop: spacing.xxs,
  },
  reportBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  reportPending: {
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
  },
});
