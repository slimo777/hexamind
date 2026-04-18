import { startTransition, useState, type RefObject } from "react";
import type MapView from "react-native-maps";

import { copy, DEFAULT_REGION, SELECTED_DELTA } from "./constants";
import {
  buildHistoryLabel,
  requestForageAnalysis,
} from "./services/forageAnalysisService";
import { getFarmerFocusRegion } from "./services/locationService";
import type {
  ForageAnalysisResponse,
  SelectedPoint,
  WorkflowStage,
} from "./types";

function moveItemToFront(
  history: ForageAnalysisResponse[],
  item: ForageAnalysisResponse
) {
  return [item, ...history.filter((entry) => entry.analysisId !== item.analysisId)].slice(
    0,
    4
  );
}

export function useForageWorkflow(mapRef: RefObject<MapView | null>) {
  const [stage, setStage] = useState<WorkflowStage>("idle");
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);
  const [analysis, setAnalysis] = useState<ForageAnalysisResponse | null>(null);
  const [history, setHistory] = useState<ForageAnalysisResponse[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [notice, setNotice] = useState(copy.introNotice);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const animateToRegion = (region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
    mapRef.current?.animateToRegion(region, 850);
  };

  const recenterOnFarmer = async () => {
    setIsLocating(true);
    setErrorMessage(null);

    try {
      const focus = await getFarmerFocusRegion();
      setHasLocationPermission(focus.granted);
      setNotice(focus.message);
      animateToRegion(focus.region);
    } catch (_error) {
      animateToRegion(DEFAULT_REGION);
      setNotice(
        "Impossible de recuperer la position du telephone pour le moment."
      );
      setErrorMessage(
        "La geolocalisation n'est pas disponible. Vous pouvez continuer avec un point choisi manuellement."
      );
    } finally {
      setIsLocating(false);
    }
  };

  const startSelection = async () => {
    setStage("selecting");
    setSelectedPoint(null);
    setAnalysis(null);
    setErrorMessage(null);
    setNotice(copy.selectNotice);
    await recenterOnFarmer();
  };

  const selectPoint = (point: SelectedPoint) => {
    if (stage === "idle") {
      setErrorMessage("Appuyez d'abord sur Commencer pour activer la selection.");
      return;
    }

    setSelectedPoint(point);
    setAnalysis(null);
    setStage("selected");
    setErrorMessage(null);
    setNotice(copy.pointCapturedNotice);

    animateToRegion({
      latitude: point.latitude,
      longitude: point.longitude,
      latitudeDelta: SELECTED_DELTA.latitudeDelta,
      longitudeDelta: SELECTED_DELTA.longitudeDelta,
    });
  };

  const analyzeSelectedPoint = async () => {
    if (!selectedPoint) {
      setErrorMessage("Selectionnez un point sur la carte avant de valider.");
      return false;
    }

    setStage("analyzing");
    setErrorMessage(null);
    setNotice(copy.analyzingNotice);

    try {
      const response = await requestForageAnalysis(selectedPoint);

      startTransition(() => {
        setAnalysis(response);
        setHistory((currentHistory) => moveItemToFront(currentHistory, response));
        setStage("completed");
        setNotice(copy.reportNotice);
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "L'analyse n'a pas pu etre effectuee.";

      setStage("selected");
      setErrorMessage(message);
      setNotice("Corrigez le point choisi puis relancez l'analyse.");
      return false;
    }
  };

  const openHistoryAnalysis = (entry: ForageAnalysisResponse) => {
    setSelectedPoint(entry.request.point);
    setAnalysis(entry);
    setStage("completed");
    setNotice(
      `Analyse ${buildHistoryLabel(entry.request.point)} rechargee depuis l'historique de session.`
    );
    setErrorMessage(null);
    setHistory((currentHistory) => moveItemToFront(currentHistory, entry));

    animateToRegion({
      latitude: entry.request.point.latitude,
      longitude: entry.request.point.longitude,
      latitudeDelta: SELECTED_DELTA.latitudeDelta,
      longitudeDelta: SELECTED_DELTA.longitudeDelta,
    });
  };

  return {
    analysis,
    analyzeSelectedPoint,
    errorMessage,
    hasLocationPermission,
    history,
    isLocating,
    notice,
    openHistoryAnalysis,
    recenterOnFarmer,
    selectPoint,
    selectedPoint,
    stage,
    startSelection,
  };
}
