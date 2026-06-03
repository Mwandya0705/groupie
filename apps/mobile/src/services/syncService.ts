import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const DEVICE_ID_KEY = "device_id";

async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `mobile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export async function recordSyncLog(
  userId: string,
  log: { status: "success" | "failed" | "pending"; records_synced: number; error_message?: string | null }
) {
  try {
    const device_id = await getDeviceId();
    await supabase.from("sync_logs").insert({
      user_id: userId,
      device_id,
      status: log.status,
      records_synced: log.records_synced,
      error_message: log.error_message ?? null,
      last_sync_at: new Date().toISOString(),
    });
  } catch (err) {
    // Sync logging is best-effort; never block the real sync on it.
    console.log("recordSyncLog failed (non-fatal):", err);
  }
}
