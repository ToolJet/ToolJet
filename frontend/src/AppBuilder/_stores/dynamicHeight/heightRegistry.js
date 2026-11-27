// ─────────────────────────────────────────────────────────────────────────────
// Height registry: one ResizeObserver for every widget that sizes to its
// content.
//
// The browser reports sizes it has already laid out, so measuring here never
// forces a layout (no offsetHeight reads in a loop). Each report is mapped
// back to its widget, rounded to whole pixels, and dropped when nothing
// changed; whatever is left goes to `report` in one batch per browser frame.
//
// A widget is described by the caller, e.g. { key, id, contextIndices,
// moduleId, layout }. Only `key` (its layout key, see layoutKeys.js) is read
// here; the rest is handed back untouched with each height.
// ─────────────────────────────────────────────────────────────────────────────

// Heights at or below this are not real sizes: 0 is a widget that is not drawn
// (a hidden tab, a closed modal, a collapsed accordion) and 1 is the editor's
// strip for a hidden widget (a 0 px box with a 1 px border). The widget keeps
// its last height and reports again once it is drawn.
const NOT_DRAWN_MAX_HEIGHT = 1;

const borderBoxHeight = (entry) => entry.borderBoxSize?.[0]?.blockSize ?? entry.target.offsetHeight;

/**
 * @param {object} options
 * @param {(changes: Array<object>) => void} options.report  receives the widgets whose height changed, each with `height`
 * @param {typeof ResizeObserver} [options.ResizeObserver]  the browser's by default; injectable for tests
 */
export const createHeightRegistry = (options) => {
  const { report } = options;
  // Read when the first widget is watched, not now: the app's registry is made when the store is, which may be before
  // a ResizeObserver exists (a polyfill, a test). `in`, not a default value: a caller passing `undefined` means "no
  // observer here".
  const observerClass = () => ('ResizeObserver' in options ? options.ResizeObserver : globalThis.ResizeObserver);

  const widgets = new WeakMap(); // element → widget; a detached element is collected with its entry
  // widget key → its last report ({ ...widget, height }). The browser reports only changes, so this is the one
  // place a widget's height is still known after the rendered layouts were cleared (see measuredHeights).
  const lastReports = new Map();
  const frozenKeys = new Set(); // widget keys whose reports are ignored for now
  const awaited = new Set(); // elements observed but not reported on yet
  // Created when the first widget is watched, and let go when the last one is: a page with no dynamic height widget
  // left keeps no observer alive.
  let observer = null;
  let watchedCount = 0;

  const handleResize = (entries) => {
    const changes = [];
    for (const entry of entries) {
      const widget = widgets.get(entry.target);
      if (!widget) continue;
      awaited.delete(entry.target); // any report counts as measured, even one dropped below

      const height = Math.round(borderBoxHeight(entry));
      if (height <= NOT_DRAWN_MAX_HEIGHT) continue;
      if (frozenKeys.has(widget.key)) continue;
      if (lastReports.get(widget.key)?.height === height) continue;

      const change = { ...widget, height };
      lastReports.set(widget.key, change);
      changes.push(change);
    }
    if (changes.length > 0) report(changes);
  };

  const observe = (element, widget) => {
    const Observer = observerClass();
    if (!Observer || !element) return;
    observer ??= new Observer(handleResize);
    if (!widgets.has(element)) watchedCount += 1;
    widgets.set(element, widget);
    awaited.add(element);
    // The border box is what the widget takes on the canvas, padding and border included.
    observer.observe(element, { box: 'border-box' });
  };

  const unobserve = (element) => {
    const widget = element && widgets.get(element);
    if (!widget) return;
    lastReports.delete(widget.key); // a remount reports its first height even if it matches
    awaited.delete(element);
    widgets.delete(element);
    observer?.unobserve(element);
    watchedCount -= 1;
    if (watchedCount === 0) {
      observer?.disconnect();
      observer = null;
    }
  };

  // A frozen widget (one showing a loading state, say) keeps its last height:
  // its reports are ignored until it is unfrozen.
  const setFrozen = (key, frozen) => {
    if (frozen) frozenKeys.add(key);
    else frozenKeys.delete(key);
  };

  // Whether a watched widget has not reported its first size yet. The
  // scheduler waits a few frames for these, so a container that just mounted
  // is sized once from real heights rather than from defaults and again a
  // frame later.
  const isAwaitingMeasurement = () => awaited.size > 0;

  // Gives up on widgets that never got a size (an element that stays
  // detached), so one lost widget cannot delay every later pass.
  const forgetAwaitedMeasurements = () => awaited.clear();

  // The last height reported for each watched widget, with what it registered with. A frozen widget, or one not
  // drawn for now, keeps its last real height. The scheduler hands these to a pass that places a whole module again.
  const measuredHeights = () => lastReports.values();

  return { observe, unobserve, setFrozen, isAwaitingMeasurement, forgetAwaitedMeasurements, measuredHeights };
};
