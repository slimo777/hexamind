import React, { useRef, useState } from "react";
import {
  Animated,
  Clipboard,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { MapPressEvent, Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForageWorkflow } from "./useForageWorkflow";

const MAP_TYPES: Array<"standard" | "satellite" | "hybrid"> = [
  "standard",
  "satellite",
  "hybrid",
];
const MAP_TYPE_LABELS: Record<string, string> = {
  standard: "Plan",
  satellite: "Satellite",
  hybrid: "Hybride",
};

export function ForageMapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const {
    phase,
    selectedCoordinate,
    analysisResult,
    handleStart,
    handleMapPress,
    handleValidate,
    handleReset,
  } = useForageWorkflow();

  const [mapTypeIndex, setMapTypeIndex] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(0)).current;
  const panelShown = useRef(false);

  const currentMapType = MAP_TYPES[mapTypeIndex];

  function cycleMapType() {
    setMapTypeIndex((i) => (i + 1) % MAP_TYPES.length);
  }

  function showToast() {
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1600),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  }

  function copyCoords() {
    if (!selectedCoordinate) return;
    Clipboard.setString(
      `${selectedCoordinate.latitude.toFixed(6)}, ${selectedCoordinate.longitude.toFixed(6)}`
    );
    showToast();
  }

  function centerOnPoint() {
    if (!selectedCoordinate || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: selectedCoordinate.latitude,
        longitude: selectedCoordinate.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      400
    );
  }

  function onMapPress(e: MapPressEvent) {
    handleMapPress(e);
    if (!panelShown.current) {
      panelShown.current = true;
      Animated.timing(panelAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }

  function onReset() {
    handleReset();
    panelShown.current = false;
    Animated.timing(panelAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const initialRegion: Region = {
    latitude: 35.76,
    longitude: -5.83,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  return (
    <View style={styles.container}>
      {/* ── MAP ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType={currentMapType}
        initialRegion={initialRegion}
        onPress={onMapPress}
        showsUserLocation
        showsCompass
        showsScale
        showsPointsOfInterest={false}
        showsIndoors={false}
        showsBuildings={false}
        showsTraffic={false}
      >
        {selectedCoordinate && (
          <Marker
            coordinate={selectedCoordinate}
            title="Point sélectionné"
            description={`${selectedCoordinate.latitude.toFixed(5)}, ${selectedCoordinate.longitude.toFixed(5)}`}
            pinColor="#D85A30"
          />
        )}

      </MapView>

      {/* ── TOP CONTROLS ── */}
      <View style={[styles.topBar, { top: insets.top + 12 }]}>
        <TouchableOpacity style={styles.chipBtn} onPress={cycleMapType}>
          <Text style={styles.chipBtnText}>
            {MAP_TYPE_LABELS[currentMapType]}
          </Text>
        </TouchableOpacity>

        {selectedCoordinate && (
          <TouchableOpacity style={styles.chipBtn} onPress={centerOnPoint}>
            <Text style={styles.chipBtnText}>Centrer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── PHASE: IDLE → COMMENCER ── */}
      {phase === "idle" && (
        <View style={[styles.startOverlay, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.startTitle}>AgriForage</Text>
          <Text style={styles.startSub}>
            Sélectionnez un point sur la carte pour estimer le potentiel hydrique
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startBtnText}>Commencer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── HINT ── */}
      {phase === "selecting" && !selectedCoordinate && (
        <View style={styles.hintBadge}>
          <Text style={styles.hintText}>Touchez la carte pour placer un point</Text>
        </View>
      )}

      {/* ── BOTTOM PANEL ── */}
      {phase !== "idle" && selectedCoordinate && (
        <Animated.View
          style={[
            styles.panel,
            { paddingBottom: insets.bottom + 16 },
            { transform: [{ translateY: panelTranslateY }] },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Coordinates */}
          <View style={styles.coordRow}>
            <View style={styles.coordCard}>
              <Text style={styles.coordLabel}>Latitude</Text>
              <Text style={styles.coordValue}>
                {selectedCoordinate.latitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.coordCard}>
              <Text style={styles.coordLabel}>Longitude</Text>
              <Text style={styles.coordValue}>
                {selectedCoordinate.longitude.toFixed(6)}
              </Text>
            </View>
          </View>


          {/* Action buttons */}
          {phase === "selecting" && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={copyCoords}>
                <Text style={styles.secondaryBtnText}>Copier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onReset}>
                <Text style={styles.secondaryBtnText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleValidate}
              >
                <Text style={styles.primaryBtnText}>Valider l'analyse</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading */}
          {phase === "loading" && (
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>Analyse en cours…</Text>
            </View>
          )}

          {/* Results */}
          {phase === "result" && analysisResult && (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Résultats d'analyse</Text>
                <Text style={styles.resultProba}>
                  {analysisResult.probability}% de probabilité
                </Text>
              </View>
              <View style={styles.resultGrid}>
                <ResultRow label="Profondeur estimée" value={analysisResult.depth} />
                <ResultRow label="Débit probable" value={analysisResult.flow} />
                <ResultRow label="Type de sol" value={analysisResult.soilType} />
                <ResultRow label="Aquifère probable" value={analysisResult.aquifer} />
              </View>
              <Text style={styles.resultReco}>{analysisResult.recommendation}</Text>
              <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
                <Text style={styles.resetBtnText}>Nouveau point</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      )}

      {/* ── TOAST ── */}
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>Coordonnées copiées !</Text>
        </Animated.View>
      )}
    </View>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  map: { flex: 1 },

  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 8,
  },
  chipBtn: {
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  chipBtnText: { fontSize: 13, fontWeight: "500", color: "#2C2C2A" },

  startOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  startTitle: { fontSize: 26, fontWeight: "600", color: "#1D9E75", marginBottom: 8 },
  startSub: {
    fontSize: 14,
    color: "#888780",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  startBtn: {
    backgroundColor: "#1D9E75",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  startBtnText: { color: "white", fontSize: 16, fontWeight: "600" },

  hintBadge: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "rgba(44,44,42,0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hintText: { color: "white", fontSize: 13 },

  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D3D1C7",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },

  coordRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  coordCard: {
    flex: 1,
    backgroundColor: "#F1EFE8",
    borderRadius: 10,
    padding: 12,
  },
  coordLabel: { fontSize: 11, color: "#888780", marginBottom: 4, letterSpacing: 0.5 },
  coordValue: { fontSize: 17, fontWeight: "600", color: "#2C2C2A", fontVariant: ["tabular-nums"] },

  historyRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  historyLabel: { fontSize: 12, color: "#888780" },
  historyChip: {
    backgroundColor: "#E1F5EE",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  historyChipText: { fontSize: 11, color: "#0F6E56" },

  actionRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#1D9E75",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "white", fontWeight: "600", fontSize: 15 },
  secondaryBtn: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D3D1C7",
    alignItems: "center",
  },
  secondaryBtnText: { color: "#5F5E5A", fontSize: 13, fontWeight: "500" },

  loadingBox: { paddingVertical: 20, alignItems: "center" },
  loadingText: { color: "#888780", fontSize: 14 },

  resultBox: { paddingTop: 4 },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  resultTitle: { fontSize: 16, fontWeight: "600", color: "#2C2C2A" },
  resultProba: { fontSize: 20, fontWeight: "700", color: "#1D9E75" },
  resultGrid: {
    backgroundColor: "#F1EFE8",
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },
  resultRow: { flexDirection: "row", justifyContent: "space-between" },
  resultLabel: { fontSize: 13, color: "#888780" },
  resultValue: { fontSize: 13, fontWeight: "500", color: "#2C2C2A" },
  resultReco: {
    fontSize: 13,
    color: "#5F5E5A",
    lineHeight: 19,
    marginBottom: 16,
    fontStyle: "italic",
  },
  resetBtn: {
    borderWidth: 1,
    borderColor: "#D3D1C7",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  resetBtnText: { color: "#5F5E5A", fontSize: 14 },

  toast: {
    position: "absolute",
    bottom: 140,
    alignSelf: "center",
    backgroundColor: "rgba(44,44,42,0.88)",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  toastText: { color: "white", fontSize: 13 },
});
