import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const HEALTH_URL = SUPABASE_URL ? `${SUPABASE_URL}/auth/v1/health` : "";
const HEARTBEAT_MS = 10000;
const PING_TIMEOUT_MS = 6000;

/**
 * Point NetInfo's *own* reachability probe at the host the app actually needs
 * (Supabase) instead of its default Google `/generate_204` endpoint. On many
 * mobile networks — and especially inside Expo Go / the iOS Simulator — the
 * default probe returns a false `isInternetReachable: false` even when the
 * connection is fine, which would wrongly flip the app to "Offline". Testing the
 * real backend makes the OS-level signal agree with what we care about.
 */
let configured = false;
function configureNetInfoOnce() {
  if (configured || !HEALTH_URL) return;
  configured = true;
  NetInfo.configure({
    reachabilityUrl: HEALTH_URL,
    // Any non-server-error response proves the path to Supabase is alive.
    reachabilityTest: async (res) => res.status >= 200 && res.status < 500,
    reachabilityRequestTimeout: PING_TIMEOUT_MS,
    reachabilityShortTimeout: 5 * 1000,
    reachabilityLongTimeout: 60 * 1000,
  });
}
configureNetInfoOnce();

/**
 * Reachability check that proves there is *real* data flow, not just a Wi-Fi
 * association ("ghost Wi-Fi"). We hit the Supabase health endpoint — the host
 * the app actually needs to reach. Any HTTP response (even a 401/404/429) means
 * the network path is alive.
 */
async function pingSupabase(): Promise<boolean> {
  if (!HEALTH_URL) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(HEALTH_URL, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    return res.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export type Connectivity = {
  /** True only when Supabase is actually reachable (the source of truth). */
  isOnline: boolean;
  /** Raw OS-level network link (may be "ghost Wi-Fi" with no real data flow). */
  hasLink: boolean;
  /** Manually re-run the reachability check; resolves to the live result. */
  refresh: () => Promise<boolean>;
};

export function useConnectivity(): Connectivity {
  const [hasLink, setHasLink] = useState(true);
  const [reachable, setReachable] = useState(true);
  const mounted = useRef(true);
  const inFlight = useRef<Promise<boolean> | null>(null);

  // De-duplicate overlapping probes (heartbeat + link change + foreground can
  // all fire at once). Reaching Supabase is authoritative: if the ping succeeds
  // we ARE online, regardless of what NetInfo reports for `isInternetReachable`.
  const refresh = async (): Promise<boolean> => {
    if (inFlight.current) return inFlight.current;
    const probe = pingSupabase().then((ok) => {
      if (mounted.current) {
        setReachable(ok);
        if (ok) setHasLink(true); // a successful ping proves a live link
      }
      inFlight.current = null;
      return ok;
    });
    inFlight.current = probe;
    return probe;
  };

  useEffect(() => {
    mounted.current = true;
    configureNetInfoOnce();

    // 1. Initial OS snapshot, then verify against the real backend.
    NetInfo.fetch().then((s) => {
      if (!mounted.current) return;
      const link = s.isConnected === true;
      setHasLink(link);
      if (link) void refresh();
      else setReachable(false);
    });

    // 2. React to OS link changes immediately. We treat `isConnected` as the
    //    fast link signal and let the Supabase ping decide true reachability,
    //    so a flaky `isInternetReachable` can't force a false "Offline".
    const unsub = NetInfo.addEventListener((s) => {
      if (!mounted.current) return;
      const link = s.isConnected === true;
      setHasLink(link);
      if (!link) setReachable(false);
      else void refresh();
    });

    // 3. Heartbeat while the app is foregrounded — catches silent drops and
    //    silent recoveries that emit no NetInfo event.
    const heartbeat = setInterval(() => {
      if (AppState.currentState === "active") void refresh();
    }, HEARTBEAT_MS);

    // 4. Re-check the moment the app returns to the foreground.
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
