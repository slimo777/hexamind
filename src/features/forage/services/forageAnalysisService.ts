import { LatLng } from "react-native-maps";
import { estimateWaterPotential } from "../../../utils/waterPotential";

export interface ForageResult {
  probability: number;
  depth: string;
  flow: string;
  soilType: string;
  aquifer: string;
  recommendation: string;
}

export async function analyzeForage(coord: LatLng): Promise<ForageResult> {
  // Simulate async processing (replace with real API call if needed)
  await new Promise((res) => setTimeout(res, 1800));

  const { probability, depthM, flowLH, soilType, aquifer } =
    estimateWaterPotential(coord.latitude, coord.longitude);

  let recommendation: string;
  if (probability >= 75) {
    recommendation =
      "Potentiel hydrique élevé. Un forage de reconnaissance est fortement recommandé. Prévoir une étude géophysique électrique avant perçage.";
  } else if (probability >= 50) {
    recommendation =
      "Potentiel modéré. Une prospection géophysique (tomographie électrique) est conseillée avant tout forage.";
  } else {
    recommendation =
      "Potentiel faible sur ce point. Considérer un déplacement de 200–500 m vers une zone de fracture ou de bas-fond.";
  }

  return {
    probability,
    depth: `${depthM} m`,
    flow: `${flowLH} L/h`,
    soilType,
    aquifer,
    recommendation,
  };
}
