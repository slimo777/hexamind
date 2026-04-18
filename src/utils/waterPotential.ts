import type { WaterPotentialReport } from "../features/forage/types";

const TONE_COLORS = {
  low: "#C55D3D",
  medium: "#D09A35",
  high: "#3A8B60",
  veryHigh: "#176F4A",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function roundTo(value: number, digits: number) {
  return Number(value.toFixed(digits));
}

function getLevel(probability: number) {
  if (probability >= 76) {
    return { label: "Tres favorable", color: TONE_COLORS.veryHigh };
  }

  if (probability >= 58) {
    return { label: "Prometteur", color: TONE_COLORS.high };
  }

  if (probability >= 40) {
    return { label: "Moyen", color: TONE_COLORS.medium };
  }

  return { label: "Faible", color: TONE_COLORS.low };
}

function getReliability(reliabilityPercentage: number) {
  if (reliabilityPercentage >= 78) {
    return "Bonne fiabilite";
  }

  if (reliabilityPercentage >= 60) {
    return "Fiabilite moyenne";
  }

  return "Lecture prudente";
}

function getSoilType(
  recharge: number,
  infiltration: number,
  fracture: number,
  aridity: number,
  stability: number
) {
  if (recharge > 0.68 && infiltration > 0.64) {
    return "Sol alluvial limono-sableux";
  }

  if (aridity > 0.62 && fracture > 0.57) {
    return "Sol caillouteux semi-aride fracture";
  }

  if (stability > 0.66) {
    return "Sol argilo-limoneux compact";
  }

  if (infiltration > 0.56) {
    return "Sol sableux a permeabilite moyenne";
  }

  return "Sol mixte limono-caillouteux";
}

function getAquiferType(
  recharge: number,
  infiltration: number,
  fracture: number,
  aridity: number
) {
  if (recharge > 0.7 && infiltration > 0.62) {
    return "Nappe alluviale peu profonde";
  }

  if (fracture > 0.68) {
    return "Aquifere fissure semi-profond";
  }

  if (aridity > 0.55 && recharge < 0.48) {
    return "Aquifere discontinu en zone seche";
  }

  return "Nappe mixte locale";
}

function getAgriculturalUse(probability: number, yieldMax: number) {
  if (probability >= 70 && yieldMax >= 8) {
    return "Adapte au goutte-a-goutte, arboriculture et maraichage intensif.";
  }

  if (probability >= 52 && yieldMax >= 5) {
    return "Compatible avec olivier, legumes et irrigation localisee.";
  }

  return "A reserver a un usage raisonne et des cultures economes en eau.";
}

function getNextStep(probability: number) {
  if (probability >= 70) {
    return "Faire un sondage electrique vertical puis un test de pompage avant le forage final.";
  }

  if (probability >= 45) {
    return "Comparer ce point avec 2 ou 3 points voisins avant de forer.";
  }

  return "Tester une zone plus basse topographiquement ou proche d'un axe de drainage.";
}

function getSummary(
  probability: number,
  recharge: number,
  fracture: number,
  aridity: number
) {
  if (probability >= 76) {
    return "Les indices de recharge et de fracturation convergent bien sur ce point, ce qui en fait une cible interessante pour un forage exploratoire.";
  }

  if (probability >= 58) {
    return "Le point semble prometteur avec un sous-sol assez receptif, mais une confirmation geophysique reste recommandee.";
  }

  if (probability >= 40) {
    return "Le potentiel existe, mais l'equilibre entre infiltration et continuites profondes reste moyen.";
  }

  if (aridity > 0.55 && recharge < 0.5) {
    return "Le contexte parait sec et la recharge naturelle reste limitee, ce qui augmente le risque economique d'un forage.";
  }

  if (fracture < 0.42) {
    return "Le sous-sol semble peu fracture et pourrait offrir peu de circulation d'eau souterraine.";
  }

  return "Les signaux simules restent disperses, avec un niveau d'incertitude eleve pour un forage direct.";
}

export function evaluateWaterPotential(
  latitude: number,
  longitude: number
): WaterPotentialReport {
  const latRad = toRadians(latitude);
  const lngRad = toRadians(longitude);

  const aridity = clamp(
    Math.exp(-Math.pow((Math.abs(latitude) - 27) / 11, 2)),
    0,
    1
  );

  const recharge = clamp(
    0.46 +
      0.16 * Math.sin(latRad * 2.4) +
      0.18 * Math.cos((latRad - lngRad) * 1.6) -
      0.14 * aridity +
      0.08 * Math.sin(lngRad * 3.1),
    0.14,
    0.92
  );

  const fracture = clamp(
    0.42 +
      0.19 * Math.cos((latRad + lngRad) * 2.9) +
      0.17 * Math.sin(lngRad * 4.7) +
      0.09 * Math.sin(latRad * 5.3),
    0.18,
    0.94
  );

  const infiltration = clamp(
    0.36 +
      0.24 * Math.cos(latRad * 1.8) +
      0.18 * Math.sin((lngRad - latRad) * 2.4) +
      0.1 * (1 - aridity),
    0.16,
    0.9
  );

  const stability = clamp(
    0.44 +
      0.18 * Math.cos(lngRad * 2.1) -
      0.08 * aridity +
      0.14 * Math.sin(latRad * 3.4),
    0.18,
    0.9
  );

  const coherence = clamp(
    1 - Math.abs(recharge - infiltration) * 0.72 - Math.abs(fracture - stability) * 0.28,
    0.35,
    0.94
  );

  const rawScore =
    recharge * 0.34 +
    fracture * 0.28 +
    infiltration * 0.22 +
    stability * 0.16;

  const probability = Math.round(
    clamp(24 + rawScore * 68 - aridity * 8 + coherence * 11, 15, 93)
  );

  const reliabilityPercentage = Math.round(clamp(coherence * 100, 38, 92));

  const depthBase =
    18 +
    (1 - recharge) * 36 +
    (1 - fracture) * 26 +
    aridity * 20;

  const depthMin = Math.round(clamp(depthBase, 12, 120));
  const depthMax = Math.round(
    clamp(depthBase + 18 + stability * 22, depthMin + 12, 160)
  );

  const yieldBase = probability / 14 + recharge * 2.4 + fracture * 2.8;
  const yieldMin = roundTo(clamp(yieldBase * 0.62, 1.1, 9.8), 1);
  const yieldMax = roundTo(
    clamp(yieldBase * 1.08 + infiltration * 2.1, yieldMin + 0.8, 14.6),
    1
  );

  const level = getLevel(probability);

  return {
    probability,
    levelLabel: level.label,
    toneColor: level.color,
    summary: getSummary(probability, recharge, fracture, aridity),
    soilType: getSoilType(recharge, infiltration, fracture, aridity, stability),
    aquiferType: getAquiferType(recharge, infiltration, fracture, aridity),
    estimatedDepth: `${depthMin} - ${depthMax} m`,
    expectedYield: `${yieldMin} - ${yieldMax} m3/h`,
    reliability: `${getReliability(reliabilityPercentage)} (${reliabilityPercentage}%)`,
    agriculturalUse: getAgriculturalUse(probability, yieldMax),
    nextStep: getNextStep(probability),
    notes: [
      "Estimation indicative a confirmer par une etude hydrologique locale.",
      "Verifier la salinite, les nitrates et le debit avant usage agricole.",
      probability >= 60
        ? "Comparer ce point avec 1 ou 2 points voisins avant de lancer le forage final."
        : "Chercher un point plus bas topographiquement avant de lancer un forage."
    ],
    signals: [
      {
        label: "Recharge naturelle",
        value: recharge,
        color: "#44946B",
      },
      {
        label: "Fracturation du sous-sol",
        value: fracture,
        color: "#D38A35",
      },
      {
        label: "Infiltration du terrain",
        value: infiltration,
        color: "#4E8CBF",
      },
      {
        label: "Confort de forage",
        value: stability,
        color: "#84653B",
      },
    ],
  };
}
