import React, { useCallback, useEffect } from "react";
import { useLocation, useHistory } from "@docusaurus/router";

const GOOGLE_TRANSLATE_SCRIPT_ID = "tooljet-google-translate-script";
const GOOGLE_TRANSLATE_CALLBACK = "tooljetGoogleTranslateInit";
const GOOGLE_TRANSLATE_CONTAINER_ID = "tooljet-google-translate-runtime";
const GOOGLE_TRANSLATE_SOURCE_LANGUAGE = "en";
const GOOGLE_TRANSLATE_PARAM = "lang";
const LANGUAGE_CODE_REGEX = /^[a-z]{2,3}(?:-[a-z]{2})?$/i;

function normalizeLanguageCode(value) {
  if (!value) return null;

  const languageCode = value.trim();
  if (!LANGUAGE_CODE_REGEX.test(languageCode)) return null;

  const [base, region] = languageCode.split("-");
  return region
    ? `${base.toLowerCase()}-${region.toUpperCase()}`
    : base.toLowerCase();
}

function getRootDomain(hostname) {
  const parts = hostname.split(".");
  if (parts.length < 2) return null;
  return `.${parts.slice(-2).join(".")}`;
}

function setGoogleTranslateCookie(targetLanguage) {
  const cookieValue = `/${GOOGLE_TRANSLATE_SOURCE_LANGUAGE}/${targetLanguage}`;
  const maxAge = 60 * 60 * 24 * 365;
  const secure = window.location.protocol === "https:" ? ";secure" : "";
  const baseCookie = `googtrans=${cookieValue};path=/;max-age=${maxAge};SameSite=Lax${secure}`;

  document.cookie = baseCookie;

  const rootDomain = getRootDomain(window.location.hostname);
  if (rootDomain) {
    document.cookie = `${baseCookie};domain=${rootDomain}`;
  }
}

function ensureTranslateRuntimeContainer() {
  let container = document.getElementById(GOOGLE_TRANSLATE_CONTAINER_ID);
  if (container) return container;

  container = document.createElement("div");
  container.id = GOOGLE_TRANSLATE_CONTAINER_ID;
  container.setAttribute("aria-hidden", "true");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "1px";
  container.style.height = "1px";
  container.style.overflow = "hidden";
  document.body.appendChild(container);

  return container;
}

export default function Root({ children }) {
  const location = useLocation();
  const history = useHistory();

  function getStoredUTMParams() {
    return JSON.parse(sessionStorage.getItem("utmParams") || "{}");
  }

  const initializeTranslate = useCallback(() => {
    if (!window.google?.translate?.TranslateElement) return;
    if (window.__tooljetGoogleTranslateInitialized) return;

    ensureTranslateRuntimeContainer();

    new window.google.translate.TranslateElement(
      {
        pageLanguage: GOOGLE_TRANSLATE_SOURCE_LANGUAGE,
        autoDisplay: true,
      },
      GOOGLE_TRANSLATE_CONTAINER_ID
    );

    window.__tooljetGoogleTranslateInitialized = true;
  }, []);

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
  }, [location.pathname, location.search, location.hash, history]);

  // Support ?lang=<code> links and sync through Google's cookie mechanism.
  useEffect(() => {
    const url = new URL(window.location.href);
    const requestedLanguage = normalizeLanguageCode(
      url.searchParams.get(GOOGLE_TRANSLATE_PARAM)
    );
    if (!requestedLanguage) return;

    setGoogleTranslateCookie(requestedLanguage);

    url.searchParams.delete(GOOGLE_TRANSLATE_PARAM);
    const updatedUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${location.pathname}${location.search}${location.hash}`;
    if (updatedUrl !== currentUrl) {
      history.replace(updatedUrl);
    }
  }, [
    history,
    location.pathname,
    location.search,
    location.hash,
  ]);

  // Initialize Google Translate globally once.
  useEffect(() => {
    window[GOOGLE_TRANSLATE_CALLBACK] = initializeTranslate;

    if (window.google?.translate?.TranslateElement) {
      initializeTranslate();
      return;
    }

    if (!document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
      script.src = `https://translate.google.com/translate_a/element.js?cb=${GOOGLE_TRANSLATE_CALLBACK}`;
      script.async = true;
      document.body.appendChild(script);
    }
  }, [initializeTranslate]);

  return <>{children}</>;
}
