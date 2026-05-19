import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";
import { IncidentInsertInput } from "../types/domain";

export async function pickEvidenceImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function takePhoto() {
  const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
  if (!cameraPermission.granted) {
    throw new Error("Camera permission is required");
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.8
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function createIncident(input: IncidentInsertInput) {
  const { data, error } = await supabase.from("incidents").insert(input).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function uploadEvidence(incidentId: string, imageUri: string) {
  try {
    const fileName = `${Date.now()}.jpg`;
    const filePath = `${incidentId}/${fileName}`;

    // On mobile, FormData is often more reliable for file uploads to Supabase
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      name: fileName,
      type: "image/jpeg"
    } as any);

    const { error: storageError } = await supabase.storage
      .from("evidence")
      .upload(filePath, formData, { contentType: "image/jpeg", upsert: false });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      throw storageError;
    }

    const { data } = supabase.storage.from("evidence").getPublicUrl(filePath);

    const { error: dbError } = await supabase.from("evidence").insert({
      incident_id: incidentId,
      image_url: data.publicUrl
    });

    if (dbError) {
      console.error("Database insert error:", dbError);
      throw dbError;
    }

    return data.publicUrl;
  } catch (err) {
    console.error("Upload evidence failed:", err);
    throw err;
  }
}
