"use client";

import { useEffect } from "react";

const STORAGE_KEY = "tripsplit_recent";
const MAX_RECENT = 5;

export interface RecentTrip {
  tripId: string;
  tripName: string;
}

function parseRecentTrips(value: string | null): RecentTrip[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item): RecentTrip | null => {
        if (typeof item === "string") {
          return { tripId: item, tripName: item };
        }

        if (
          item &&
          typeof item === "object" &&
          "tripId" in item &&
          "tripName" in item &&
          typeof item.tripId === "string" &&
          typeof item.tripName === "string"
        ) {
          return { tripId: item.tripId, tripName: item.tripName };
        }

        return null;
      })
      .filter((item): item is RecentTrip => item !== null);
  } catch {
    return [];
  }
}

export function saveTripToRecent(tripId: string, tripName: string) {
  try {
    const existing = parseRecentTrips(localStorage.getItem(STORAGE_KEY));
    const updated = [
      { tripId, tripName },
      ...existing.filter((trip) => trip.tripId !== tripId),
    ].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getRecentTrips(): RecentTrip[] {
  return parseRecentTrips(localStorage.getItem(STORAGE_KEY));
}

/** Invisible component — saves trip info to localStorage on mount */
export function TripTracker({ tripId, tripName }: { tripId: string; tripName: string }) {
  useEffect(() => {
    saveTripToRecent(tripId, tripName);
  }, [tripId, tripName]);
  return null;
}
