import AsyncStorage from "@react-native-async-storage/async-storage";
import { PendingItem } from "../types/domain";
import { createPatrol } from "../services/patrolService";
import { createIncident, uploadEvidence } from "../services/incidentService";
import { recordSyncLog } from "../services/syncService";
import { getActiveSession } from "../services/authService";

const PENDING_KEY = "pending_sync_items";

/** After this many failed attempts an item is considered un-syncable and purged. */
const MAX_ATTEMPTS = 5;

export type SyncResult = {
  /** Items we tried to push this run (0 if we skipped because of no session). */
  attempted: number;
  /** Items successfully written to Supabase. */
  synced: number;
  /** Items that failed but will be retried on a future run. */
  failed: number;
  /** Items dropped because they can never succeed (auto-purged). */
  purged: number;
  /** Set when the whole run was skipped without touching the queue. */
  skipped?: "no-session";
};

/**
 * Postgres / PostgREST error codes that will NEVER succeed on retry, so the
 * item should be purged rather than retried forever:
 *  - 23505 unique_violation  → row already exists (effectively already synced)
 *  - 23503 foreign_key_violation → references a row that doesn't/won't exist
 *  - 23502 not_null_violation, 22P02 invalid_text_representation → bad payload
 *  - 42501 insufficient_privilege → RLS rejected it *with* a valid session
 *    (the no-session case is handled earlier, so reaching here is permanent)
 */
const PERMANENT_PG_CODES = new Set(["23505", "23503", "23502", "22P02", "42501", "PGRST204"]);

function errorCode(e: any): string | undefined {
  return e?.code ?? e?.cause?.code ?? e?.details?.code;
}

function isPermanentError(e: any): boolean {
  const code = errorCode(e);
  if (code && PERMANENT_PG_CODES.has(code)) return true;
  return false;
}

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

export async function syncPendingData(userId: string): Promise<SyncResult> {
  let queue = await getPendingItems();
  if (queue.length === 0) return { attempted: 0, synced: 0, failed: 0, purged: 0 };

  // Gate on a REAL Supabase session. Without a JWT, every insert runs as the
  // `anon` role and is rejected by RLS (42501) — retrying can never help, so we
  // skip entirely and leave the queue untouched until the user is truly signed in.
  const session = await getActiveSession();
  if (!session) {
    return { attempted: 0, synced: 0, failed: queue.length, purged: 0, skipped: "no-session" };
  }

  // Patrols must be processed before Incidents to resolve relational dependencies.
  queue = queue.sort((a, b) => {
    if (a.kind === "patrol" && b.kind !== "patrol") return -1;
    if (a.kind !== "patrol" && b.kind === "patrol") return 1;
    return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
  });

  // Local patrol ids still waiting in the queue — used to tell a *temporarily*
  // unresolved parent (keep & retry) from a *permanently* orphaned one (purge).
  const queuedPatrolIds = new Set(
    queue.filter((i) => i.kind === "patrol" && i.id).map((i) => i.id as string),
  );

  const retry: PendingItem[] = [];
  const idMap = new Map<string, string>(); // local_id -> real supabase uuid
  let synced = 0;
  let purged = 0;

  for (const item of queue) {
    try {
      if (item.kind === "patrol") {
        const realPatrolId = await createPatrol(userId, item.payload);
        if (item.id) idMap.set(item.id, realPatrolId);
      } else {
        const payload = { ...item.payload };
        const parent = payload.patrol_id;
        const isLocalParent =
          typeof parent === "string" && (parent.startsWith("local_") || parent.startsWith("sim_"));

        if (parent && idMap.has(parent)) {
          payload.patrol_id = idMap.get(parent)!;
        } else if (isLocalParent) {
          // Parent is a local id we haven't mapped to a real UUID.
          if (queuedPatrolIds.has(parent!)) {
            // Parent is still in the queue but failed this run → retry next time.
            throw new Error(`Parent patrol ${parent} not yet synced.`);
          }
          // Parent will never exist (not queued, never synced) → permanent orphan.
          console.log("Purging permanently-orphaned incident:", item.id);
          purged++;
          continue;
        }

        const incidentId = await createIncident(payload);
        if (item.imageBase64) {
          await uploadEvidence(incidentId, item.imageBase64, item.imageName);
        }
      }
      synced++;
    } catch (e) {
      const attempts = (item.attempts ?? 0) + 1;
      if (isPermanentError(e) || attempts >= MAX_ATTEMPTS) {
        console.log(`Purging un-syncable item ${item.id} (code=${errorCode(e)}, attempts=${attempts})`);
        purged++;
      } else {
        console.log(`Failed to sync item ${item.id} (attempt ${attempts}):`, e);
        retry.push({ ...item, attempts });
      }
    }
  }

  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(retry));

  // Record the flush so the dashboard's Sync Monitoring page reflects it.
  const processed = synced + purged;
  if (processed > 0 || retry.length > 0) {
    const failedCount = retry.length + purged;
    await recordSyncLog(userId, {
      status: failedCount === 0 ? "success" : retry.length === 0 ? "success" : "failed",
      records_synced: synced,
      error_message:
        purged > 0 || retry.length > 0
          ? `${synced} synced, ${purged} purged (un-syncable), ${retry.length} pending retry`
          : null,
    });
  }

  return { attempted: queue.length, synced, failed: retry.length, purged };
}
