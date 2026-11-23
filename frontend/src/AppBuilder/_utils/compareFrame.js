// The compare view (ee VersionDiff) renders each version through this viewer in a same-origin frame
// that takes no clicks. To show a change inside a dialog, it asks the frame to open that dialog
// (Viewer/useCompareOverlayBridge.js). The dialog is opened with its own open action, and its own
// events (onOpen, onClose) are muted in that frame: comparing must never run the app's actions.

export const COMPARE_OVERLAY_MESSAGE = 'tooljet-compare:overlay';
export const COMPARE_OVERLAY_RESULT = 'tooljet-compare:overlay-result';
// Closing the dialogs the app itself opened (on page load, say), which cover the compared page.
export const COMPARE_DISMISS_MESSAGE = 'tooljet-compare:dismiss';
// Switching the compared page inside a frame that is already running, instead of loading the version again.
export const COMPARE_PAGE_MESSAGE = 'tooljet-compare:page';
export const COMPARE_PAGE_RESULT = 'tooljet-compare:page-result';

// Two compare frames boot on the editor's main thread. The compare view lets one build its app at a time (?turns=1):
// a frame asks for a turn once its data is fetched, and the view grants it when the other version has rendered.
export const COMPARE_TURN_REQUEST = 'tooljet-compare:turn-request';
export const COMPARE_TURN_GRANT = 'tooljet-compare:turn-grant';

const muted = new Set();

export const muteCompareEvents = (componentId) => {
  if (componentId) muted.add(componentId);
};

export const isCompareMuted = (componentId) => muted.size > 0 && muted.has(componentId);

// A compare frame (?compare=1, inside a same-origin parent) shows the app canvas only: no page navigation, app
// title or logo. A version with the navigation at the top would otherwise push its canvas down, and one with it at
// the side would squeeze it, so unchanged components looked moved (team testing, 2026-10-28). The compare view
// lists a navigation change on its own.
export const isCompareFrame = () => {
  try {
    return window.parent !== window && new URLSearchParams(window.location.search).get('compare') === '1';
  } catch {
    return false;
  }
};

export const withoutCompareNavigation = (pageSettings) =>
  pageSettings?.definition
    ? {
        ...pageSettings,
        definition: {
          ...pageSettings.definition,
          properties: {
            ...pageSettings.definition.properties,
            disableMenu: { value: '{{true}}', fxActive: false },
            hideHeader: true,
            hideLogo: true,
            position: 'side',
          },
        },
      }
    : pageSettings;

// Resolves when this frame may build its app: at once unless the compare view asked it to take turns, and after
// `timeoutMs` without an answer, so a frame never hangs.
export const waitForCompareTurn = ({ timeoutMs = 20000 } = {}) => {
  if (!isCompareFrame() || new URLSearchParams(window.location.search).get('turns') !== '1') return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      resolve();
    };
    const onMessage = (event) => {
      if (event.source === window.parent && event.data?.type === COMPARE_TURN_GRANT) done();
    };
    const timer = setTimeout(done, timeoutMs);
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: COMPARE_TURN_REQUEST }, window.location.origin);
  });
};
