export const CODEHINTER_POPUP_EDITOR_DIMENSIONS_KEY = 'codehinterPopupEditorDimensions';

const MINS = { width: 500, height: 350 };
const VIEWPORT_MARGIN = 16;

function safeNum(value, fallback) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

function clampBetween(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// x/y are viewport-relative, so this also floors the negatives left by the old centre anchor.
function clampToViewport({ width, height, x, y }) {
  const { innerWidth, innerHeight } = window;
  const clampedWidth = clampBetween(width, MINS.width, Math.max(MINS.width, innerWidth));
  const clampedHeight = clampBetween(height, MINS.height, Math.max(MINS.height, innerHeight));

  return {
    width: clampedWidth,
    height: clampedHeight,
    x: clampBetween(x, 0, Math.max(0, innerWidth - clampedWidth)),
    y: clampBetween(y, 0, Math.max(0, innerHeight - clampedHeight)),
  };
}

export function getDefaultCodehinterPopupEditorDimensions() {
  return clampToViewport({
    ...MINS,
    x: Math.round((window.innerWidth - MINS.width) / 2),
    y: VIEWPORT_MARGIN * 2,
  });
}

function readStoredDimensions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CODEHINTER_POPUP_EDITOR_DIMENSIONS_KEY));
    if (!parsed || typeof parsed !== 'object') return null;
    const defaults = getDefaultCodehinterPopupEditorDimensions();
    return {
      width: safeNum(parsed.width, defaults.width),
      height: safeNum(parsed.height, defaults.height),
      x: safeNum(parsed.x, defaults.x),
      y: safeNum(parsed.y, defaults.y),
    };
  } catch {
    return null;
  }
}

export function readCodehinterPopupEditorDimensions() {
  const stored = readStoredDimensions();
  return stored && clampToViewport(stored);
}

// Merges onto the stored rect, not the clamped one: a drag writes only x/y and must not shrink the saved size.
export function writeCodehinterPopupEditorDimensions(partial) {
  const prev = readStoredDimensions() ?? getDefaultCodehinterPopupEditorDimensions();
  const merged = { ...prev, ...partial };
  try {
    localStorage.setItem(
      CODEHINTER_POPUP_EDITOR_DIMENSIONS_KEY,
      JSON.stringify({
        width: safeNum(merged.width, prev.width),
        height: safeNum(merged.height, prev.height),
        x: safeNum(merged.x, prev.x),
        y: safeNum(merged.y, prev.y),
      })
    );
  } catch {
    // quota / private mode
  }
}
