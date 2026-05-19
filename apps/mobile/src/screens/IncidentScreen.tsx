import { useState } from "react";
import { Alert, ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { Sparkles, Zap, ImagePlus } from 'lucide-react-native';
import { createIncident, pickEvidenceImage, takePhoto, uploadEvidence } from "../services/incidentService";
import { addPendingItem } from "../store/offlineStore";
import { getCurrentCoordinates } from "../services/patrolService";

type Props = {
  activePatrolId: string | null;
  simulateOffline?: boolean;
};

const violationTypes = ["Illegal fishing", "Unauthorized vessel", "Gear violation", "Protected area intrusion"];

export function IncidentScreen({ activePatrolId, simulateOffline }: Props) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [type, setType] = useState(violationTypes[0]);
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const performAIAnalysis = async (uri: string) => {
    if (simulateOffline) {
      setAiAnalysis({
        threat_level: "pending",
        confidence: 0,
        objects: [],
        summary: "AI analytics Will be done when online"
      });
      return;
    }

    setIsAnalyzing(true);
    // Simulate complex AI processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const analysis = {
      threat_level: Math.random() > 0.7 ? "high" : "medium",
      confidence: 0.85 + Math.random() * 0.1,
      objects: ["Unauthorized Vessel", "Trawl Gear"],
      summary: "Potential illegal fishing activity detected with non-compliant gear usage in protected zone."
    };
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const selectImage = async () => {
    Alert.alert(
      "Evidence Image",
      "Choose a source",
      [
        {
          text: "Camera",
          onPress: async () => {
            try {
              const uri = await takePhoto();
              if (uri) {
                setImageUri(uri);
                performAIAnalysis(uri);
              }
            } catch (err: any) {
              Alert.alert("Permission Error", err.message);
            }
          }
        },
        {
          text: "Photo Library",
          onPress: async () => {
            const uri = await pickEvidenceImage();
            if (uri) {
              setImageUri(uri);
              performAIAnalysis(uri);
            }
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const submitIncident = async () => {
    if (!activePatrolId) {
      Alert.alert("Error", "Start a patrol first");
      return;
    }

    setLoading(true);

    try {
      // 1. Capture coordinates immediately while we have them
      const coords = await getCurrentCoordinates();
      const timestamp = new Date().toISOString();

      // 2. Decide if we should try a direct cloud push
      const shouldTryCloud = !simulateOffline;

      if (shouldTryCloud) {
        try {
          const payload = {
            patrol_id: activePatrolId,
            type,
            description,
            latitude: coords.latitude,
            longitude: coords.longitude,
            created_at: timestamp
          };
          
          const incidentId = await createIncident(payload);
          if (imageUri) {
            await uploadEvidence(incidentId, imageUri);
          }
          
          Alert.alert("Success", "Incident reported successfully");
          resetForm();
          setLoading(false);
          return;
        } catch (cloudError) {
          console.log("Cloud push failed, falling back to offline vault:", cloudError);
          // Don't return, fall through to offline logic
        }
      }

      // 3. Offline Logic (either simulateOffline was true, or cloud push failed)
      await addPendingItem({
        id: `local_incident_${Date.now()}`,
        kind: "incident",
        payload: {
          patrol_id: activePatrolId,
          type,
          description,
          latitude: coords.latitude,
          longitude: coords.longitude,
          created_at: timestamp
        },
        imageUri: imageUri ?? undefined
      });
      
      Alert.alert(
        simulateOffline ? "Saved to Vault" : "Connection Unstable", 
        "Incident saved securely in Mission Vault. It will sync automatically once a stable link is restored."
      );
      resetForm();
    } catch (err) {
      Alert.alert("Critical Error", "Failed to process incident: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription("");
    setImageUri(null);
    setAiAnalysis(null);
  };

  return (
    <View style={[styles.container, isLargeScreen && styles.containerLarge]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Incident Reporting</Text>
        <Sparkles color="#8b5cf6" size={20} />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Violation type</Text>
        <View style={styles.row}>
          {violationTypes.map((value) => (
            <Pressable 
              key={value} 
              style={[
                styles.choice, 
                value === type && styles.choiceActive,
                isLargeScreen && { paddingHorizontal: 16, paddingVertical: 10 }
              ]} 
              onPress={() => setType(value)}
            >
              <Text style={[styles.choiceText, value === type && styles.choiceTextActive]}>
                {value}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {imageUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          {isAnalyzing && (
            <View style={styles.aiOverlay}>
               <ActivityIndicator color="#fff" />
               <Text style={styles.aiOverlayText}>AI ANALYZING...</Text>
            </View>
          )}
          <Pressable style={styles.removeImage} onPress={() => { setImageUri(null); setAiAnalysis(null); }}>
            <Text style={styles.removeImageText}>Remove</Text>
          </Pressable>
        </View>
      )}

      {imageUri && aiAnalysis && (
        <View style={styles.aiResultBox}>
          <View style={styles.aiHeader}>
            <View style={styles.aiPulse} />
            <Text style={styles.aiTitle}>AI INTELLIGENCE BRIEFING</Text>
          </View>
          
          <Text style={styles.aiSummary}>{aiAnalysis.summary}</Text>
          
          <View style={styles.aiGrid}>
             <View style={styles.aiStat}>
                <Text style={styles.aiStatLabel}>THREAT LEVEL</Text>
                <Text style={[styles.aiStatValue, { color: aiAnalysis.threat_level === 'high' ? '#ef4444' : '#f59e0b' }]}>
                  {aiAnalysis.threat_level.toUpperCase()}
                </Text>
             </View>
             <View style={styles.aiStat}>
                <Text style={styles.aiStatLabel}>AI CONFIDENCE</Text>
                <Text style={styles.aiStatValue}>
                  {aiAnalysis.threat_level === 'pending' ? "DEFERRED" : `${(aiAnalysis.confidence * 100).toFixed(1)}%`}
                </Text>
             </View>
          </View>

          {aiAnalysis.objects.length > 0 && (
            <View style={styles.objectsList}>
              {aiAnalysis.objects.map((obj: string) => (
                <View key={obj} style={styles.objectTag}>
                  <Zap size={10} color="#38bdf8" />
                  <Text style={styles.objectTagText}>{obj}</Text>
                </View>
              ))}
            </View>
          )}

          {aiAnalysis.threat_level === 'pending' && (
             <View style={styles.objectTag}>
                <Zap size={10} color="#94a3b8" />
                <Text style={[styles.objectTagText, { color: "#94a3b8" }]}>Synchronize to Process AI Intelligence</Text>
             </View>
          )}
        </View>
      )}

      <TextInput
        placeholder="Describe the incident details..."
        multiline
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholderTextColor="#94a3b8"
      />
      
      <View style={[styles.buttonGroup, isLargeScreen && styles.buttonGroupLarge]}>
        <Pressable 
          style={[styles.button, styles.outlineButton, isLargeScreen && { flex: 1 }]} 
          onPress={selectImage}
          disabled={loading || isAnalyzing}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ImagePlus color="#1d4ed8" size={18} />
            <Text style={styles.outlineButtonText}>{imageUri ? "Change photo" : "Add evidence photo"}</Text>
          </View>
        </Pressable>
        <Pressable 
          style={[styles.button, styles.submit, isLargeScreen && { flex: 2 }]} 
          onPress={submitIncident}
          disabled={loading || isAnalyzing}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Publish Report</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, marginTop: 18, backgroundColor: "#fff", padding: 16, borderRadius: 20, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  containerLarge: { padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { fontSize: 20, fontWeight: "800", color: "#0f172a", letterSpacing: -0.5 },
  section: { gap: 8 },
  label: { fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: "#f8fafc" },
  choiceActive: { backgroundColor: "#0f766e", borderColor: "#0f766e" },
  choiceText: { color: "#475569", fontSize: 13, fontWeight: "600" },
  choiceTextActive: { color: "#fff" },
  previewContainer: { position: "relative", marginBottom: 4, borderRadius: 16, overflow: "hidden" },
  previewImage: { width: "100%", height: 220, backgroundColor: "#f1f5f9" },
  aiOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.7)', alignItems: "center", justifyContent: "center" },
  aiOverlayText: { color: "#fff", marginTop: 8, fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  removeImage: { position: "absolute", top: 12, right: 12, backgroundColor: "rgba(15, 23, 42, 0.8)", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  removeImageText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  aiResultBox: { backgroundColor: "#0f172a", padding: 20, borderRadius: 20, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: "#38bdf8", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  aiPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#38bdf8" },
  aiTitle: { fontSize: 11, fontWeight: "900", color: "#38bdf8", letterSpacing: 2 },
  aiSummary: { fontSize: 15, color: "#f1f5f9", fontWeight: "500", lineHeight: 22, opacity: 0.9 },
  aiGrid: { flexDirection: "row", gap: 16, marginTop: 18, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", paddingTop: 16 },
  aiStat: { flex: 1, gap: 4 },
  aiStatLabel: { fontSize: 9, fontWeight: "800", color: "#64748b", letterSpacing: 1 },
  aiStatValue: { fontSize: 16, fontWeight: "900", color: "#fff" },
  objectsList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  objectTag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(56, 189, 248, 0.1)", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  objectTagText: { fontSize: 10, fontWeight: "700", color: "#38bdf8" },
  input: { borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 14, padding: 16, backgroundColor: "#fff", fontSize: 15, color: "#0f172a" },
  multiline: { minHeight: 120, textAlignVertical: "top" },
  buttonGroup: { gap: 12 },
  buttonGroupLarge: { flexDirection: "row" },
  button: { padding: 16, borderRadius: 14, alignItems: "center", justifyContent: "center", minHeight: 56 },
  outlineButton: { borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#fff" },
  outlineButtonText: { color: "#1d4ed8", fontWeight: "700", fontSize: 14 },
  submit: { backgroundColor: "#0f766e" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 }
});
