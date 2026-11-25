import { isDynamicHeightLiveInEditor } from '@/AppBuilder/_stores/dynamicHeight/flags';

// Which canvas interaction the editor runs: the in-house pointer engine in this folder (v2), or today's
// react-moveable + react-selecto path (Grid/, Selecto.jsx), which stays the default.
//
// Per browser on purpose, so both can be compared in one build: `localStorage['tj-canvas-interaction'] = 'v2'`,
// then reload. The choice is read once per page load: what mounts and how widgets render branch on it, and that
// must not change while the editor is open. Jest starts with an empty localStorage, so it is off unless a test
// sets the key and calls `__resetCanvasInteractionFlagForTests()`.
//
// Rule: v2 is forced off while dynamic height runs live in the editor (`isDynamicHeightLiveInEditor()`, the
// `tj-dh-editor-poc` experiment). The engine saves the top it measures where a component is drawn; that is the
// saved top only while the editor draws saved layouts. With live dynamic height the editor draws rendered
// positions, and only Grid converts them back (`toSavedTop`).
const STORAGE_KEY = 'tj-canvas-interaction';

let chosen = null;

const readChoice = () => {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === 'v2';
  } catch {
    return false;
  }
};

export const isCanvasInteractionV2Enabled = () => {
  if (chosen === null) chosen = readChoice();
  return chosen && !isDynamicHeightLiveInEditor();
};

// Tests only: forget the choice so the next call reads localStorage again.
export const __resetCanvasInteractionFlagForTests = () => {
  chosen = null;
};
