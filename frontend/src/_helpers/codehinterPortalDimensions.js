export const CODEHINTER_POPUP_EDITOR_DIMENSIONS_KEY = 'codehinterPopupEditorDimensions';

const DEFAULTS = { width: 500, height: 350, x: -150, y: 0 };
const MINS = { width: 500, height: 350 };

function safeNum(value, fallback) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

export function readCodehinterPopupEditorDimensions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CODEHINTER_POPUP_EDITOR_DIMENSIONS_KEY));
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      width: Math.max(MINS.width, safeNum(parsed.width, DEFAULTS.width)),
      height: Math.max(MINS.height, safeNum(parsed.height, DEFAULTS.height)),
      x: safeNum(parsed.x / 2, DEFAULTS.x),
      y: safeNum(parsed.y, DEFAULTS.y),
    };
  } catch {
    return null;
  }
}

export function writeCodehinterPopupEditorDimensions(partial) {
  const prev = readCodehinterPopupEditorDimensions() ?? { ...DEFAULTS };
  const merged = { ...prev, ...partial };
  try {
    localStorage.setItem(
      CODEHINTER_POPUP_EDITOR_DIMENSIONS_KEY,
      JSON.stringify({
        width: Math.max(MINS.width, safeNum(merged.width, DEFAULTS.width)),
        height: Math.max(MINS.height, safeNum(merged.height, DEFAULTS.height)),
        x: safeNum(merged.x, DEFAULTS.x),
        y: safeNum(merged.y, DEFAULTS.y),
      })
    );
  } catch {
    // quota / private mode
  }
}

export function getDefaultCodehinterPopupEditorDimensions() {
  return { ...DEFAULTS };
}
