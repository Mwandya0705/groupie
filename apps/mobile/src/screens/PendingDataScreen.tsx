import { useEffect, useMemo, useState, useCallback } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloudUpload, Trash2, Shield, Zap, MapPin, Clock, Database } from "lucide-react-native";
import { getPendingItems, removePendingItem, syncItem, syncPendingData } from "../store/offlineStore";
import { PendingItem } from "../types/domain";
import { Card, Txt, Eyebrow, Button, StatusBadge } from "../components";
import { radius, spacing, Palette } from "../theme";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  userId: string;
  isOnline: boolean;
  onChanged: () => void;
};

export function PendingDataScreen({ userId, isOnline, onChanged }: Props) {
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

  useEffect(() => { load(); }, [load]);

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
      Alert.alert("Sync complete", `Uploaded ${res.attempted - res.failed} of ${res.attempted} reports.`);
    } finally {
      setSyncingAll(false);
    }
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

      {items.length > 0 && (
        <Button
          label={isOnline ? "Sync all to dashboard" : "Reconnect to sync"}
          onPress={syncAll}
          loading={syncingAll}
          disabled={!isOnline}
          icon={<CloudUpload color={colors.onPrimary} size={18} />}
          full
        />
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
                <Txt variant="caption" color={colors.inkMuted}>{new Date(item.timestamp!).toLocaleTimeString()}</Txt>
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
});
