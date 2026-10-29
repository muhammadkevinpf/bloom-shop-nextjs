import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns false during server rendering and the first client render, then true.
 * Useful for gating reads of browser-only state (localStorage) without an
 * effect that would cause a cascading render.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
