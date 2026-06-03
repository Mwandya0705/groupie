import AsyncStorage from "@react-native-async-storage/async-storage";
import { PendingItem } from "../types/domain";
import { createPatrol } from "../services/patrolService";
import { createIncident, uploadEvidence } from "../services/incidentService";
import { recordSyncLog } from "../services/syncService";

const PENDING_KEY = "pending_sync_items";

export async function getPendingItems(): Promise<PendingItem[]> {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingItem[];
  } catch {
    return [];
  }
}

export async function addPendingItem(item: PendingItem) {
  const current = await getPendingItems();
  const newItem = {
    ...item,
    id: item.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: item.timestamp || new Date().toISOString()
  };
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify([...current, newItem]));
}

export async function removePendingItem(itemId: string) {
  const current = await getPendingItems();
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(current.filter(i => i.id !== itemId)));
}

export async function clearPendingItems() {
  await AsyncStorage.removeItem(PENDING_KEY);
}

export async function syncItem(item: PendingItem, userId: string) {
  if (item.kind === "patrol") {
    await createPatrol(userId, item.payload);
  } else {
    const incidentId = await createIncident(item.payload);
    if (item.imageBase64) {
      await uploadEvidence(incidentId, item.imageBase64, item.imageName);
    }
  }
}

export async function syncPendingData(userId: string) {
  let queue = await getPendingItems();
  
  // Sort queue: Patrols must be processed before Incidents to resolve relational dependencies.
  // We sort by kind first, then chronologically.
  queue = queue.sort((a, b) => {
    if (a.kind === "patrol" && b.kind !== "patrol") return -1;
    if (a.kind !== "patrol" && b.kind === "patrol") return 1;
    return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
  });

  const failed: PendingItem[] = [];
  const idMap = new Map<string, string>(); // Maps local_id -> real supabase uuid

  for (const item of queue) {
    try {
      if (item.kind === "patrol") {
        const realPatrolId = await createPatrol(userId, item.payload);
        if (item.id) {
          idMap.set(item.id, realPatrolId);
        }
      } else if (item.kind === "incident") {
        let payload = { ...item.payload };
        
        // If the incident belongs to a locally created patrol, remap it to the real DB UUID
        if (payload.patrol_id && idMap.has(payload.patrol_id)) {
          payload.patrol_id = idMap.get(payload.patrol_id)!;
        } else if (payload.patrol_id?.startsWith('local_') || payload.patrol_id?.startsWith('sim_')) {
          throw new Error(`Parent patrol ${payload.patrol_id} was not synced successfully.`);
        }

        const incidentId = await createIncident(payload);

        if (item.imageBase64) {
          await uploadEvidence(incidentId, item.imageBase64, item.imageName);
        }
      }
    } catch (e) {
      console.log("Failed to sync item:", item.id, e);
      failed.push(item);
    }
  }

  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(failed));

  // Record the flush so the dashboard's Sync Monitoring page reflects it.
  if (queue.length > 0) {
    const synced = queue.length - failed.length;
    await recordSyncLog(userId, {
      status: failed.length === 0 ? "success" : "failed",
      records_synced: synced,
      error_message: failed.length > 0 ? `${failed.length} record(s) failed to sync` : null,
    });
  }

  return { attempted: queue.length, failed: failed.length };
}
