import { z } from "zod";

export const patrolTypeSchema = z.enum(["land", "water"]);
export type PatrolType = z.infer<typeof patrolTypeSchema>;

export const routePointSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timestamp: z.string()
});
export type RoutePoint = z.infer<typeof routePointSchema>;

export const incidentSchema = z.object({
  type: z.string().min(2),
  description: z.string().min(3),
  latitude: z.number(),
  longitude: z.number()
});
export type IncidentInput = z.infer<typeof incidentSchema>;

export type DashboardStats = {
  totalPatrols: number;
  totalIncidents: number;
  mostCommonViolation: string;
};
