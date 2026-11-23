// The website (a different site) cannot set cookies for this app, so it passes the template id
// or build prompt in the URL: ?tj_template_id=... / ?tj_ai_prompt=... on a direct redirect, or
// inside the OAuth state on SSO. Set them as first-party cookies before any route mounts, so the
// session payload carries them through login and HomePage deploys the template / builds the app.

// Cookies are capped at ~4KB and the server URL-encodes the value, so cap the encoded length.
const MAX_ENCODED_PROMPT_LENGTH = 3500;

const AI_COOKIE_VALIDATORS: Record<string, (value: string) => boolean> = {
  tj_template_id: (value) => /^[a-z0-9-]{1,100}$/.test(value),
  tj_ai_prompt: (value) => value.trim() !== '' && encodeURIComponent(value).length <= MAX_ENCODED_PROMPT_LENGTH,
};

export type AiCookies = Record<string, string>;

export const readAiCookiesFromUrl = (): AiCookies => {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.substring(1));
  const state = hash.get('state') || query.get('state');
  const stateParams = state ? new URLSearchParams(state) : null;

  const found: AiCookies = {};
  Object.entries(AI_COOKIE_VALIDATORS).forEach(([key, isValid]) => {
    const value = query.get(key) || hash.get(key) || stateParams?.get(key);
    if (value && isValid(value)) found[key] = value;
  });
  return found;
};

export const persistAiCookiesFromUrl = async (setAiCookie: (cookies: AiCookies) => Promise<unknown>) => {
  const cookies = readAiCookiesFromUrl();
  if (Object.keys(cookies).length === 0) return;

  // Drop the params so a reload does not deploy / build a second time
  const url = new URL(window.location.href);
  const strippedKeys = Object.keys(AI_COOKIE_VALIDATORS).filter((key) => url.searchParams.has(key));
  if (strippedKeys.length > 0) {
    strippedKeys.forEach((key) => url.searchParams.delete(key));
    window.history.replaceState(window.history.state, '', url);
  }

  try {
    await setAiCookie(cookies);
  } catch (error) {
    console.error('Failed to set AI onboarding cookie:', error);
  }
};
