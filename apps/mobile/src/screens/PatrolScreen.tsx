import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, Animated, Easing } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Radio, Navigation2, LogOut, Zap, Activity } from 'lucide-react-native';
import { endPatrol, getCurrentCoordinates, updatePatrolRoute } from "../services/patrolService";
import { RoutePoint } from "../types/domain";

type Props = {
  activePatrolId: string | null;
  userName?: string;
  setRoute: (route: RoutePoint[]) => void;
  route: RoutePoint[];
  onEndPatrol: () => Promise<void>;
  simulateOffline?: boolean;
};

export function PatrolScreen({ activePatrolId, userName, route, setRoute, onEndPatrol, simulateOffline }: Props) {
  const [isTracking, setIsTracking] = useState(false);
  const [status, setStatus] = useState("Ready to start");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isTracking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isTracking]);

  const startTracking = async () => {
    setIsTracking(true);
    setStatus("Surveillance active...");
    timerRef.current = setInterval(async () => {
      try {
        const coords = await getCurrentCoordinates();
        const point: RoutePoint = { ...coords, timestamp: new Date().toISOString() };
        const nextRoute = [...route, point];
        setRoute(nextRoute);
        
        const isLocalPatrol = activePatrolId?.startsWith('local_') || activePatrolId?.startsWith('sim_');
        if (activePatrolId && !isLocalPatrol && !simulateOffline) {
          await updatePatrolRoute(activePatrolId, nextRoute);
        }
      } catch {
        setStatus("GPS signal lost");
      }
    }, 5000);
  };

  const stopTracking = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTracking(false);
    setStatus("Finalizing patrol...");
    try {
      const isLocalPatrol = activePatrolId?.startsWith('local_') || activePatrolId?.startsWith('sim_');
      if (activePatrolId && !isLocalPatrol && !simulateOffline) {
        await endPatrol(activePatrolId, route);
      }
      await onEndPatrol();
      setStatus("Patrol complete");
    } catch (err) {
      console.error(err);
      setStatus("Saved offline");
      await onEndPatrol();
    }
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.iconContainer}>
            <Shield color="#38bdf8" size={24} />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.heading}>Welcome, {userName || "Guest"}</Text>
            <Text style={styles.subheading}>{isTracking ? "ENCRYPTED FEED" : "STANDBY MODE"}</Text>
          </View>
        </View>
        <Activity color={isTracking ? "#38bdf8" : "#475569"} size={20} />
      </View>
      
      <View style={styles.radarContainer}>
        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], opacity: isTracking ? 0.2 : 0 }]} />
        <View style={styles.mainCircle}>
           <Radio color={isTracking ? "#38bdf8" : "#94a3b8"} size={48} />
        </View>
        <View style={styles.statsLayout}>
           <View style={styles.radarStat}>
              <Text style={styles.radarLabel}>GPS POINTS</Text>
              <Text style={styles.radarValue}>{route.length}</Text>
           </View>
           <View style={styles.radarStat}>
              <Text style={styles.radarLabel}>LOCK STATUS</Text>
              <Text style={[styles.radarValue, { color: isTracking ? "#10b981" : "#f59e0b" }]}>{isTracking ? "LOCKED" : "IDLE"}</Text>
           </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.statusText}>{status}</Text>
        
        {!isTracking ? (
          <Pressable 
            style={[styles.mainButton, !activePatrolId && styles.buttonDisabled]} 
            onPress={startTracking} 
            disabled={!activePatrolId}
          >
            <LinearGradient 
              colors={['#0ea5e9', '#0369a1']} 
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Navigation2 color="#fff" size={20} />
              <Text style={styles.buttonText}>INITIATE TRACKING</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable style={styles.mainButton} onPress={stopTracking}>
            <LinearGradient 
              colors={['#ef4444', '#991b1b']} 
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <LogOut color="#fff" size={20} />
              <Text style={styles.buttonText}>END MISSION</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, borderRadius: 24, marginVertical: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 },
  iconContainer: { backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: 12, borderRadius: 16 },
  heading: { fontSize: 22, fontWeight: "800", color: "#f8fafc", letterSpacing: -0.5 },
  subheading: { fontSize: 10, fontWeight: "900", color: "#38bdf8", letterSpacing: 2, marginTop: 2 },
  radarContainer: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 300 },
  pulseCircle: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "#38bdf8", borderWidth: 1, borderColor: "#38bdf8" },
  mainCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: "center", justifyContent: "center", shadowColor: "#38bdf8", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 20 },
  statsLayout: { flexDirection: "row", width: "100%", justifyContent: "space-around", marginTop: 40 },
  radarStat: { alignItems: "center" },
  radarLabel: { fontSize: 9, fontWeight: "900", color: "#64748b", letterSpacing: 1.5, marginBottom: 4 },
  radarValue: { fontSize: 18, fontWeight: "800", color: "#f1f5f9" },
  footer: { marginTop: "auto" },
  statusText: { textAlign: "center", color: "#94a3b8", fontSize: 13, marginBottom: 20, fontWeight: "500" },
  mainButton: { height: 64, borderRadius: 20, overflow: "hidden", shadowColor: "#0ea5e9", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 },
  buttonGradient: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 14, letterSpacing: 1.5 }
});
