export type PatrolType = "land" | "water";

export type RoutePoint = {
  latitude: number;
  longitude: number;
  timestamp: string;
};

export type PatrolInsertInput = {
  patrol_type: PatrolType;
  start_time: string;
  route: RoutePoint[];
};

/** Matches the keys the web dashboard reads from incidents.ai_analysis. */
export type AiAnalysis = {
  threat_level: "low" | "medium" | "high" | "critical" | "pending";
  confidence_score: number;
  detected_objects: string[];
  ai_summary: string;
  /** ~300-word generated incident report (added on submit when online). */
  report?: string;
};

export type IncidentInsertInput = {
  patrol_id: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  created_at: string;
  ai_analysis?: AiAnalysis;
};

export type Vessel = {
  id: string;
  name: string;
  registration_number: string;
  vessel_type: string | null;
  status: "authorized" | "blacklisted" | "investigating";
  owner_info: string | null;
  last_sighted: string | null;
};

export type IncidentRecord = {
  id: string;
  type: string;
  description: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  ai_analysis: AiAnalysis | null;
  evidence?: { image_url: string }[];
};

export type PendingItem = {
  id?: string;
  timestamp?: string;
} & (
  | {
      kind: "patrol";
      payload: PatrolInsertInput;
    }
  | {
      kind: "incident";
      payload: IncidentInsertInput;
      imageUri?: string;
      imageBase64?: string;
      imageName?: string;
    }
);
