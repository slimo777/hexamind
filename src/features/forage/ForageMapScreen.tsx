import React, { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import MapView, {
  Marker,
  type MapPressEvent,
} from "react-native-maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { copy, DEFAULT_REGION, headingFontFamily, palette } from "./constants";
import { useForageWorkflow } from "./useForageWorkflow";
import type { ForageAnalysisResponse, SelectedPoint } from "./types";
import {
  formatCoordinate,
  formatPoint,
  formatTimestamp,
} from "../../utils/formatters";

const { height: screenHeight } = Dimensions.get("window");

export function ForageMapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);
  const sheetAnim = useRef(new Animated.Value(0.14)).current;

  const {
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
  } = useForageWorkflow(mapRef);

  useEffect(() => {
    const targetValue =
      stage === "completed" || stage === "analyzing"
        ? 1
        : stage === "selected"
          ? 0.82
          : stage === "selecting"
            ? 0.52
            : 0.14;

    Animated.spring(sheetAnim, {
      toValue: targetValue,
      useNativeDriver: true,
      friction: 9,
      tension: 78,
    }).start();
  }, [sheetAnim, stage]);

  const sheetStyle = useMemo(
    () => ({
      opacity: sheetAnim.interpolate({
        inputRange: [0.14, 1],
        outputRange: [0.9, 1],
      }),
      transform: [
        {
          translateY: sheetAnim.interpolate({
            inputRange: [0.14, 1],
            outputRange: [60, 0],
          }),
        },
        {
          scale: sheetAnim.interpolate({
            inputRange: [0.14, 1],
            outputRange: [0.985, 1],
          }),
        },
      ],
    }),
    [sheetAnim]
  );

  const statusBadge = useMemo(() => {
    if (analysis) {
      return {
        label: analysis.report.levelLabel,
        color: analysis.report.toneColor,
      };
    }

    if (selectedPoint) {
      return {
        label: "Point capture",
        color: palette.clay,
      };
    }

    if (stage === "selecting") {
      return {
        label: "Selection active",
        color: palette.leaf,
      };
    }

    return {
      label: "Pret",
      color: palette.moss,
    };
  }, [analysis, selectedPoint, stage]);

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    selectPoint({ latitude, longitude });
  };

  const renderHistory = () => {
    if (history.length === 0) {
      return null;
    }

    return (
      <View style={styles.historySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historique session</Text>
          <Text style={styles.sectionHint}>Touchez une carte pour reouvrir</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.historyList}
        >
          {history.map((entry) => (
            <Pressable
              key={entry.analysisId}
              style={styles.historyCard}
              onPress={() => openHistoryAnalysis(entry)}
            >
              <Text style={styles.historyProbability}>
                {entry.report.probability}%
              </Text>
              <Text style={styles.historyLabel}>{entry.report.levelLabel}</Text>
              <Text style={styles.historyCoordinates}>
                {formatPoint(entry.request.point, 4)}
              </Text>
              <Text style={styles.historyDate}>
                {formatTimestamp(entry.createdAt)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderIntro = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.panelTitle}>Revision complete de l'experience</Text>
      <Text style={styles.panelText}>
        L'application est maintenant separee entre interface mobile,
        geolocalisation et moteur d'analyse. Cela rend le frontend plus propre
        et le backend metier plus simple a faire evoluer.
      </Text>

      <View style={styles.stepsList}>
        <StepRow
          number="1"
          text="Appuyez sur Commencer pour activer la selection de point."
        />
        <StepRow
          number="2"
          text="Touchez une parcelle, un bas-fond ou une zone de drainage."
        />
        <StepRow
          number="3"
          text="Validez pour generer un rapport hydrique structure."
        />
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Backend actuel</Text>
        <Text style={styles.tipText}>
          Le projet utilise un moteur d'analyse local hors ligne. Il imite une
          reponse backend avec identifiant, date de calcul, profil terrain et
          rapport complet.
        </Text>
      </View>

      {renderHistory()}
    </ScrollView>
  );

  const renderSelectionHint = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.panelTitle}>Choisissez un emplacement</Text>
      <Text style={styles.panelText}>
        La selection est active. Touchez la carte pour poser un marqueur puis
        verifier les coordonnees avant analyse.
      </Text>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Suggestion terrain</Text>
        <Text style={styles.tipText}>
          Comparez idealement plusieurs points: une zone basse, une zone plus
          fissuree, puis un point de controle a proximite.
        </Text>
      </View>

      {renderHistory()}
    </ScrollView>
  );

  const renderSelectedPoint = (point: SelectedPoint) => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.panelTitle}>Coordonnees du point choisi</Text>
      <Text style={styles.panelText}>
        Le point est pret pour analyse. Verifiez les coordonnees et lancez le
        rapport de forage.
      </Text>

      <View style={styles.metricsGrid}>
        <MetricCard
          label="Latitude"
          value={formatCoordinate(point.latitude, "lat")}
        />
        <MetricCard
          label="Longitude"
          value={formatCoordinate(point.longitude, "lng")}
        />
        <MetricCard
          label="Coordonnees decimales"
          value={formatPoint(point, 6)}
          wide
        />
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Conseil</Text>
        <Text style={styles.tipText}>
          Prenez en note ce point et comparez-le avec un autre emplacement
          proche si vous hesitez avant de forer.
        </Text>
      </View>

      <Pressable style={styles.primaryLargeButton} onPress={analyzeSelectedPoint}>
        <Text style={styles.primaryLargeButtonText}>Valider l'analyse</Text>
      </Pressable>

      {renderHistory()}
    </ScrollView>
  );

  const renderLoading = () => (
    <View style={styles.loadingBlock}>
      <ActivityIndicator size="large" color={palette.moss} />
      <Text style={styles.panelTitle}>Analyse en cours</Text>
      <Text style={styles.panelText}>
        Le moteur local prepare la reponse backend, calcule les signaux
        hydriques et compose le profil terrain de ce point.
      </Text>
    </View>
  );

  const renderReport = (entry: ForageAnalysisResponse) => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.reportContent}
    >
      <View style={styles.reportHeader}>
        <View
          style={[
            styles.scoreBubble,
            {
              borderColor: entry.report.toneColor,
              shadowColor: entry.report.toneColor,
            },
          ]}
        >
          <Text style={[styles.scoreValue, { color: entry.report.toneColor }]}>
            {entry.report.probability}%
          </Text>
          <Text style={styles.scoreLabel}>Potentiel</Text>
        </View>

        <View style={styles.reportHeaderCopy}>
          <Text style={styles.reportTitle}>{entry.report.levelLabel}</Text>
          <Text style={styles.panelText}>{entry.report.summary}</Text>
        </View>
      </View>

      <View style={styles.metadataRow}>
        <MetadataPill label={entry.backendMode} />
        <MetadataPill label={entry.engineLabel} />
      </View>

      <View style={styles.metadataCard}>
        <Text style={styles.metadataTitle}>Trace backend</Text>
        <Text style={styles.metadataText}>ID: {entry.analysisId}</Text>
        <Text style={styles.metadataText}>
          Genere le {formatTimestamp(entry.createdAt)}
        </Text>
        <Text style={styles.metadataText}>
          Point source: {formatPoint(entry.request.point, 5)}
        </Text>
      </View>

      <View style={styles.signalList}>
        {entry.report.signals.map((signal) => (
          <SignalMeter
            key={signal.label}
            label={signal.label}
            value={signal.value}
            color={signal.color}
          />
        ))}
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label="Profondeur estimee" value={entry.report.estimatedDepth} />
        <MetricCard label="Debit probable" value={entry.report.expectedYield} />
        <MetricCard label="Fiabilite" value={entry.report.reliability} />
        <MetricCard label="Type de sol" value={entry.report.soilType} />
        <MetricCard label="Aquifere probable" value={entry.report.aquiferType} wide />
        <MetricCard label="Usage agricole" value={entry.report.agriculturalUse} wide />
      </View>

      <View style={styles.profileGrid}>
        <MetricCard
          label="Climat"
          value={entry.terrainProfile.climateBand}
          wide
        />
        <MetricCard
          label="Recharge"
          value={entry.terrainProfile.rechargeTrend}
        />
        <MetricCard
          label="Risque"
          value={entry.terrainProfile.drillingRisk}
        />
        <MetricCard
          label="Periode conseillee"
          value={entry.terrainProfile.recommendedSeason}
          wide
        />
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Prochaine action</Text>
        <Text style={styles.tipText}>{entry.report.nextStep}</Text>
      </View>

      <View style={styles.notesBlock}>
        <Text style={styles.notesTitle}>Bonnes pratiques</Text>
        {entry.report.notes.map((note) => (
          <View key={note} style={styles.noteRow}>
            <View style={styles.noteDot} />
            <Text style={styles.noteText}>{note}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.primaryLargeButton} onPress={startSelection}>
        <Text style={styles.primaryLargeButtonText}>Choisir un autre point</Text>
      </Pressable>

      {renderHistory()}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        mapType={Platform.OS === "android" ? "terrain" : "mutedStandard"}
        showsCompass
        showsScale
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={Platform.OS === "android" && hasLocationPermission}
        toolbarEnabled={Platform.OS === "android"}
        onPress={handleMapPress}
      >
        {selectedPoint ? (
          <Marker
            coordinate={selectedPoint}
            title="Point de forage"
            description="Position selectionnee"
            pinColor={analysis?.report.toneColor ?? palette.moss}
          />
        ) : null}
      </MapView>

      <View style={styles.mapTint} />
      <View style={styles.atmosphereOrb} />

      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.brandBlock}>
              <View style={styles.brandDot} />
              <Text style={styles.brandName}>AgriForage</Text>
            </View>

            <View style={styles.headerBadgeRow}>
              <MetadataPill label={copy.offlineMode} compact />
              <View
                style={[
                  styles.statusPill,
                  {
                    borderColor: `${statusBadge.color}55`,
                    backgroundColor: `${statusBadge.color}22`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusPillDot,
                    { backgroundColor: statusBadge.color },
                  ]}
                />
                <Text style={styles.statusPillText}>{statusBadge.label}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.headerTitle}>
            Analyse mobile de forage agricole, propre cote frontend et plus
            claire cote backend.
          </Text>
          <Text style={styles.headerText}>{notice}</Text>

          <View style={styles.actionsRow}>
            <Pressable style={styles.headerPrimaryButton} onPress={startSelection}>
              {isLocating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.headerPrimaryButtonText}>
                  {stage === "idle" ? "Commencer" : "Nouveau point"}
                </Text>
              )}
            </Pressable>

            <Pressable style={styles.headerGhostButton} onPress={recenterOnFarmer}>
              <Text style={styles.headerGhostButtonText}>Me localiser</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <Animated.View
        style={[
          styles.bottomSheet,
          {
            paddingBottom: Math.max(18, insets.bottom + 10),
            maxHeight: screenHeight * 0.76,
          },
          sheetStyle,
        ]}
      >
        <View style={styles.sheetGlow} />
        <View style={styles.sheetHandle} />

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {stage === "idle"
          ? renderIntro()
          : stage === "analyzing"
            ? renderLoading()
            : analysis
              ? renderReport(analysis)
              : selectedPoint
                ? renderSelectedPoint(selectedPoint)
                : renderSelectionHint()}
      </Animated.View>
    </View>
  );
}

