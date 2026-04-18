import { Platform } from "react-native";
import type { Region } from "react-native-maps";

export const headingFontFamily = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

export const DEFAULT_REGION: Region = {
  latitude: 31.7917,
  longitude: -7.0926,
  latitudeDelta: 5.8,
  longitudeDelta: 5.8,
};

export const FOCUSED_DELTA = {
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

export const SELECTED_DELTA = {
  latitudeDelta: 0.075,
  longitudeDelta: 0.075,
};

export const palette = {
  forest: "#143428",
  pine: "#1E4C3B",
  moss: "#2D6A4F",
  leaf: "#5D8A4A",
  clay: "#C68642",
  clayDark: "#9E6531",
  cream: "#F5EBDD",
  sand: "#E8D8BF",
  dune: "#D8C4A6",
  ink: "#17231D",
  softInk: "#5D6A63",
  card: "#FCF6EB",
  track: "#D9CDBA",
  line: "#E7D5BA",
  danger: "#BE5B3E",
  info: "#4E8CBF",
};

export const copy = {
  introNotice:
    "Touchez Commencer pour activer la selection et centrer la carte sur votre zone.",
  selectNotice:
    "Touchez un point sur la carte pour capturer les coordonnees de forage.",
  pointCapturedNotice:
    "Point enregistre. Verifiez les coordonnees puis lancez l'analyse.",
  analyzingNotice:
    "Analyse hydrique en cours. Le moteur local compare recharge, infiltration et fracturation.",
  reportNotice:
    "Rapport pret. Utilisez-le comme aide a la decision avant une etude terrain.",
  offlineMode: "Mode demo hors ligne",
  engineLabel: "Moteur hydrique local v2",
};

