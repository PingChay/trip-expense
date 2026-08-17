"use client";

import { useEffect } from "react";

const STORAGE_KEY = "tripsplit_recent";
const MAX_RECENT = 5;

export function saveTripToRecent(tripId: string) {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const updated = [tripId, ...existing.filter((id) => id !== tripId)].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getRecentTrips(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Invisible component — saves tripId to localStorage on mount */
export function TripTracker({ tripId }: { tripId: string }) {
  useEffect(() => {
    saveTripToRecent(tripId);
  }, [tripId]);
  return null;
}
