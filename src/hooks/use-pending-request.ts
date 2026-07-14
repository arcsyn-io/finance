"use client";

import { useCallback, useRef, useState } from "react";

export function usePendingRequest() {
  const [isPending, setIsPending] = useState(false);
  const inFlight = useRef(false);

  const run = useCallback(async (request: () => Promise<void>) => {
    if (inFlight.current) return;

    inFlight.current = true;
    setIsPending(true);

    try {
      await request();
    } finally {
      inFlight.current = false;
      setIsPending(false);
    }
  }, []);

  return { isPending, run };
}