function StepRow({ number, text }: { number: string; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

function MetadataPill({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.metadataPill, compact && styles.metadataPillCompact]}>
      <Text style={[styles.metadataPillText, compact && styles.metadataPillTextLight]}>
        {label}
      </Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.metricCard, wide && styles.metricCardWide]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function SignalMeter({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const width = `${Math.round(value * 100)}%` as `${number}%`;

  return (
    <View style={styles.signalItem}>
      <View style={styles.signalHeader}>
        <Text style={styles.signalLabel}>{label}</Text>
        <Text style={styles.signalPercent}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={styles.signalTrack}>
        <View style={[styles.signalFill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.forest,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(16, 39, 31, 0.12)",
  },
  atmosphereOrb: {
    position: "absolute",
    top: 70,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: "rgba(198, 134, 66, 0.14)",
  },
  safeArea: {
    paddingHorizontal: 18,
  },
  headerCard: {
    marginTop: 6,
    padding: 18,
    borderRadius: 28,
    backgroundColor: "rgba(14, 30, 22, 0.84)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: palette.clay,
  },
  brandName: {
    color: "#FFFDF8",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    gap: 8,
  },
  statusPillDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusPillText: {
    color: "#FDF5EA",
    fontSize: 12,
    fontWeight: "700",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 31,
    fontFamily: headingFontFamily,
    marginBottom: 10,
  },
  headerText: {
    color: "rgba(248, 240, 227, 0.88)",
    fontSize: 14,
    lineHeight: 21,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  headerPrimaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: palette.leaf,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  headerPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  headerGhostButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  headerGhostButtonText: {
    color: "#F8F0E3",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomSheet: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 12,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 14,
    backgroundColor: palette.cream,
    borderWidth: 1,
    borderColor: palette.dune,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  sheetGlow: {
    position: "absolute",
    top: -35,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 140,
    backgroundColor: "rgba(93, 138, 74, 0.12)",
  },
  sheetHandle: {
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: palette.dune,
    alignSelf: "center",
    marginBottom: 14,
  },
  errorBanner: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#F8DDD4",
    borderWidth: 1,
    borderColor: "#E8B4A3",
  },
  errorBannerText: {
    color: palette.danger,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  panelTitle: {
    color: palette.ink,
    fontSize: 23,
    lineHeight: 28,
    fontFamily: headingFontFamily,
    marginBottom: 10,
  },
  panelText: {
    color: palette.softInk,
    fontSize: 14,
    lineHeight: 21,
  },
  stepsList: {
    marginTop: 20,
    gap: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5D0B1",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    color: palette.forest,
    fontSize: 14,
    fontWeight: "800",
  },
  stepText: {
    flex: 1,
    color: palette.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  tipCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 20,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
  },
  tipTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tipText: {
    color: palette.softInk,
    fontSize: 14,
    lineHeight: 21,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  profileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  metricCard: {
    width: "48%",
    minHeight: 96,
    padding: 14,
    borderRadius: 18,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
  },
  metricCardWide: {
    width: "100%",
    minHeight: 88,
  },
  metricLabel: {
    color: palette.softInk,
    fontSize: 12,
    lineHeight: 18,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    fontWeight: "700",
  },
  metricValue: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
  },
  primaryLargeButton: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: palette.forest,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primaryLargeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  loadingBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 10,
  },
  reportContent: {
    paddingBottom: 4,
  },
  reportHeader: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  scoreBubble: {
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 5,
    backgroundColor: "#FFFDF8",
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  scoreValue: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900",
  },
  scoreLabel: {
    marginTop: 6,
    color: palette.softInk,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  reportHeaderCopy: {
    flex: 1,
  },
  reportTitle: {
    color: palette.ink,
    fontSize: 22,
    lineHeight: 27,
    fontFamily: headingFontFamily,
    marginBottom: 8,
  },
  metadataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  metadataPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EBDFC9",
    alignSelf: "flex-start",
  },
  metadataPillCompact: {
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  metadataPillText: {
    color: palette.forest,
    fontSize: 12,
    fontWeight: "700",
  },
  metadataPillTextLight: {
    color: "#F8F0E3",
  },
  metadataCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#F0E2CA",
    borderWidth: 1,
    borderColor: "#DFC7A2",
  },
  metadataTitle: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  metadataText: {
    color: palette.softInk,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  signalList: {
    marginTop: 18,
    gap: 12,
  },
  signalItem: {
    gap: 8,
  },
  signalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  signalLabel: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  signalPercent: {
    color: palette.softInk,
    fontSize: 13,
    fontWeight: "700",
  },
  signalTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    backgroundColor: palette.track,
    overflow: "hidden",
  },
  signalFill: {
    height: "100%",
    borderRadius: 999,
  },
  notesBlock: {
    marginTop: 20,
    gap: 10,
  },
  notesTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  noteDot: {
    marginTop: 6,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.clay,
  },
  noteText: {
    flex: 1,
    color: palette.softInk,
    fontSize: 14,
    lineHeight: 21,
  },
  historySection: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionHint: {
    color: palette.softInk,
    fontSize: 12,
    fontWeight: "600",
  },
  historyList: {
    gap: 10,
    paddingRight: 6,
  },
  historyCard: {
    width: 176,
    padding: 14,
    borderRadius: 18,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
  },
  historyProbability: {
    color: palette.forest,
    fontSize: 24,
    fontWeight: "900",
  },
  historyLabel: {
    marginTop: 4,
    color: palette.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  historyCoordinates: {
    marginTop: 8,
    color: palette.softInk,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  historyDate: {
    marginTop: 8,
    color: palette.softInk,
    fontSize: 12,
    lineHeight: 18,
  },
});
