"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `onIdle` after `timeoutMs` of no user interaction.
 * Used for automatic doctor session timeout (30 minutes).
 */
export function useIdleTimeout(
  onIdle: () => void,
  timeoutMs: number = 30 * 60 * 1000,
  enabled: boolean = true
) {
  const lastActive = useRef(Date.now());
  const callback = useRef(onIdle);
  callback.current = onIdle;

  useEffect(() => {
    if (!enabled) return;

    const reset = () => {
      lastActive.current = Date.now();
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    const timer = setInterval(() => {
      if (Date.now() - lastActive.current > timeoutMs) {
        callback.current();
      }
    }, 30_000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      clearInterval(timer);
    };
  }, [timeoutMs, enabled]);
}
