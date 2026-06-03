import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Navigation2, Square } from "lucide-react-native";
import { Screen, Card, Txt, Eyebrow, Button, SegTabs, StatusBadge } from "../components";
import { PatrolRadar } from "./PatrolScreen";
import { IncidentScreen } from "./IncidentScreen";
import { createPatrol, endPatrol, getCurrentCoordinates, updatePatrolRoute } from "../services/patrolService";
import { addPendingItem } from "../store/offlineStore";
import { RoutePoint } from "../types/domain";
import { spacing } from "../theme";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  userId: string;
  userName: string | null;
  isOnline: boolean;
  simulateOffline: boolean;
  setSimulateOffline: (v: boolean) => void;
  onPendingChanged: () => void;
};

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Database connection timed out")), ms);
    p.then((r) => { clearTimeout(t); resolve(r); }).catch((e) => { clearTimeout(t); reject(e); });
  });
}

export function MissionScreen({ userId, userName, isOnline, simulateOffline, setSimulateOffline, onPendingChanged }: Props) {
  const { colors } = useTheme();
  const [patrolType, setPatrolType] = useState<"land" | "water">("land");
  const [activePatrolId, setActivePatrolId] = useState<string | null>(null);
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [status, setStatus] = useState("Ready to start");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeRef = useRef<RoutePoint[]>([]);

  const connectionLost = !isOnline || simulateOffline;

  const startPatrol = async () => {
    setStatus("Starting mission…");
    if (!connectionLost) {
      try {
        const id = await withTimeout(
          createPatrol(userId, { patrol_type: patrolType, start_time: new Date().toISOString(), route: [] }),
          12000
        );
        setActivePatrolId(id);
        setRoute([]); routeRef.current = [];
        setStatus("Patrol synchronised");
        return;
      } catch (err: any) {
        setStatus(`Cloud unavailable — running offline (${err?.message ?? "error"})`);
      }
    }
    const localId = `local_patrol_${Date.now()}`;
    setActivePatrolId(localId);
    setRoute([]); routeRef.current = [];
    setStatus(simulateOffline ? "SIMULATION MISSION ACTIVE" : "OFFLINE MISSION STARTED");
  };

  const startTracking = () => {
    setIsTracking(true);
    setStatus("Surveillance active…");
    timerRef.current = setInterval(async () => {
      try {
        const coords = await getCurrentCoordinates();
        const point: RoutePoint = { ...coords, timestamp: new Date().toISOString() };
        const next = [...routeRef.current, point];
        routeRef.current = next;
        setRoute(next);
        const isLocal = activePatrolId?.startsWith("local_") || activePatrolId?.startsWith("sim_");
        if (activePatrolId && !isLocal && !connectionLost) {
          await updatePatrolRoute(activePatrolId, next);
        }
      } catch {
        setStatus("GPS signal lost — retrying…");
      }
    }, 5000);
  };

  const stopMission = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTracking(false);
    setStatus("Finalising patrol…");
    const finalRoute = routeRef.current;
    const isLocal = activePatrolId?.startsWith("local_") || activePatrolId?.startsWith("sim_");
    try {
      if (activePatrolId && !isLocal && !connectionLost) {
        await endPatrol(activePatrolId, finalRoute);
      } else {
        // Local/offline patrol → vault it so it syncs later.
        await addPendingItem({
          id: activePatrolId ?? `sim_${Date.now()}`,
          kind: "patrol",
          payload: { patrol_type: patrolType, start_time: new Date().toISOString(), route: finalRoute },
        });
        onPendingChanged();
      }
      setStatus("Patrol complete");
    } catch {
      setStatus("Saved offline");
      await addPendingItem({
        id: activePatrolId ?? `sim_${Date.now()}`,
        kind: "patrol",
        payload: { patrol_type: patrolType, start_time: new Date().toISOString(), route: finalRoute },
      });
      onPendingChanged();
    }
    setActivePatrolId(null);
    setRoute([]); routeRef.current = [];
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View>
          <Eyebrow>{connectionLost ? "OFFLINE MODE" : "SECURE LINK"}</Eyebrow>
          <Txt variant="displayLg">Mission</Txt>
        </View>
        <Button
          label={simulateOffline ? "SIM ON" : "SIM OFF"}
          variant={simulateOffline ? "danger" : "ghost"}
          onPress={() => setSimulateOffline(!simulateOffline)}
          style={{ minHeight: 38, paddingHorizontal: spacing.md }}
        />
      </View>

      <Txt variant="body" color={colors.inkMuted}>
        Welcome, {userName || "Officer"}. {connectionLost ? "Reports vault locally and sync when reconnected." : "Live link to Command Center active."}
      </Txt>

      <Card surface={1} style={{ gap: spacing.md }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Eyebrow color={colors.inkMuted}>Patrol type</Eyebrow>
          <StatusBadge
            label={connectionLost ? "DISCONNECTED" : "ONLINE"}
            tone={connectionLost ? "danger" : "success"}
          />
        </View>

        <SegTabs
          options={[{ label: "Land patrol", value: "land" }, { label: "Water patrol", value: "water" }]}
          value={patrolType}
          onChange={(v) => !activePatrolId && setPatrolType(v)}
        />

        {!activePatrolId ? (
          <Button
            label={connectionLost ? "Start offline mission" : "Start new mission"}
            onPress={startPatrol}
            icon={<Navigation2 color={colors.onPrimary} size={18} />}
            full
          />
        ) : (
          <>
            <PatrolRadar active={isTracking} points={route.length} status={status} />
            {!isTracking ? (
              <Button label="Initiate tracking" variant="accent" onPress={startTracking} icon={<Navigation2 color="#fff" size={18} />} full />
            ) : (
              <Button label="End mission" variant="danger" onPress={stopMission} icon={<Square color="#fff" size={16} />} full />
            )}
          </>
        )}
      </Card>

      <IncidentScreen
        activePatrolId={activePatrolId}
        simulateOffline={simulateOffline}
        officer={userName}
        onReported={onPendingChanged}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
});
