const REQUEST_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const memory = new Map();

const keyFor = (requestId) => `tj_mcp_bootstrap_${requestId}`;

const randomNonce = () => {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/** Capture the URL-fragment ticket before telemetry or error reporting can
 * observe the current URL, then retain it only for the short browser retry. */
export const captureMcpOAuthBootstrap = () => {
  if (!window.location.pathname.replace(/\/$/, '').endsWith('/mcp/consent')) return;
  const requestId = new URLSearchParams(window.location.search).get('request');
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const ticket = fragment.get('bootstrap');
  if (!REQUEST_PATTERN.test(requestId || '') || !TOKEN_PATTERN.test(ticket || '')) return;

  const value = { ticket, nonce: randomNonce() };
  memory.set(requestId, value);
  try {
    sessionStorage.setItem(keyFor(requestId), JSON.stringify(value));
  } catch {
    // The in-memory copy still supports this navigation when storage is blocked.
  }
  const clean = new URL(window.location.href);
  clean.hash = '';
  window.history.replaceState(window.history.state, '', clean);
};

export const getMcpOAuthBootstrap = (requestId) => {
  if (!REQUEST_PATTERN.test(requestId || '')) return null;
  const inMemory = memory.get(requestId);
  if (inMemory) return inMemory;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(keyFor(requestId)) || 'null');
    if (TOKEN_PATTERN.test(parsed?.ticket || '') && TOKEN_PATTERN.test(parsed?.nonce || '')) return parsed;
  } catch {
    // Treat malformed or unavailable storage as no pending bootstrap.
  }
  return null;
};

export const clearMcpOAuthBootstrap = (requestId) => {
  memory.delete(requestId);
  try {
    sessionStorage.removeItem(keyFor(requestId));
  } catch {
    // The server-side interaction still expires quickly.
  }
};
