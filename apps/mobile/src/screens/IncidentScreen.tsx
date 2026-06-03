import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ImagePlus, Sparkles, Zap } from "lucide-react-native";
import { createIncident, pickEvidenceImage, pickEvidenceFile, takePhoto, uploadEvidence, PickedImage } from "../services/incidentService";
import { getCurrentCoordinates } from "../services/patrolService";
import { addPendingItem } from "../store/offlineStore";
import { analyseEvidence, generateReport, pendingAnalysis } from "../services/aiService";
import { AiAnalysis } from "../types/domain";
import { Card, Txt, Eyebrow, Button, Chip, StatusBadge } from "../components";
import { radius, spacing, type as typo, Palette } from "../theme";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  activePatrolId: string | null;
  simulateOffline?: boolean;
  officer?: string | null;
  onReported?: () => void;
};

const violationTypes = ["Illegal fishing", "Unauthorized vessel", "Gear violation", "Protected area intrusion"];

/** A DB/logic error carries a Postgrest `code`; a true network failure does not. */
function isNetworkError(e: any): boolean {
  if (e?.code) return false;
  const m = String(e?.message || "").toLowerCase();
  return (
    e?.name === "AbortError" ||
    m.includes("network request failed") ||
    m.includes("failed to fetch") ||
    m.includes("timeout") ||
    m.includes("timed out")
  );
}

