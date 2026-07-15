import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { PatrolInsertInput, RoutePoint } from "../types/domain";

const ACCURACY_KEY = "gps_accuracy";

export async function getCurrentCoordinates() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error("Location permission not granted");
  }

  // Load the accuracy setting from AsyncStorage
  let accuracyOption = Location.Accuracy.Balanced;
  try {
    const stored = await AsyncStorage.getItem(ACCURACY_KEY);
    if (stored === "high") {
      accuracyOption = Location.Accuracy.High;
    } else if (stored === "highest") {
      accuracyOption = Location.Accuracy.Highest;
    } else if (stored === "balanced") {
      accuracyOption = Location.Accuracy.Balanced;
    }
  } catch (e) {
    console.warn("Failed to load GPS accuracy setting, defaulting to Balanced:", e);
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: accuracyOption,
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
