import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { LoginScreen } from "../screens/LoginScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { IncidentScreen } from "../screens/IncidentScreen";
import { PatrolScreen } from "../screens/PatrolScreen";
import { supabase } from "../services/supabase";
import { createPatrol } from "../services/patrolService";
import { RoutePoint } from "../types/domain";
import { addPendingItem, getPendingItems, syncPendingData } from "../store/offlineStore";
import { signOut } from "../services/authService";

import { Database } from "lucide-react-native";
import { PendingDataScreen } from "../screens/PendingDataScreen";
import { SecurityScreen } from "../screens/SecurityScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OFFLINE_USER_KEY } from "../services/authService";

type AuthView = "login" | "signup";

export function RootNavigator() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [isLocked, setIsLocked] = useState(false);
  const [activePatrolId, setActivePatrolId] = useState<string | null>(null);
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [patrolType, setPatrolType] = useState<"land" | "water">("land");
  const [status, setStatus] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const [view, setView] = useState<"dashboard" | "pending">("dashboard");
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [simulateOffline, setSimulateOffline] = useState(false);

  const fetchProfile = async (uid: string) => {
    // 1. Try fetching from the database (most up-to-date)
    const { data, error } = await supabase.from("profiles").select("username, full_name").eq("id", uid).single();
    
    if (data) {
      setUserName(data.full_name || data.username);
      return;
    }

    // 2. Fallback: Get from session metadata if profile is missing or slow to sync
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (user?.id === uid && user.user_metadata) {
      const metaName = user.user_metadata.full_name || user.user_metadata.username;
      if (metaName) {
        setUserName(metaName);
      }
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    } else {
      setUserName(null);
    }
  }, [userId]);

  useEffect(() => {
    // 1. Initial standard check
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
    });

    // 2. Listen for standard OS network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
    });

    // 3. Proactive Heartbeat: Every 15 seconds, ping a tiny endpoint to verify real-world connectivity
    // This solves "Ghost Wi-Fi" issues where the OS says "Connected" but there is no actual data flow.
    const heartbeat = setInterval(async () => {
      try {
        const response = await fetch("https://www.google.com/favicon.ico", { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store'
        });
        if (response) setIsOnline(true);
      } catch (err) {
        // If fetch fails, we likely have a dead connection even if Wi-Fi is on
        setIsOnline(false);
      }
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(heartbeat);
    };
  }, []);
  useEffect(() => {
    // Auto-sync when coming online
    if (isOnline && !simulateOffline && userId) {
      syncPendingData(userId).then((res) => {
        if (res.attempted > 0) {
           setStatus(`Auto-synced ${res.attempted - res.failed} of ${res.attempted} vaulted records.`);
           refreshPendingCount();
        }
      }).catch(console.error);
    }
  }, [isOnline, simulateOffline, userId]);

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      let activeSession = Boolean(data.session);
      let activeUserId = data.session?.user.id || null;

      // If the cloud token expired while offline, rely on the secure localized identity cache
      if (!activeSession) {
         const offlineUserId = await AsyncStorage.getItem(OFFLINE_USER_KEY);
         if (offlineUserId) {
            activeSession = true;
            activeUserId = offlineUserId;
         }
      }

      setIsAuthenticated(activeSession);
      setUserId(activeUserId);
      if (activeSession && activeUserId) {
         setIsLocked(true); // Always lock on cold boot
         fetchProfile(activeUserId);
      }
    };
    initAuth();
    void refreshPendingCount();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
       void refreshPendingCount();
    }
  }, [isAuthenticated]);

  const refreshPendingCount = async () => {
    const items = await getPendingItems();
    setPendingCount(items.length);
  };

  function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Database connection timed out"));
      }, ms);

      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  const startPatrol = async () => {
    console.log("[startPatrol] Clicked start mission");
    if (!userId) {
      console.log("[startPatrol] No userId found!");
      setStatus("Login required");
      return;
    }

    console.log("[startPatrol] userId:", userId, "isOnline:", isOnline, "simulateOffline:", simulateOffline);
    if (!simulateOffline && isOnline) {
      try {
        console.log("[startPatrol] Attempting online patrol creation with a 4s timeout...");
        const patrolId = await withTimeout(
          createPatrol(userId, {
            patrol_type: patrolType,
            start_time: new Date().toISOString(),
            route: []
          }),
          4000
        );
        console.log("[startPatrol] Online patrol created with ID:", patrolId);
        setActivePatrolId(patrolId);
        setRoute([]);
        setStatus("Patrol synchronized");
        return;
      } catch (err: any) {
        console.error("[startPatrol] Online patrol creation failed:", err);
        setStatus(`Sync failed: ${err?.message || err}. Falling back to offline...`);
        // We do NOT return here, so it falls back to local creation below!
      }
    }

    console.log("[startPatrol] Creating local/offline patrol...");
    const localId = `local_patrol_${Date.now()}`;
    setActivePatrolId(localId);
    setRoute([]);
    setStatus(simulateOffline ? "SIMULATION MODE ACTIVE" : "OFFLINE MISSION STARTED");
  };

  if (!isAuthenticated) {
    return authView === "login" ? (
      <LoginScreen onSignedIn={() => { setIsAuthenticated(true); void initAuth(); }} onGoToSignUp={() => setAuthView("signup")} />
    ) : (
      <SignupScreen 
        onSignedUp={() => { 
          setIsAuthenticated(true); 
          void initAuth(); 
        }} 
        onBackToLogin={() => setAuthView("login")} 
      />
    );
  }

  const connectionLost = !isOnline || simulateOffline;
  const shouldShowLock = isLocked && connectionLost;

  if (shouldShowLock) {
     return (
       <SecurityScreen 
         onUnlock={() => setIsLocked(false)} 
         onLogout={async () => {
           await signOut();
           setIsAuthenticated(false);
           setIsLocked(false);
         }} 
       />
     );
  }

  if (view === "pending") {
    return <PendingDataScreen userId={userId!} onBack={() => { setView("dashboard"); refreshPendingCount(); }} />;
  }

  const containerPadding = isLargeScreen ? 32 : 16;
  const contentWidth = isLargeScreen ? 600 : "100%";

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={[styles.statusBar, connectionLost && styles.statusBarOffline]}>
         <Text style={styles.statusBarText}>
           {connectionLost ? "🛑 DISCONNECTED (OFFLINE MODE)" : "🛰️ SECURE LINK (ONLINE)"}
         </Text>
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.container, 
          { padding: containerPadding, alignItems: isLargeScreen ? "center" : "stretch" }
        ]}
      >
        <View style={{ width: contentWidth, gap: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <Text style={[styles.title, isLargeScreen && { fontSize: 32 }]}>
              Mission Control
            </Text>
            
            <Pressable 
              style={[styles.simToggle, simulateOffline && styles.simToggleActive]} 
              onPress={() => setSimulateOffline(!simulateOffline)}
            >
              <Text style={styles.simToggleText}>{simulateOffline ? "SIM ACTIVE" : "SIM OFF"}</Text>
            </Pressable>
          </View>
          
          <View style={styles.tabRow}>
            <Pressable 
              style={[styles.tab, patrolType === "land" && styles.tabActive]} 
              onPress={() => setPatrolType("land")}
            >
              <Text style={[styles.tabText, patrolType === "land" && styles.tabTextActive]}>Land Patrol</Text>
            </Pressable>
            <Pressable 
              style={[styles.tab, patrolType === "water" && styles.tabActive]} 
              onPress={() => setPatrolType("water")}
            >
              <Text style={[styles.tabText, patrolType === "water" && styles.tabTextActive]}>Water Patrol</Text>
            </Pressable>
          </View>

          {!activePatrolId && (
            <Pressable style={styles.startBtn} onPress={startPatrol}>
              <Text style={styles.startBtnText}>
                {connectionLost ? "START OFFLINE MISSION" : "START NEW MISSION"}
              </Text>
            </Pressable>
          )}

          <PatrolScreen
            activePatrolId={activePatrolId}
            userName={userName}
            route={route}
            setRoute={setRoute}
            simulateOffline={connectionLost}
            onEndPatrol={async () => {
              if (activePatrolId?.startsWith('local_') || connectionLost) {
                await addPendingItem({
                  id: activePatrolId || `sim_${Date.now()}`,
                  kind: "patrol",
                  payload: {
                    patrol_type: patrolType,
                    start_time: new Date().toISOString(),
                    route: route
                  }
                });
                await refreshPendingCount();
              }
              setActivePatrolId(null);
              setRoute([]);
            }}
          />
          
          <IncidentScreen activePatrolId={activePatrolId} simulateOffline={connectionLost} />

          <View style={styles.bottomActions}>
             <Pressable style={styles.vaultBtn} onPress={() => setView("pending")}>
                <Database color="#fff" size={20} />
                <Text style={styles.vaultBtnText}>MISSION VAULT ({pendingCount})</Text>
             </Pressable>

             <Pressable
              style={styles.logoutBtn}
              onPress={async () => {
                await signOut();
                setIsAuthenticated(false);
              }}
            >
              <Text style={styles.logoutText}>CLOSE SESSION</Text>
            </Pressable>
          </View>

          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8fafc', paddingBottom: 100 },
  statusBar: { backgroundColor: '#10b981', paddingVertical: 8, alignItems: "center" },
  statusBarOffline: { backgroundColor: '#ef4444' },
  statusBarText: { color: "#fff", fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  title: { fontSize: 26, fontWeight: "900", color: "#0f172a", marginTop: 20 },
  tabRow: { flexDirection: "row", backgroundColor: '#e2e8f0', borderRadius: 16, padding: 4, marginTop: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 12 },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  tabTextActive: { color: "#0f172a" },
  startBtn: { backgroundColor: "#0f766e", padding: 18, borderRadius: 20, alignItems: "center", marginTop: 10 },
  startBtnText: { color: "#fff", fontWeight: "900", fontSize: 14, letterSpacing: 1 },
  bottomActions: { marginTop: 20, alignItems: "center", gap: 16 },
  vaultBtn: { width: '100%', backgroundColor: '#0ea5e9', height: 60, borderRadius: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, shadowColor: "#0ea5e9", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  vaultBtnText: { color: "#fff", fontWeight: "900", fontSize: 14, letterSpacing: 1 },
  logoutBtn: { padding: 12 },
  logoutText: { color: "#94a3b8", fontWeight: "800", fontSize: 11, letterSpacing: 1 },
  status: { color: "#0f766e", textAlign: "center", marginTop: 10, fontWeight: "700", fontSize: 12 },
  fab: { position: "absolute", bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, backgroundColor: "#0ea5e9", alignItems: "center", justifyContent: "center", shadowColor: "#0ea5e9", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  badgeCount: { position: "absolute", top: -5, right: -5, backgroundColor: "#ef4444", width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  badgeCountText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  simToggle: { backgroundColor: "#f1f5f9", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  simToggleActive: { backgroundColor: "#fef3c7", borderColor: "#f59e0b" },
  simToggleText: { fontSize: 10, fontWeight: "800", color: "#64748b" }
});
