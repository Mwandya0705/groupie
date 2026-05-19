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

export type IncidentInsertInput = {
  patrol_id: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  created_at: string;
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
    }
);
