export type SelectedPoint = {
  latitude: number;
  longitude: number;
};

export type WorkflowStage =
  | "idle"
  | "selecting"
  | "selected"
  | "analyzing"
  | "completed";

export type WaterSignal = {
  label: string;
  value: number;
  color: string;
};

export type WaterPotentialReport = {
  probability: number;
  levelLabel: string;
  toneColor: string;
  summary: string;
  soilType: string;
  aquiferType: string;
  estimatedDepth: string;
  expectedYield: string;
  reliability: string;
  agriculturalUse: string;
  nextStep: string;
  notes: string[];
  signals: WaterSignal[];
};

export type ForageAnalysisRequest = {
  point: SelectedPoint;
  source: "manual-selection";
};

export type TerrainProfile = {
  climateBand: string;
  rechargeTrend: string;
  drillingRisk: string;
  recommendedSeason: string;
};

export type ForageAnalysisResponse = {
  analysisId: string;
  createdAt: string;
  backendMode: string;
  engineLabel: string;
  request: ForageAnalysisRequest;
  terrainProfile: TerrainProfile;
  report: WaterPotentialReport;
};

