import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Database, CloudUpload, Trash2, Shield, Zap, MapPin, Clock, ArrowLeft } from "lucide-react-native";
import { getPendingItems, removePendingItem, syncItem } from "../store/offlineStore";
import { PendingItem } from "../types/domain";

type Props = {
  userId: string;
  onBack: () => void;
};

export function PendingDataScreen({ userId, onBack }: Props) {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const data = await getPendingItems();
    setItems(data);
    setLoading(false);
  };

  const handleSyncItem = async (item: PendingItem) => {
    if (!item.id) return;
    setSyncingId(item.id);
    try {
      await syncItem(item, userId);
      await removePendingItem(item.id);
      await loadItems();
      Alert.alert("Success", "Report synchronized successfully");
    } catch (err: any) {
      Alert.alert("Sync Failed", "Check your connection and try again.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteItem = async (item: PendingItem) => {
    if (!item.id) return;
    Alert.alert(
      "Delete Report",
      "Are you sure you want to permanently discard this report?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await removePendingItem(item.id!);
            await loadItems();
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: PendingItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <View style={[styles.badge, { backgroundColor: item.kind === 'patrol' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(168, 85, 247, 0.1)' }]}>
            {item.kind === 'patrol' ? <Shield color="#38bdf8" size={12} /> : <Zap color="#a855f7" size={12} />}
            <Text style={[styles.badgeText, { color: item.kind === 'patrol' ? '#38bdf8' : '#a855f7' }]}>
              {item.kind.toUpperCase()}
            </Text>
          </View>
          <View style={styles.timestampRow}>
             <Clock color="#94a3b8" size={12} />
             <Text style={styles.timestampText}>{new Date(item.timestamp!).toLocaleTimeString()}</Text>
          </View>
        </View>
        <Pressable onPress={() => handleDeleteItem(item)} style={styles.deleteBtn}>
          <Trash2 color="#ef4444" size={18} />
        </Pressable>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.kind === 'incident' ? item.payload.description : `Patrol with ${item.payload.route.length} GPS points capured locally.`}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.locationRow}>
           <MapPin color="#64748b" size={12} />
           <Text style={styles.locationText}>
             {item.kind === 'incident' ? `${item.payload.latitude.toFixed(4)}, ${item.payload.longitude.toFixed(4)}` : "Local Tracking Route"}
           </Text>
        </View>
        <Pressable 
          disabled={syncingId !== null} 
          onPress={() => handleSyncItem(item)}
          style={[styles.syncBtn, syncingId === item.id && styles.syncBtnActive]}
        >
          {syncingId === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <CloudUpload color="#fff" size={16} />
              <Text style={styles.syncBtnText}>SYNC</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#fff" size={24} />
        </Pressable>
        <View>
          <Text style={styles.heading}>Pending Reports</Text>
          <Text style={styles.subheading}>{items.length} ITEMS WAITING FOR SYNC</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
           <Database color="#334155" size={64} strokeWidth={1} />
           <Text style={styles.emptyText}>Vault is Empty</Text>
           <Text style={styles.emptySubtext}>All local reports have been synced to the Command Center.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 32, marginTop: 20 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 16 },
  heading: { fontSize: 24, fontWeight: "800", color: "#f8fafc", letterSpacing: -0.5 },
  subheading: { fontSize: 10, fontWeight: "900", color: "#38bdf8", letterSpacing: 2, marginTop: 4 },
  listContent: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, opacity: 0.8 },
  emptyText: { color: "#f1f5f9", fontSize: 20, fontWeight: "700" },
  emptySubtext: { color: "#64748b", fontSize: 13, textAlign: "center", paddingHorizontal: 40, lineHeight: 20 },
  card: { backgroundColor: 'rgba(30, 41, 59, 0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cardInfo: { gap: 12 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: "900" },
  timestampRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  timestampText: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  deleteBtn: { padding: 8 },
  description: { color: "#cbd5e1", fontSize: 14, lineHeight: 22, marginBottom: 20 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  syncBtn: { backgroundColor: "#0ea5e9", flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14 },
  syncBtnActive: { opacity: 0.7 },
  syncBtnText: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 1 }
});
