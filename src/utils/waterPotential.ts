/**
 * Estimation locale du potentiel hydrique basée sur les coordonnées GPS.
 * Moteur heuristique de démonstration — ne remplace pas une étude géophysique réelle.
 */

interface WaterPotentialResult {
  probability: number;   // 0–100
  depthM: number;        // profondeur estimée en mètres
  flowLH: number;        // débit probable en L/h
  soilType: string;
  aquifer: string;
}

const SOIL_TYPES = [
  "Argilo-limoneux",
  "Sableux-argileux",
  "Alluvionnaire",
  "Grès calcaire",
  "Schiste fissuré",
  "Calcaire karstique",
];

const AQUIFER_TYPES = [
  "Nappe phréatique superficielle",
  "Aquifère fracturé",
  "Nappe alluviale",
  "Aquifère karstique",
  "Nappe captive profonde",
];

/** Pseudo-aléatoire déterministe basée sur les coordonnées */
function deterministicHash(lat: number, lng: number): number {
  const x = Math.sin(lat * 127.1 + lng * 311.7) * 43758.5453;
  return x - Math.floor(x); // 0..1
}

export function estimateWaterPotential(
  lat: number,
  lng: number
): WaterPotentialResult {
  const h1 = deterministicHash(lat, lng);
  const h2 = deterministicHash(lat + 1, lng + 1);
  const h3 = deterministicHash(lat * 2, lng * 3);

  // Probabilité: 20–90 %
  const probability = Math.round(20 + h1 * 70);

  // Profondeur: plus grande si probabilité faible
  const depthM = Math.round(10 + (1 - h1) * 60 + h2 * 20);

  // Débit: corrélé positivement à la probabilité
  const flowLH = Math.round(100 + h1 * 2400 + h2 * 500);

  const soilType = SOIL_TYPES[Math.floor(h2 * SOIL_TYPES.length)];
  const aquifer = AQUIFER_TYPES[Math.floor(h3 * AQUIFER_TYPES.length)];

  return { probability, depthM, flowLH, soilType, aquifer };
}
