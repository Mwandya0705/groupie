import { useEffect, useMemo, useState, useCallback } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloudUpload, Trash2, Shield, Zap, MapPin, Clock, Database } from "lucide-react-native";
import { getPendingItems, removePendingItem, syncItem, syncPendingData, clearPendingItems } from "../store/offlineStore";
import { PendingItem } from "../types/domain";
import { Card, Txt, Eyebrow, Button, StatusBadge } from "../components";
import { radius, spacing, Palette } from "../theme";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  userId: string;
  isOnline: boolean;
  onChanged: () => void;
  isAutoSyncing?: boolean;
};

export function PendingDataScreen({ userId, isOnline, onChanged, isAutoSyncing }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const load = useCallback(async () => {
    setItems(await getPendingItems());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load, isAutoSyncing]);

  const syncOne = async (item: PendingItem) => {
    if (!item.id) return;
    if (!isOnline) { Alert.alert("Offline", "Reconnect to sync this report."); return; }
    setBusyId(item.id);
    try {
      await syncItem(item, userId);
      await removePendingItem(item.id);
      await load();
      onChanged();
    } catch {
      Alert.alert("Sync failed", "Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  };

  const syncAll = async () => {
    if (!isOnline) { Alert.alert("Offline", "Reconnect to sync the vault."); return; }
    setSyncingAll(true);
    try {
      const res = await syncPendingData(userId);
      await load();
      onChanged();
      if (res.skipped === "no-session") {
        Alert.alert(
          "Sign in required",
          "You're not signed in to the Command Center, so reports can't be uploaded. Please log in again, then sync.",
        );
        return;
      }
      const parts = [`Uploaded ${res.synced} of ${res.attempted}.`];
      if (res.purged > 0) parts.push(`${res.purged} un-syncable report(s) were cleared.`);
      if (res.failed > 0) parts.push(`${res.failed} will retry later.`);
      Alert.alert("Sync complete", parts.join("\n"));
    } finally {
      setSyncingAll(false);
    }
  };

  const clearAll = () => {
    Alert.alert(
      "Clear vault",
      "Permanently delete ALL locally vaulted reports? This cannot be undone and they will not be uploaded.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: async () => { await clearPendingItems(); await load(); onChanged(); },
        },
      ],
    );
  };

  const remove = (item: PendingItem) => {
    if (!item.id) return;
    Alert.alert("Discard report", "Permanently delete this vaulted report?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await removePendingItem(item.id!); await load(); onChanged(); } },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.sm, paddingBottom: 120, gap: spacing.md }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <View>
          <Eyebrow>Offline storage</Eyebrow>
          <Txt variant="displayLg">Vault</Txt>
        </View>
        <StatusBadge label={`${items.length} QUEUED`} tone={items.length > 0 ? "warning" : "success"} />
      </View>

      {/* Auto-Syncing Banner */}
      {isAutoSyncing && (
        <Card style={styles.syncingBanner}>
          <ActivityIndicator color={colors.accent} size="small" />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="bodySm" color={colors.accent} style={{ fontWeight: "bold" }}>Sending to dashboard...</Txt>
            <Txt variant="caption" color={colors.inkMuted}>Uploading reports and generating AI observations.</Txt>
          </View>
        </Card>
      )}

      {items.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Button
            label={isOnline ? "Sync all to dashboard" : "Reconnect to sync"}
            onPress={syncAll}
            loading={syncingAll}
            disabled={!isOnline}
            icon={<CloudUpload color={colors.onPrimary} size={18} />}
            full
          />
          <Pressable onPress={clearAll} disabled={syncingAll} style={styles.clearBtn}>
            <Trash2 color={colors.danger} size={15} />
            <Txt variant="bodySm" color={colors.danger}>Clear vault</Txt>
          </Pressable>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
      ) : items.length === 0 ? (
        <Card style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xxl }}>
          <Database color={colors.inkFaint} size={48} strokeWidth={1.4} />
          <Txt variant="headline">Vault is empty</Txt>
          <Txt variant="bodySm" color={colors.inkMuted} style={{ textAlign: "center" }}>
            All local reports have synced to the Command Center.
          </Txt>
        </Card>
      ) : (
        items.map((item) => (
          <Card key={item.id} style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <StatusBadge
                label={item.kind.toUpperCase()}
                tone={item.kind === "patrol" ? "accent" : "warning"}
              />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Clock color={colors.inkFaint} size={13} />
                <Txt variant="caption" color={colors.inkMuted}>{new Date(item.timestamp!).toLocaleTimeString([], { timeZone: "Africa/Nairobi" })}</Txt>
              </View>
            </View>

            <Txt variant="body" color={colors.inkMuted} numberOfLines={2}>
              {item.kind === "incident"
                ? item.payload.description || item.payload.type
                : `Patrol with ${item.payload.route.length} GPS points captured locally.`}
            </Txt>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                {item.kind === "patrol" ? <Shield color={colors.inkFaint} size={13} /> : <MapPin color={colors.inkFaint} size={13} />}
                <Txt variant="caption" color={colors.inkMuted}>
                  {item.kind === "incident"
                    ? `${item.payload.latitude.toFixed(3)}, ${item.payload.longitude.toFixed(3)}`
                    : "Local route"}
                </Txt>
              </View>
              <View style={{ flexDirection: "row", gap: spacing.xs }}>
                <Pressable onPress={() => remove(item)} style={styles.iconBtn}>
                  <Trash2 color={colors.danger} size={16} />
                </Pressable>
                <Button
                  label="Sync"
                  variant="accent"
                  onPress={() => syncOne(item)}
                  loading={busyId === item.id}
                  icon={<Zap color="#fff" size={14} />}
                  style={{ minHeight: 38, paddingHorizontal: spacing.md }}
                />
              </View>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  iconBtn: {
    width: 38, height: 38, borderRadius: radius.pill,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.hairline,
    alignItems: "center", justifyContent: "center",
  },
  clearBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: spacing.sm, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.danger + "55", backgroundColor: colors.danger + "11",
  },
  syncingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + "20",
    backgroundColor: colors.accent + "05",
    padding: spacing.md,
    borderRadius: radius.lg,
  },
});
