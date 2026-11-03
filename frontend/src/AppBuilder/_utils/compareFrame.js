// The compare view (ee VersionDiff) renders each version through this viewer in a same-origin frame
// that takes no clicks. To show a change inside a dialog, it asks the frame to open that dialog
// (Viewer/useCompareOverlayBridge.js). The dialog is opened with its own open action, and its own
// events (onOpen, onClose) are muted in that frame: comparing must never run the app's actions.

export const COMPARE_OVERLAY_MESSAGE = 'tooljet-compare:overlay';
export const COMPARE_OVERLAY_RESULT = 'tooljet-compare:overlay-result';

const muted = new Set();

export const muteCompareEvents = (componentId) => {
  if (componentId) muted.add(componentId);
};

export const isCompareMuted = (componentId) => muted.size > 0 && muted.has(componentId);
