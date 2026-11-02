// D-01 is provisional: switching to an allowlist only changes isAllowedScheme.
const BLOCKED_SCHEMES = new Set(['javascript', 'vbscript']);
const isAllowedScheme = (scheme) => !BLOCKED_SCHEMES.has(scheme);

const BLOCKED_FRAME_SRC = 'about:blank';

// Mirrors the WHATWG URL parser: leading C0 controls/spaces are trimmed and tab/CR/LF are removed anywhere.
const normalizeLikeBrowser = (url) => {
  let start = 0;
  while (start < url.length && url.charCodeAt(start) <= 0x20) start++;
  return url.slice(start).replace(/[\t\n\r]/g, '');
};

const schemeOf = (url) => /^([a-z][a-z0-9+.-]*):/i.exec(normalizeLikeBrowser(url))?.[1].toLowerCase();

export function isScriptSchemeUrl(url) {
  if (typeof url !== 'string') return false;
  const scheme = schemeOf(url);
  return scheme !== undefined && !isAllowedScheme(scheme);
}

export function toSafeFrameSrc(url) {
  return isScriptSchemeUrl(url) ? BLOCKED_FRAME_SRC : url;
}
