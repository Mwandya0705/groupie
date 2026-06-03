import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import { supabase } from "./supabase";
import { IncidentInsertInput, IncidentRecord } from "../types/domain";

export type PickedImage = { uri: string; base64?: string; name?: string };

/** Recent incidents (newest first) — feeds the mobile "Reports" screen. */
export async function fetchRecentIncidents(limit = 30): Promise<IncidentRecord[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("id,type,description,latitude,longitude,created_at,ai_analysis,evidence(image_url)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as IncidentRecord[];
}

/**
 * Opens the native file browser (Files app on iOS / file manager on Android).
 * The user can navigate into ANY folder — Downloads, iCloud Drive, OneDrive,
 * Google Drive, etc. — and select an image from there.
 */
export async function pickEvidenceFile(): Promise<PickedImage | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["image/*"],   // limit selection to images only
    copyToCacheDirectory: true, // ensures the URI is readable by the app
    multiple: false,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) return null;

  // Read the file as base64 so we can upload it to Supabase Storage
  const base64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return { uri: asset.uri, base64, name: asset.name };
}

/** Original photo-library picker (kept for camera roll option) */
export async function pickEvidenceImage(): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.5,
    base64: true,
  });
  if (result.canceled) return null;
  const a = result.assets[0];
  return { uri: a.uri, base64: a.base64 ?? undefined };
}

export async function takePhoto(): Promise<PickedImage | null> {
  const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
  if (!cameraPermission.granted) {
    throw new Error("Camera permission is required");
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.5,
    base64: true,
  });
  if (result.canceled) return null;
  const a = result.assets[0];
  return { uri: a.uri, base64: a.base64 ?? undefined };
}

export async function createIncident(input: IncidentInsertInput) {
  const { data, error } = await supabase.from("incidents").insert(input).select("id").single();
  if (error) throw error;
  return data.id as string;
}

/**
 * Reliable evidence upload for React Native: decode base64 → bytes and upload
 * raw bytes (FormData uploads are flaky on Expo and often produce 0-byte files).
 * Accepts an optional originalName so the correct extension/MIME type is preserved
 * when the file was picked from the device's file manager (not just the photo library).
 */
export async function uploadEvidence(
  incidentId: string,
  base64: string,
  originalName?: string,
) {
  // Derive extension and MIME type from the original filename if available
  const ext = originalName?.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
    gif: "image/gif",
    bmp: "image/bmp",
  };
  const contentType = mimeMap[ext] ?? "image/jpeg";
  const fileName = `${Date.now()}.${ext}`;
  const filePath = `${incidentId}/${fileName}`;
  const bytes = Buffer.from(base64, "base64");

  const { error: storageError } = await supabase.storage
    .from("evidence")
    .upload(filePath, bytes, { contentType, upsert: false });
  if (storageError) throw storageError;

  const { data } = supabase.storage.from("evidence").getPublicUrl(filePath);

  const { error: dbError } = await supabase
    .from("evidence")
    .insert({ incident_id: incidentId, image_url: data.publicUrl });
  if (dbError) throw dbError;

  return data.publicUrl;
}
