import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Crosshair, FileText, Ship, Database, UserCircle2 } from "lucide-react-native";

import { LoginScreen } from "../screens/LoginScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { SecurityScreen } from "../screens/SecurityScreen";
import { MissionScreen } from "../screens/MissionScreen";
import { ReportsScreen } from "../screens/ReportsScreen";
import { VesselsScreen } from "../screens/VesselsScreen";
import { PendingDataScreen } from "../screens/PendingDataScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

import { supabase } from "../services/supabase";
import { signOut, OFFLINE_USER_KEY } from "../services/authService";
import { getPendingItems, syncPendingData } from "../store/offlineStore";
import { useConnectivity } from "../hooks/useConnectivity";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type as t, Palette } from "../theme";
import { useTheme } from "../theme/ThemeContext";

type AuthView = "login" | "signup";
type Tab = "mission" | "reports" | "vessels" | "vault" | "profile";

const TABS: { key: Tab; label: string; Icon: any }[] = [
  { key: "mission", label: "Mission", Icon: Crosshair },
  { key: "reports", label: "Reports", Icon: FileText },
  { key: "vessels", label: "Vessels", Icon: Ship },
  { key: "vault", label: "Vault", Icon: Database },
  { key: "profile", label: "Profile", Icon: UserCircle2 },
];

export function RootNavigator() {
  const { isOnline } = useConnectivity();
  const { colors } = useTheme();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [isLocked, setIsLocked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [tab, setTab] = useState<Tab>("mission");
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  const refreshPending = async () => setPendingCount((await getPendingItems()).length);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("username, full_name").eq("id", uid).maybeSingle();
    if (data) { setUserName(data.full_name || data.username); return; }
    const { data: sess } = await supabase.auth.getSession();
    const u = sess.session?.user;
    if (u?.id === uid && u.user_metadata) {
      setUserName(u.user_metadata.full_name || u.user_metadata.username || null);
    }
  };

  const initAuth = async () => {
    const { data, error } = await supabase.auth.getSession();
    
    if (error && (error.message.includes("Refresh Token") || error.status === 400 || error.message.includes("refresh_token"))) {
      console.log("[initAuth] Invalid session detected, clearing session storage:", error.message);
      await supabase.auth.signOut().catch(() => {});
      await AsyncStorage.removeItem(OFFLINE_USER_KEY).catch(() => {});
    }

    let active = Boolean(data?.session);
    let uid = data?.session?.user.id ?? null;
    if (!active) {
      const offlineId = await AsyncStorage.getItem(OFFLINE_USER_KEY);
      if (offlineId) { active = true; uid = offlineId; }
    }
    setIsAuthenticated(active);
    setUserId(uid);
    if (active && uid) { setIsLocked(true); fetchProfile(uid); }
  };

  useEffect(() => { initAuth(); void refreshPending(); }, []);
  useEffect(() => { if (userId) fetchProfile(userId); else setUserName(null); }, [userId]);

  // Auto-sync the vault once a real connection returns — but wait a few seconds
  // first so the link fully stabilizes. Flushing the instant we reconnect tends
  // to fail ("Network request failed") and skip AI analysis; the grace period
  // lets the AI analysis run and the evidence photos upload smoothly. If we go
  // offline again within the window, the timer is cancelled so nothing is lost.
  const SYNC_GRACE_MS = 6000;
  useEffect(() => {
    if (!(isOnline && !simulateOffline && userId)) return;
    const timer = setTimeout(() => {
      setIsAutoSyncing(true);
      syncPendingData(userId)
        .then((res) => { if (res.attempted > 0) refreshPending(); })
        .catch(() => {})
        .finally(() => setIsAutoSyncing(false));
    }, SYNC_GRACE_MS);
    return () => clearTimeout(timer);
  }, [isOnline, simulateOffline, userId]);

  // ---- Unauthenticated ----
  if (!isAuthenticated) {
    return authView === "login" ? (
      <LoginScreen onSignedIn={() => { setIsAuthenticated(true); void initAuth(); }} onGoToSignUp={() => setAuthView("signup")} />
    ) : (
      <SignupScreen onSignedUp={() => { setIsAuthenticated(true); void initAuth(); }} onBackToLogin={() => setAuthView("login")} />
    );
  }

  // ---- Locked (cold boot or connection lost) ----
  const connectionLost = !isOnline || simulateOffline;
  if (isLocked && connectionLost) {
    return (
      <SecurityScreen
        onUnlock={() => setIsLocked(false)}
        onLogout={async () => { await signOut(); setIsAuthenticated(false); setIsLocked(false); }}
      />
    );
  }

  const handleSignOut = async () => { await signOut(); setIsAuthenticated(false); setIsLocked(false); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ flex: 1 }}>
        {tab === "mission" && userId && (
          <MissionScreen
            userId={userId}
            userName={userName}
            isOnline={isOnline}
            simulateOffline={simulateOffline}
            setSimulateOffline={setSimulateOffline}
            onPendingChanged={refreshPending}
            onNavigateToReports={() => setTab("reports")}
          />
        )}
        {tab === "reports" && <ReportsScreen isOnline={isOnline} pendingCount={pendingCount} />}
        {tab === "vessels" && <VesselsScreen isOnline={isOnline && !simulateOffline} />}
        {tab === "vault" && userId && (
          <PendingDataScreen
            userId={userId}
            isOnline={isOnline && !simulateOffline}
            onChanged={refreshPending}
            isAutoSyncing={isAutoSyncing}
          />
        )}
        {tab === "profile" && userId && (
          <ProfileScreen userId={userId} userName={userName} isOnline={isOnline} pendingCount={pendingCount} onSignOut={handleSignOut} />
        )}
      </View>

      <TabBar tab={tab} setTab={setTab} pendingCount={pendingCount} />
    </View>
  );
}

function TabBar({ tab, setTab, pendingCount }: { tab: Tab; setTab: (t: Tab) => void; pendingCount: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map(({ key, label, Icon }) => {
        const active = key === tab;
        return (
          <Pressable key={key} style={styles.tabItem} onPress={() => setTab(key)}>
            <View>
              <Icon color={active ? colors.ink : colors.inkFaint} size={22} strokeWidth={active ? 2.4 : 2} />
              {key === "vault" && pendingCount > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{pendingCount > 9 ? "9+" : pendingCount}</Text></View>
              )}
            </View>
            <Text style={[t.caption, { color: active ? colors.ink : colors.inkFaint, letterSpacing: 0.2 }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface1,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: 10,
  },
  tabItem: { flex: 1, alignItems: "center", gap: 4 },
  badge: {
    position: "absolute", top: -6, right: -10,
    minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9,
    backgroundColor: colors.danger, alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
