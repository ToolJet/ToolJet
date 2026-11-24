import { EditorView } from '@codemirror/view';

/*
  A pop-out panel's browser window, without React: opening it, keeping its stylesheets the same as the editor's, and
  moving the panel's element in and out of it.

  The window is an empty same-origin page the editor opened. The panel keeps running in the editor's page (one React
  tree, the same stores); only its DOM lives in the other document. So nothing is synced between windows, and the
  window is only as alive as the editor page that opened it.
*/

export const DEFAULT_BOUNDS = { width: 960, height: 760 };
const MIN_BOUNDS = { width: 360, height: 320 };

const finite = (value) => typeof value === 'number' && Number.isFinite(value);

/**
 * A size the screen can show, with the position kept only when it is whole: a remembered position may be on a second
 * monitor (negative, or beyond this screen), so it is not clamped.
 */
export const clampBounds = (bounds, screen = {}) => {
  const fit = (value, min, max, fallback) =>
    Math.round(Math.min(Math.max(finite(value) ? value : fallback, min), finite(max) && max > min ? max : Infinity));
  const next = {
    width: fit(bounds?.width, MIN_BOUNDS.width, screen.availWidth, DEFAULT_BOUNDS.width),
    height: fit(bounds?.height, MIN_BOUNDS.height, screen.availHeight, DEFAULT_BOUNDS.height),
  };
  if (finite(bounds?.left) && finite(bounds?.top)) {
    next.left = Math.round(bounds.left);
    next.top = Math.round(bounds.top);
  }
  return next;
};

/** The `window.open` features for a separate window (not a tab) of this size, and position when there is one. */
export const windowFeatures = (bounds) => {
  const parts = ['popup=yes', `width=${bounds.width}`, `height=${bounds.height}`];
  if (finite(bounds.left) && finite(bounds.top)) parts.push(`left=${bounds.left}`, `top=${bounds.top}`);
  return parts.join(',');
};

/** Where the window is now, in the shape `clampBounds` and `windowFeatures` take. */
export const boundsOf = (win) => ({
  width: win.innerWidth,
  height: win.innerHeight,
  left: win.screenX,
  top: win.screenY,
});

/**
 * Opens the panel's window, empty and titled. Null when the browser blocked it: it opens only on a click or a key
 * press.
 */
export const openPanelWindow = ({ name, title, bounds, opener = window }) => {
  const win = opener.open('', name, windowFeatures(clampBounds(bounds, opener.screen)));
  if (!win) return null;
  // A window of this name left over from an earlier open comes back as it was: start from an empty page.
  win.document.head.replaceChildren();
  win.document.body.replaceChildren();
  win.document.title = title;
  return win;
};

const STYLES = 'style, link[rel~="stylesheet"]';

// Rules added through the CSSOM (`insertRule`, as CSS-in-JS does in production) leave the element's text empty.
const cssTextOf = (style) => {
  if (style.textContent) return style.textContent;
  try {
    return Array.from(style.sheet?.cssRules ?? [], (rule) => rule.cssText).join('\n');
  } catch {
    return ''; // a sheet the page may not read
  }
};

const cloneStyle = (source, targetDoc) => {
  const clone = targetDoc.createElement(source.localName);
  for (const { name, value } of Array.from(source.attributes)) clone.setAttribute(name, value);
  // The resolved address, so a relative one does not depend on the other page's base.
  if (source.localName === 'link') clone.setAttribute('href', source.href);
  else clone.textContent = cssTextOf(source);
  return clone;
};

const ROOT_ATTRIBUTES = ['class', 'lang', 'dir'];
const mirrorsRootAttribute = (name) => ROOT_ATTRIBUTES.includes(name) || name.startsWith('data-');

/**
 * Keeps `targetDoc` styled like `sourceDoc`: every stylesheet in the source head, in the same order, and the root
 * element's class, language and data attributes. Stylesheets arrive late (lazy chunks, hot reload, CSS-in-JS), so it
 * follows the head for as long as the panel is out. Returns the function that stops it.
 */
