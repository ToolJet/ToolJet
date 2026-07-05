import { getMainCanvasWidthPx } from './flexContainer.utils';

let resizeObserver = null;
let windowResizeHandler = null;
let mutationObserver = null;
let subscriberId = 0;
const subscribers = new Map();

function notifyAll() {
  tryAttachToCanvas();
  const w = getMainCanvasWidthPx();
  subscribers.forEach((cb) => cb(w));
}

function tryAttachToCanvas() {
  if (typeof window === 'undefined') return;
  if (typeof ResizeObserver === 'undefined') return;
  const el = document.getElementById('real-canvas');
  if (!el || resizeObserver) return;
  resizeObserver = new ResizeObserver(notifyAll);
  resizeObserver.observe(el);
}

function ensureCanvasAttachment() {
  if (typeof window === 'undefined') return;
  tryAttachToCanvas();
  if (resizeObserver) return;

  if (!mutationObserver && typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(() => {
      tryAttachToCanvas();
      if (resizeObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
      }
    });
    mutationObserver.observe(document.documentElement, { childList: true, subtree: true });
  }
}

/**
 * Subscribes to width changes of `#real-canvas` (shared ResizeObserver).
 * Invokes callback immediately with current width, then on resize / observer updates.
 * @returns {() => void} unsubscribe
 */
export function subscribeMainCanvasWidth(callback) {
  const id = ++subscriberId;
  subscribers.set(id, callback);

  if (!windowResizeHandler && typeof window !== 'undefined') {
    windowResizeHandler = notifyAll;
    window.addEventListener('resize', windowResizeHandler);
  }
  ensureCanvasAttachment();
  notifyAll();

  return () => {
    subscribers.delete(id);
    if (subscribers.size === 0) {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
      }
      if (windowResizeHandler) {
        window.removeEventListener('resize', windowResizeHandler);
        windowResizeHandler = null;
      }
    }
  };
}
