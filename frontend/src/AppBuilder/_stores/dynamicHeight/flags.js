// The new dynamic-height engine (stateless solver, shared height registry,
// live heights in the editor). On by default; set localStorage
// `tj-dynamic-height-v2` to `off` and reload to compare with the old engine.
const STORAGE_KEY = 'tj-dynamic-height-v2';
const ENABLED_BY_DEFAULT = true;

const readFlag = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'off') return false;
    if (stored === 'on') return true;
  } catch {
    // Storage can be blocked (private mode, sandboxed iframes): use the default.
  }
  return ENABLED_BY_DEFAULT;
};

const enabled = typeof window !== 'undefined' ? readFlag() : ENABLED_BY_DEFAULT;

export const isDynamicHeightV2Enabled = () => enabled;

// Whether a widget with `dynamicHeight` set should size to its content in
// `mode`. The old engine only runs in the viewer; the new one runs in both.
export const isDynamicHeightActive = (dynamicHeight, mode) =>
  !!dynamicHeight && (mode === 'view' || isDynamicHeightV2Enabled());
