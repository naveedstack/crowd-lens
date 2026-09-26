"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { FALLBACK_ECONOMICS, type Economics } from "./economics";
import { isUiPreview } from "./ui-preview";

export function useEconomics() {
  const [economics, setEconomics] = useState<Economics>(FALLBACK_ECONOMICS);
  const [loaded, setLoaded] = useState(isUiPreview);

  const refresh = useCallback(async () => {
    if (isUiPreview) {
      setEconomics(FALLBACK_ECONOMICS);
      setLoaded(true);
      return FALLBACK_ECONOMICS;
    }

    const base = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!base) {
      setEconomics(FALLBACK_ECONOMICS);
      setLoaded(true);
      return FALLBACK_ECONOMICS;
    }

    const response = await axios.get<Economics>(`${base}/api/v1/user/economics`);
    const next = { ...FALLBACK_ECONOMICS, ...response.data };
    setEconomics(next);
    setLoaded(true);
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;
    refresh().catch((err) => {
      if (!cancelled) {
        console.error(err);
        setEconomics(FALLBACK_ECONOMICS);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return { economics, loaded, refresh };
}