export function IncidentScreen({ activePatrolId, simulateOffline, officer, onReported }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [type, setType] = useState(violationTypes[0]);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<PickedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = async (img: PickedImage) => {
    if (simulateOffline) {
      setAnalysis(pendingAnalysis());
      return;
    }
    setIsAnalyzing(true);
    try {
      setAnalysis(await analyseEvidence({ type, description, imageBase64: img.base64 }));
    } catch (e) {
      console.log("analysis failed:", e);
      setAnalysis(pendingAnalysis());
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectImage = () => {
    Alert.alert("Evidence image", "Choose a source", [
      {
        text: "Camera",
        onPress: async () => {
          try {
            const img = await takePhoto();
            if (img) { setImage(img); runAnalysis(img); }
          } catch (err: any) {
            Alert.alert("Permission error", err.message);
          }
        },
      },
      {
        text: "Photo library",
        onPress: async () => {
          const img = await pickEvidenceImage();
          if (img) { setImage(img); runAnalysis(img); }
        },
      },
      {
        text: "Browse files / folders",
        onPress: async () => {
          try {
            const img = await pickEvidenceFile();
            if (img) { setImage(img); runAnalysis(img); }
          } catch (err: any) {
            Alert.alert("File error", err.message);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const resetForm = () => {
    setDescription("");
    setImage(null);
    setAnalysis(null);
  };

  const vault = async (payload: any) => {
    await addPendingItem({
      kind: "incident",
      payload,
      imageUri: image?.uri,
      imageBase64: image?.base64,
      imageName: image?.name,
    });
    onReported?.();
  };

  const submitIncident = async () => {
    if (!activePatrolId) {
      Alert.alert("No active mission", "Start a patrol before reporting an incident.");
      return;
    }
    setLoading(true);
    try {
      const coords = await getCurrentCoordinates();
      const created_at = new Date().toISOString();
      const isLocalPatrol = activePatrolId.startsWith("local_") || activePatrolId.startsWith("sim_");

      // Offline, or the patrol itself was created offline → vault (with image) for later sync.
      if (simulateOffline || isLocalPatrol) {
        await vault({
          patrol_id: activePatrolId,
          type, description,
          latitude: coords.latitude, longitude: coords.longitude,
          created_at,
          ai_analysis: pendingAnalysis(),
        });
        Alert.alert(
          "Saved to vault",
          isLocalPatrol && !simulateOffline
            ? "This patrol started offline, so the report is vaulted and will sync (with AI analysis) once the patrol uploads."
            : "Offline — report stored securely and will sync automatically when you reconnect."
        );
        resetForm();
        return;
      }

      // Online + real patrol → run AI, generate report, then post.
      let ai: AiAnalysis = analysis ?? pendingAnalysis();
      if (ai.threat_level === "pending") {
        try {
          ai = await analyseEvidence({ type, description, latitude: coords.latitude, longitude: coords.longitude, imageBase64: image?.base64 });
        } catch (e) { console.log("analysis skipped:", e); }
      }
      // Report generation is best-effort — never blocks posting.
      let reportText: string | undefined;
      try {
        reportText = await generateReport({
          type, description, latitude: coords.latitude, longitude: coords.longitude,
          analysis: ai, officer: officer ?? undefined,
        });
        ai = { ...ai, report: reportText };
      } catch (e) { console.log("report generation skipped:", e); }

      let incidentId: string;
      try {
        incidentId = await createIncident({
          patrol_id: activePatrolId,
          type, description,
          latitude: coords.latitude, longitude: coords.longitude,
          created_at, ai_analysis: ai,
        });
      } catch (e: any) {
        // Posting failed — vault as backup, but tell the user the REAL reason.
        await vault({
          patrol_id: activePatrolId, type, description,
          latitude: coords.latitude, longitude: coords.longitude,
          created_at, ai_analysis: ai,
        });
        if (isNetworkError(e)) {
          Alert.alert("Connection lost", "Report saved to vault — it will sync automatically when you're back online.");
        } else {
          Alert.alert("Could not post report", `${e?.message || e}\n\nSaved to vault as a backup.`);
        }
        resetForm();
        return;
      }

      // Incident is in the DB. Evidence upload is decoupled (don't lose the report if the photo fails).
      let photoWarning = false;
      if (image?.base64) {
        try { await uploadEvidence(incidentId, image.base64, image.name); }
        catch (e) { console.log("evidence upload failed:", e); photoWarning = true; }
      }

      onReported?.();
      resetForm();
      Alert.alert(
        "Report published",
        "Posted to the Command Center dashboard. View, share or download the doc report in the Reports tab." +
          (photoWarning ? "\n\nNote: the evidence photo failed to upload — you can re-attach and resubmit." : "")
      );
    } catch (err: any) {
      Alert.alert("Error", "Failed to process incident: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <Txt variant="headline">Report incident</Txt>
        <Sparkles color={colors.accent} size={20} />
      </View>

      <Eyebrow color={colors.inkMuted}>Violation type</Eyebrow>
      <View style={styles.chips}>
        {violationTypes.map((v) => (
          <Chip key={v} label={v} active={v === type} onPress={() => setType(v)} />
        ))}
      </View>

      {image && (
        <View style={styles.preview}>
          <Image source={{ uri: image.uri }} style={styles.previewImg} />
          {isAnalyzing && (
            <View style={styles.aiOverlay}>
              <ActivityIndicator color="#fff" />
              <Text style={[typo.eyebrow, { color: "#fff", marginTop: 6 }]}>AI ANALYSING…</Text>
            </View>
          )}
          <Pressable style={styles.removeImg} onPress={() => { setImage(null); setAnalysis(null); }}>
            <Text style={[typo.caption, { color: "#fff" }]}>Remove</Text>
          </Pressable>
        </View>
      )}

      {analysis && (
        <View style={styles.aiBox}>
          <View style={styles.aiHead}>
            <View style={styles.aiDot} />
            <Eyebrow>AI INTELLIGENCE BRIEFING</Eyebrow>
          </View>
          <Txt variant="body" style={{ marginTop: spacing.xs }}>{analysis.ai_summary}</Txt>

          <View style={styles.aiGrid}>
            <View style={{ flex: 1, gap: 2 }}>
              <Eyebrow color={colors.inkMuted}>THREAT LEVEL</Eyebrow>
              <StatusBadge
                label={analysis.threat_level.toUpperCase()}
                tone={analysis.threat_level === "high" || analysis.threat_level === "critical" ? "danger"
                  : analysis.threat_level === "pending" ? "neutral" : "warning"}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Eyebrow color={colors.inkMuted}>CONFIDENCE</Eyebrow>
              <Txt variant="headline">
                {analysis.threat_level === "pending" ? "DEFERRED" : `${(analysis.confidence_score * 100).toFixed(1)}%`}
              </Txt>
            </View>
          </View>

          {analysis.detected_objects.length > 0 && (
            <View style={styles.tags}>
              {analysis.detected_objects.map((o) => (
                <View key={o} style={styles.tag}>
                  <Zap size={11} color={colors.accent} />
                  <Text style={[typo.caption, { color: colors.accent }]}>{o}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <TextInput
        placeholder="Describe the incident details…"
        placeholderTextColor={colors.inkFaint}
        multiline
        style={styles.input}
        value={description}
        onChangeText={setDescription}
      />

      <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
        <Button
          label={image ? "Change photo" : "Add evidence photo"}
          variant="secondary"
          onPress={selectImage}
          disabled={loading || isAnalyzing}
          icon={<ImagePlus color={colors.ink} size={18} />}
          full
        />
        <Button label="Publish report" onPress={submitIncident} loading={loading} disabled={isAnalyzing} full />
      </View>
    </Card>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs, marginBottom: spacing.sm },
  preview: { borderRadius: radius.lg, overflow: "hidden", marginBottom: spacing.sm },
  previewImg: { width: "100%", height: 200, backgroundColor: colors.surface2 },
  aiOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(9,9,9,0.7)", alignItems: "center", justifyContent: "center" },
  removeImg: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(9,9,9,0.8)", paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.md },
  aiBox: { backgroundColor: colors.surface2, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.accent },
  aiHead: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  aiGrid: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: spacing.md },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md },
  tag: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.pill },
  reportBox: { backgroundColor: colors.surface2, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.success },
  input: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 110,
    textAlignVertical: "top",
    color: colors.ink,
    fontSize: 15,
    letterSpacing: -0.15,
  },
});
