"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production only — in dev it would serve stale
 * bundles and make every change look like it didn't apply.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failing only costs offline support; the app still runs.
      });
    };

    // Don't contend with the first paint for bandwidth.
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
