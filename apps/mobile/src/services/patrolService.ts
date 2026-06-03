import * as Location from "expo-location";
import { supabase } from "./supabase";
import { PatrolInsertInput, RoutePoint } from "../types/domain";

export async function getCurrentCoordinates() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error("Location permission not granted");
  }
  // Highest accuracy = the device's real GPS fix (not a coarse/cached estimate).
  // NOTE: on the iOS Simulator this returns the *simulated* location (Features →
  // Location); on a physical device it is the true GPS position.
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Highest,
    mayShowUserSettingsDialog: true,
  });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? null,
  };
}

export async function createPatrol(userId: string, payload: PatrolInsertInput) {
  const { data, error } = await supabase
    .from("patrols")
    .insert({
      user_id: userId,
      patrol_type: payload.patrol_type,
      start_time: payload.start_time,
      route: payload.route
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function updatePatrolRoute(patrolId: string, route: RoutePoint[]) {
  const { error } = await supabase
    .from("patrols")
    .update({ route })
    .eq("id", patrolId);
  if (error) throw error;
}

export async function endPatrol(patrolId: string, route: RoutePoint[]) {
  const { error } = await supabase
    .from("patrols")
    .update({ end_time: new Date().toISOString(), route })
    .eq("id", patrolId);
  if (error) throw error;
}
