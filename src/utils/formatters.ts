import type { SelectedPoint } from "../features/forage/types";

export function formatCoordinate(value: number, type: "lat" | "lng") {
  const direction =
    type === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";

  return `${Math.abs(value).toFixed(6)} deg ${direction}`;
}

export function formatPoint(point: SelectedPoint, digits = 5) {
  return `${point.latitude.toFixed(digits)}, ${point.longitude.toFixed(digits)}`;
}

export function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch (_error) {
    return value;
  }
}

