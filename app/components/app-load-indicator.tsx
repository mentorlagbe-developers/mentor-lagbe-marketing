"use client";

import { useEffect, useState } from "react";
import { LandingInitialLoader } from "@/app/sections/landing/landing-initial-loader";

const SHOW_DELAY_MS = 250;

/**
 * Shows the branded loader only when the document is still loading after a short delay
 * (slow network / heavy assets). Fast loads never flash the overlay.
 */
export function AppLoadIndicator() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (document.readyState === "complete") {
      return;
    }

    let shown = false;
    const delayTimer = window.setTimeout(() => {
      if (document.readyState !== "complete") {
        shown = true;
        setVisible(true);
      }
    }, SHOW_DELAY_MS);

    const onLoad = () => {
      window.clearTimeout(delayTimer);
      if (shown) {
        setVisible(false);
      }
    };

    window.addEventListener("load", onLoad, { once: true });
    return () => {
      window.clearTimeout(delayTimer);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  if (!visible) return null;

  return <LandingInitialLoader />;
}
