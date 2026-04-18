import {
  copy,
} from "../constants";
import type {
  ForageAnalysisResponse,
  SelectedPoint,
  TerrainProfile,
} from "../types";
import { formatPoint } from "../../../utils/formatters";
import { evaluateWaterPotential } from "../../../utils/waterPotential";

function wait(durationMs: number) {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

function ensureValidPoint(point: SelectedPoint) {
  if (
    Number.isNaN(point.latitude) ||
    Number.isNaN(point.longitude) ||
    point.latitude < -90 ||
    point.latitude > 90 ||
    point.longitude < -180 ||
    point.longitude > 180
  ) {
    throw new Error("Les coordonnees choisies sont invalides.");
  }
}

function buildAnalysisId(point: SelectedPoint) {
  const latToken = Math.abs(Math.round(point.latitude * 100))
    .toString(36)
    .toUpperCase();
  const lngToken = Math.abs(Math.round(point.longitude * 100))
    .toString(36)
    .toUpperCase();

  return `AF-${Date.now().toString(36).toUpperCase()}-${latToken}${lngToken}`;
}

function getClimateBand(latitude: number) {
  const absoluteLatitude = Math.abs(latitude);

  if (absoluteLatitude < 23.5) {
    return "Zone chaude semi-aride";
  }

  if (absoluteLatitude < 36) {
    return "Zone mediterraneenne a recharge saisonniere";
  }

  if (absoluteLatitude < 50) {
    return "Zone temperee a recharge hivernale";
  }

  return "Zone temperee fraiche";
}

function getRechargeTrend(
  rechargeValue: number,
  probability: number,
  reliability: string
) {
  if (probability >= 72 && rechargeValue >= 0.62) {
    return "Recharge saisonniere favorable";
  }

  if (rechargeValue >= 0.5) {
    return "Recharge moyenne a surveiller";
  }

  if (reliability.includes("prudente")) {
    return "Recharge incertaine et diffuse";
  }

  return "Recharge faible";
}

function getDrillingRisk(probability: number, reliability: string) {
  if (probability >= 70 && reliability.includes("Bonne")) {
    return "Risque technique modere";
  }

  if (probability >= 50) {
    return "Risque economique moyen";
  }

  return "Risque eleve sans verification terrain";
}

function getRecommendedSeason(latitude: number, probability: number) {
  if (latitude >= 0) {
    return probability >= 60
      ? "Fin d'automne a debut printemps"
      : "Apres comparaison avec d'autres points proches";
  }

  return probability >= 60
    ? "Fin du printemps a debut hiver"
    : "Apres verification geophysique complementaire";
}

function createTerrainProfile(
  point: SelectedPoint,
  probability: number,
  reliability: string,
  rechargeValue: number
): TerrainProfile {
  return {
    climateBand: getClimateBand(point.latitude),
    rechargeTrend: getRechargeTrend(rechargeValue, probability, reliability),
    drillingRisk: getDrillingRisk(probability, reliability),
    recommendedSeason: getRecommendedSeason(point.latitude, probability),
  };
}

export async function requestForageAnalysis(
  point: SelectedPoint
): Promise<ForageAnalysisResponse> {
  ensureValidPoint(point);

  await wait(850);

  const report = evaluateWaterPotential(point.latitude, point.longitude);
  const rechargeSignal =
    report.signals.find((signal) => signal.label === "Recharge naturelle")?.value ??
    0;

  return {
    analysisId: buildAnalysisId(point),
    createdAt: new Date().toISOString(),
    backendMode: copy.offlineMode,
    engineLabel: copy.engineLabel,
    request: {
      point,
      source: "manual-selection",
    },
    terrainProfile: createTerrainProfile(
      point,
      report.probability,
      report.reliability,
      rechargeSignal
    ),
    report,
  };
}

export function buildHistoryLabel(point: SelectedPoint) {
  return formatPoint(point, 4);
}