export const mirrorStyles = (sourceDoc, targetDoc) => {
  const clones = new Map();

  const syncRoot = () => {
    const source = sourceDoc.documentElement;
    const target = targetDoc.documentElement;
    for (const { name, value } of Array.from(source.attributes)) {
      if (mirrorsRootAttribute(name) && target.getAttribute(name) !== value) target.setAttribute(name, value);
    }
    for (const { name } of Array.from(target.attributes)) {
      if (mirrorsRootAttribute(name) && !source.hasAttribute(name)) target.removeAttribute(name);
    }
  };

  const refresh = (source, clone) => {
    for (const { name, value } of Array.from(source.attributes)) {
      if (name !== 'href' && clone.getAttribute(name) !== value) clone.setAttribute(name, value);
    }
    if (source.localName === 'link') {
      if (clone.getAttribute('href') !== source.href) clone.setAttribute('href', source.href);
    } else {
      const text = cssTextOf(source);
      if (clone.textContent !== text) clone.textContent = text;
    }
  };

  // `changed`: the stylesheets whose own text or attributes changed; the rest are only added, removed and ordered.
  const sync = (changed) => {
    const sources = Array.from(sourceDoc.head.querySelectorAll(STYLES));
    const live = new Set(sources);
    for (const [source, clone] of clones) {
      if (live.has(source)) continue;
      clone.remove();
      clones.delete(source);
    }
    // Last to first, so each new copy goes in before the copy of the stylesheet that follows it.
    let following = null;
    for (let i = sources.length - 1; i >= 0; i -= 1) {
      const source = sources[i];
      let clone = clones.get(source);
      if (!clone) {
        clone = cloneStyle(source, targetDoc);
        clones.set(source, clone);
        targetDoc.head.insertBefore(clone, following);
      } else if (changed?.has(source)) refresh(source, clone);
      following = clone;
    }
  };

  // The browser hands over a batch of changes at a time, so one pass covers them all.
  const onHeadChange = (records) => {
    const changed = new Set();
    for (const record of records) {
      const el = record.target.nodeType === 1 ? record.target : record.target.parentNode;
      if (el?.matches?.(STYLES)) changed.add(el);
    }
    sync(changed);
  };

  // Rules added through the CSSOM raise no mutation: such a stylesheet has no text, and is copied again when its
  // number of rules changes.
  const ruleCounts = new Map();
  const syncInsertedRules = () => {
    for (const [source, clone] of clones) {
      if (source.localName !== 'style' || source.firstChild) continue;
      let count = 0;
      try {
        count = source.sheet?.cssRules.length ?? 0;
      } catch {
        continue;
      }
      if (ruleCounts.get(source) === count) continue;
      ruleCounts.set(source, count);
      refresh(source, clone);
    }
  };

  syncRoot();
  sync();
  syncInsertedRules();

  const Observer = sourceDoc.defaultView?.MutationObserver ?? MutationObserver;
  const head = new Observer(onHeadChange);
  head.observe(sourceDoc.head, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['href', 'media', 'disabled'],
  });
  const root = new Observer(syncRoot);
  root.observe(sourceDoc.documentElement, { attributes: true });

  // The panel window's own timer: a visible window's timers run on time even while the editor's tab is in the
  // background.
  const timers = targetDoc.defaultView ?? sourceDoc.defaultView ?? globalThis;
  const poll = timers.setInterval(syncInsertedRules, 400);

  return () => {
    head.disconnect();
    root.disconnect();
    timers.clearInterval(poll);
  };
};

/**
 * The wrappers the panel sits in inside its window: one element per entry of `scope`, outermost first, each with that
 * entry's class names. Styles written for the panel's place in the editor (`.editor .editor-sidebar …`, a theme class
 * on an ancestor) keep matching, while the wrappers themselves take no part in the layout. Returns the innermost
 * wrapper (the body when there is no scope) and a function that updates the class names in place.
 */
export const buildScope = (doc, scope = []) => {
  const wrappers = [];
  let parent = doc.body;
  scope.forEach(() => {
    const el = doc.createElement('div');
    parent.appendChild(el);
    wrappers.push(el);
    parent = el;
  });
  const update = (next = []) =>
    wrappers.forEach((el, i) => {
      const className = `tj-popout-scope ${next[i] ?? ''}`.trim();
      if (el.className !== className) el.className = className;
    });
  update(scope);
  return { mount: parent, update };
};

/**
 * Moves the panel's element (with everything rendered in it) under `target`, which may be in another window's
 * document. React's listeners are on the element and go with it. A move resets scroll offsets, so they are put back,
 * and CodeMirror editors are told which document they are in now (they listen and style per document).
 */
export const moveInto = (host, target) => {
  if (!target || host.parentNode === target) return;
  const scrolled = [];
  host.querySelectorAll('*').forEach((el) => {
    if (el.scrollTop || el.scrollLeft) scrolled.push([el, el.scrollTop, el.scrollLeft]);
  });
  target.appendChild(host);
  const root = host.getRootNode();
  host.querySelectorAll('.cm-editor').forEach((dom) => {
    const view = EditorView.findFromDOM(dom);
    if (view && view.root !== root) view.setRoot(root);
  });
  scrolled.forEach(([el, top, left]) => {
    el.scrollTop = top;
    el.scrollLeft = left;
  });
};
