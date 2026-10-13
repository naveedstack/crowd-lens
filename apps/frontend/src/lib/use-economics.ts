"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { FALLBACK_ECONOMICS, type Economics } from "./economics";
import { isUiPreview } from "./ui-preview";

export function useEconomics(initial?: Economics | null) {
  const [economics, setEconomics] = useState<Economics>(initial ?? FALLBACK_ECONOMICS);
  const [loaded, setLoaded] = useState(Boolean(initial && initial.lamportsPerVote > 0) || isUiPreview);

  const refresh = useCallback(async () => {
    if (isUiPreview) {
      setEconomics(initial ?? FALLBACK_ECONOMICS);
      setLoaded(true);
      return initial ?? FALLBACK_ECONOMICS;
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
  }, [initial]);

  useEffect(() => {
    let cancelled = false;
    refresh().catch((err) => {
      if (!cancelled) {
        console.error(err);
        if (!initial) {
          setEconomics(FALLBACK_ECONOMICS);
        }
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initial, refresh]);

  return { economics, loaded, refresh };
}
