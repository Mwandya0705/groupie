import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const HEARTBEAT_MS = 12000;
const PING_TIMEOUT_MS = 5000;

/**
 * Reachability check that proves there is *real* data flow, not just a
 * Wi-Fi association ("ghost Wi-Fi"). We HEAD the Supabase REST root, which
 * is the host the app actually needs to reach. Any HTTP response (even a
 * 401/404) means the network path is alive.
 */
async function pingSupabase(): Promise<boolean> {
  if (!SUPABASE_URL) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    return !!res;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export type Connectivity = {
  /** True only when the device has a network link AND Supabase is reachable. */
  isOnline: boolean;
  /** Raw OS-level network link (may be "ghost Wi-Fi"). */
  hasLink: boolean;
  /** Manually re-run the reachability check. */
  refresh: () => Promise<boolean>;
};

export function useConnectivity(): Connectivity {
  const [hasLink, setHasLink] = useState(true);
  const [reachable, setReachable] = useState(true);
  const mounted = useRef(true);

  const refresh = async () => {
    const ok = await pingSupabase();
    if (mounted.current) setReachable(ok);
    return ok;
  };

  useEffect(() => {
    mounted.current = true;

    // 1. Initial OS check
    NetInfo.fetch().then((s) => {
      const link = s.isConnected === true && s.isInternetReachable !== false;
      setHasLink(link);
      if (link) void refresh();
      else setReachable(false);
    });

    // 2. React to OS link changes immediately
    const unsub = NetInfo.addEventListener((s) => {
      const link = s.isConnected === true && s.isInternetReachable !== false;
      setHasLink(link);
      if (!link) setReachable(false);
      else void refresh();
    });

    // 3. Heartbeat while the app is foregrounded
    const heartbeat = setInterval(() => {
      if (AppState.currentState === "active") void refresh();
    }, HEARTBEAT_MS);

    // 4. Re-check the moment the app returns to foreground
    const appSub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });

    return () => {
      mounted.current = false;
      unsub();
      clearInterval(heartbeat);
      appSub.remove();
    };
  }, []);

  return { isOnline: hasLink && reachable, hasLink, refresh };
}
