"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "mintea:privacy";
const ROOT_CLASS = "privacy-hidden";

const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): boolean {
  return document.documentElement.classList.contains(ROOT_CLASS);
}

function getServerSnapshot(): boolean {
  return false;
}

function setPrivacy(value: boolean): void {
  document.documentElement.classList.toggle(ROOT_CLASS, value);
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // Ignore storage failures (private mode, disabled, etc.)
  }
  listeners.forEach((l) => l());
}

interface Privacy {
  hidden: boolean;
  toggle: () => void;
  setHidden: (value: boolean) => void;
}

export function usePrivacy(): Privacy {
  const hidden = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const toggle = useCallback(() => setPrivacy(!getSnapshot()), []);
  const setHidden = useCallback((value: boolean) => setPrivacy(value), []);
  return { hidden, toggle, setHidden };
}
