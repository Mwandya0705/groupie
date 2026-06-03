import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
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

export async function deleteIncident(id: string) {
  const { error } = await supabase.from("incidents").delete().eq("id", id);
  if (error) throw error;
}

export async function shareReportAsDoc(reportText: string, filenamePrefix = "Incident_Report") {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("Sharing is not available on this device");
  }

  const cleanFilename = `${filenamePrefix}_${Date.now()}.doc`;
  const fileUri = `${FileSystem.cacheDirectory}${cleanFilename}`;

  // Build clean Word Document compatible HTML
  const docHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <title>IUU Incident Report</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 30px; }
    h1 { color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; font-size: 24pt; font-weight: bold; }
    h2 { color: #1e3a8a; margin-top: 30px; margin-bottom: 12px; font-size: 16pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; font-weight: bold; }
    p { margin-top: 0; margin-bottom: 14px; font-size: 11pt; }
    ul { margin-top: 0; margin-bottom: 14px; padding-left: 20px; }
    li { font-size: 11pt; margin-bottom: 6px; }
    strong { color: #0f172a; font-weight: bold; }
  </style>
</head>
<body>
  ${reportText
    .replace(/\r?\n/g, "<br/>")
    .replace(/### (.*?)(<br\/>|$)/g, "<h2>$1</h2>")
    .replace(/# (.*?)(<br\/>|$)/g, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
  }
</body>
</html>
  `.trim();

  await FileSystem.writeAsStringAsync(fileUri, docHtml, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(fileUri, {
    mimeType: "application/msword",
    dialogTitle: "Share / download report",
    UTI: "com.microsoft.word.doc",
  });
}
