import React, { useEffect } from "react";

export default function Root({ children }) {
  function storeUTMParams() {
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
  }

  function handleLinkClick(event) {
    const target = event.target.closest("a.navbar-website, a.navbar-signin");
    if (!target) return;

    const storedParams = JSON.parse(
      sessionStorage.getItem("utmParams") || "{}"
    );
    if (Object.keys(storedParams).length === 0) return;

    try {
      const url = new URL(target.href);

      // Append stored UTM params
      Object.entries(storedParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });

      // Redirect with updated URL
      event.preventDefault();
      window.location.href = url.toString();
    } catch (e) {
      console.error("Invalid URL in navbar link:", target.href);
    }
  }

  useEffect(() => {
    storeUTMParams();

    document.addEventListener("click", handleLinkClick);

    return () => {
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  return <>{children}</>;
}
