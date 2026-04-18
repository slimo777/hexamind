import * as Location from "expo-location";
import type { Region } from "react-native-maps";

import { DEFAULT_REGION, FOCUSED_DELTA } from "../constants";
import type { SelectedPoint } from "../types";

export type LocationFocusResult = {
  granted: boolean;
  region: Region;
  point?: SelectedPoint;
  message: string;
};

export async function getFarmerFocusRegion(): Promise<LocationFocusResult> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== "granted") {
    return {
      granted: false,
      region: DEFAULT_REGION,
      message:
        "Localisation non autorisee. La carte reste sur la zone par defaut, mais vous pouvez choisir un point manuellement.",
    };
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    granted: true,
    point: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    },
    region: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      latitudeDelta: FOCUSED_DELTA.latitudeDelta,
      longitudeDelta: FOCUSED_DELTA.longitudeDelta,
    },
    message:
      "Position chargee. Vous pouvez maintenant choisir votre point de forage sur la carte.",
  };
}

