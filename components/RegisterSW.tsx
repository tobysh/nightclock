"use client";

import { useEffect } from "react";
import { isTauri } from "@/lib/media";

/** Registers the offline service worker for the web/PWA build (not inside the desktop app). */
export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || isTauri() || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }, []);
  return null;
}
