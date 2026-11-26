// Which dynamic-height engine this page runs: the stateless solver with the
// shared height registry (v2), or the previous delta-based reflow.
//
// The choice comes from the server's public config (`ENABLE_DYNAMIC_HEIGHT_V2`,
// on unless set to `false`), so every browser of an instance runs the same
// engine and support can switch an instance back without touching a client.
// It is decided once the config has arrived and never changes for the life of
// the page: widget hooks branch on it, and a hook cannot change mid-render.
//
// Jest keeps the old engine unless a spec sets the flag in `window.public_config`:
// the existing widget specs describe the old engine, and the new one has its
// own specs.
const UNDER_JEST = typeof process !== 'undefined' && !!process.env?.JEST_WORKER_ID;

const readFlag = () => {
  const value = typeof window !== 'undefined' ? window.public_config?.ENABLE_DYNAMIC_HEIGHT_V2 : undefined;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return !UNDER_JEST;
};

let decided = null;

export const isDynamicHeightV2Enabled = () => {
  if (decided !== null) return decided;
  const value = readFlag();
  // Asked before the config arrived: answer from the default, decide later.
  const configLoaded = typeof window === 'undefined' || window.public_config !== undefined;
  if (configLoaded) decided = value;
  return value;
};

// ── Editor POC ──────────────────────────────────────────────────────────────
// Runs the engine live in the editor, following the answers in "Dynamic
// Height & Collapse-When-Hidden in the editor" (the 64-question PDF), so
// Product can see each answer on a real canvas. Per browser on purpose:
// `localStorage['tj-dh-editor-poc'] = 'on'`, reload to apply.
const EDITOR_POC_KEY = 'tj-dh-editor-poc';
let editorPoc = null;

export const isDynamicHeightEditorPocEnabled = () => {
  if (editorPoc === null) {
    try {
      editorPoc = typeof window !== 'undefined' && window.localStorage.getItem(EDITOR_POC_KEY) === 'on';
    } catch {
      editorPoc = false;
    }
  }
  return editorPoc;
};

export const isDynamicHeightLiveInEditor = () => isDynamicHeightV2Enabled() && isDynamicHeightEditorPocEnabled();

// Whether a widget with `dynamicHeight` set should size to its content in
// `mode`. Always in the viewer; in the editor only with the POC on.
export const isDynamicHeightActive = (dynamicHeight, mode) =>
  !!dynamicHeight && (mode === 'view' || isDynamicHeightLiveInEditor());
