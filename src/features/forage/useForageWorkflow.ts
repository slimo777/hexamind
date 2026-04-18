import { useState } from "react";
import { LatLng } from "react-native-maps";
import { analyzeForage, ForageResult } from "./services/forageAnalysisService";

export type Phase = "idle" | "selecting" | "loading" | "result";

export function useForageWorkflow() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedCoordinate, setSelectedCoordinate] = useState<LatLng | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ForageResult | null>(null);

  function handleStart() {
    setPhase("selecting");
  }

  function handleMapPress(e: { nativeEvent: { coordinate: LatLng } }) {
    if (phase === "loading" || phase === "result") return;
    const coord = e.nativeEvent.coordinate;
    setSelectedCoordinate(coord);
    if (phase === "idle") setPhase("selecting");
  }

  async function handleValidate() {
    if (!selectedCoordinate) return;
    setPhase("loading");
    setAnalysisResult(null);
    try {
      const result = await analyzeForage(selectedCoordinate);
      setAnalysisResult(result);
      setPhase("result");
    } catch {
      setPhase("selecting");
    }
  }

  function handleReset() {
    setPhase("selecting");
    setSelectedCoordinate(null);
    setAnalysisResult(null);
  }

  return {
    phase,
    selectedCoordinate,
    analysisResult,
    handleStart,
    handleMapPress,
    handleValidate,
    handleReset,
  };
}
