import React, { useEffect } from "react";
import { useLocation, useHistory } from "@docusaurus/router";

export default function Root({ children }) {
  const location = useLocation();
  const history = useHistory();

  function getStoredUTMParams() {
    return JSON.parse(sessionStorage.getItem("utmParams") || "{}");
  }

  // Store UTMs on first page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const storedParams = JSON.parse(
      sessionStorage.getItem("utmParams") || "{}"
    );
    let hasNewParams = false;

    urlParams.forEach((value, key) => {
      if (key.startsWith("utm_")) {
        storedParams[key] = value;
        hasNewParams = true;
      }
    });

    if (hasNewParams) {
      sessionStorage.setItem("utmParams", JSON.stringify(storedParams));
    }
  }, []);

  // Append UTMs on every route change
  useEffect(() => {
    const storedParams = getStoredUTMParams();
    if (Object.keys(storedParams).length === 0) return;

    const url = new URL(window.location.href);

    // Append UTMs only if they're not already present
    Object.entries(storedParams).forEach(([key, value]) => {
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });

    const newUrl = url.pathname + url.search + url.hash;

    if (newUrl !== location.pathname + location.search + location.hash) {
      history.replace(newUrl); // update URL without reloading
    }
  }, [location, history]);

  return <>{children}</>;
}