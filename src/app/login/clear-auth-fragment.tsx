"use client";

import { useEffect } from "react";

const AUTH_FRAGMENT_KEYS = [
  "access_token",
  "refresh_token",
  "expires_at",
  "expires_in",
  "token_type",
  "type",
];

export function ClearAuthFragment() {
  useEffect(() => {
    if (!window.location.hash) {
      return;
    }

    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const hasAuthFragment = AUTH_FRAGMENT_KEYS.some((key) => fragment.has(key));

    if (!hasAuthFragment) {
      return;
    }

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
  }, []);

  return null;
}
