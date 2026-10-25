import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  LibraryInstance,
  LibraryInstanceContext,
  PackHost,
  loadLibraryCss,
  loadLibraryModule,
  slotAttributeName,
} from './inlineRuntime';

// Shadow-root baseline. ToolJet's global CSS stays out, while inherited properties and theme custom
// properties (--cc-*, --text-*) still flow in. The body is non-scrollable and sized by the widget box.
// A render error inside the bundle is caught by RenderWidget's FallbackBoundary (portals bubble).
const BASE_CSS = `
:host { display: block; position: relative; font-family: var(--cc-font-family, inherit); }
.tj-cc-root { width: 100%; height: 100%; overflow: hidden; }
.tj-cc-root.tj-cc-fit { height: auto; overflow: visible; }
.tj-cc-root.tj-cc-fit > * { height: auto; }
.tj-cc-root.tj-cc-fit.tj-cc-stretch, .tj-cc-root.tj-cc-fit.tj-cc-stretch > * { height: 100%; }
*, *::before, *::after { box-sizing: border-box; }
.tj-cc-error { padding: 8px; font: 12px/1.4 monospace; color: var(--text-danger); white-space: pre-wrap; }
`;

// After the library's own CSS: ToolJet's theme tokens that a pack reads through the standard --tj-* names (radius
// scale, text on the brand colour, status colours, surfaces), so a shipped theme restyles every pack the same way.
// A pack maps them onto its own variables (the shadcn pack: --ui-*), or reads them directly.
// The app theme as --tj-* tokens, defined only when the host has tj-themed: a pack drawn in its own design system
// (manifest themeMode "own") gets them only once the app applies a theme, and falls back to its stock look otherwise.
const TOKEN_CSS = `
:host(.tj-themed) {
  --tj-radius: var(--cc-radius-default, 6px);
  --tj-radius-small: var(--cc-radius-small, 4px);
  --tj-radius-large: var(--cc-radius-large, 12px);
  --tj-on-brand: var(--cc-on-primary-brand, #ffffff);
  --tj-brand: var(--cc-primary-brand, #4368e3);
  --tj-brand-strong: var(--cc-primary-brand-strong, var(--cc-primary-brand, #4368e3));
  --tj-surface: var(--cc-surface1-surface, #ffffff);
  --tj-surface-muted: var(--cc-surface3-surface, var(--cc-surface2-surface, #f1f3f5));
  --tj-text: var(--cc-primary-text, #1b1f24);
  --tj-text-muted: var(--cc-placeholder-text, #6a727c);
  --tj-border: var(--cc-default-border, #d7dbdf);
  --tj-border-weak: var(--cc-weak-border, var(--cc-default-border, #e4e7eb));
  --tj-danger: var(--cc-error-systemStatus, #d72d39);
  --tj-success: var(--cc-success-systemStatus, #1e823b);
  --tj-warning: var(--cc-warning-systemStatus, #b54708);
}
`;

// One set of constructable stylesheets per library revision, adopted by every instance and popup layer, instead of
// a <style> copy of the library CSS in each shadow root (jsdom and old browsers fall back to <style> elements).
// release() drops a root from the sheets on unmount. Chrome's constructed sheet holds every tree scope that adopted
// it strongly, so a detached shadow root kept in adoptedStyleSheets stayed alive with its tj-cc-root and the ~140
// listeners React puts on every portal container: ~135 listeners and the widget's DOM leaked per mount (C-04).
type Sheets = {
  adopt: (root: ShadowRoot) => void;
  release: (root: ShadowRoot) => void;
  setLibraryCss: (css: string) => void;
};
const sheetsByLibrary = new Map<string, Sheets>();
const canAdopt = () =>
  typeof CSSStyleSheet !== 'undefined' &&
  'replaceSync' in CSSStyleSheet.prototype &&
  'adoptedStyleSheets' in Document.prototype;
const sheetsFor = (key: string): Sheets => {
  const known = sheetsByLibrary.get(key);
  if (known) return known;
  let sheets: Sheets;
  if (canAdopt()) {
    const make = (text: string) => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(text);
      return sheet;
    };
    const library = make('');
    const list = [make(BASE_CSS), library, make(TOKEN_CSS)];
    // Every instance hands its library's CSS over on mount; parsed once per content (Ant's is close to 1 MB, and a
    // page of 37 widgets parsed it 37 times on every page switch). Changed CSS (a dev rebuild) is still applied.
    let applied = '';
    sheets = {
      adopt: (root) => (root.adoptedStyleSheets = list),
      release: (root) => (root.adoptedStyleSheets = []),
      setLibraryCss: (css) => {
        if (css === applied) return;
        applied = css;
        library.replaceSync(css);
      },
    };
  } else {
    const roots = new Set<ShadowRoot>();
    let libraryCss = '';
    sheets = {
      adopt: (root) => {
        roots.add(root);
        [BASE_CSS, libraryCss, TOKEN_CSS].forEach((text, i) => {
          const el = document.createElement('style');
          el.textContent = text;
          el.dataset.tjSheet = String(i);
          root.prepend(el);
        });
      },
      release: (root) => {
        roots.delete(root);
        root.querySelectorAll('style[data-tj-sheet]').forEach((el) => el.remove());
      },
      setLibraryCss: (css) => {
        if (css === libraryCss) return;
        libraryCss = css;
        roots.forEach((root) =>
          root.querySelectorAll('style[data-tj-sheet="1"]').forEach((el) => (el.textContent = css))
        );
      },
    };
  }
  sheetsByLibrary.set(key, sheets);
  return sheets;
};

// One popup layer per library revision on the page (select lists, menus, dialogs), shared by its instances. It sits
// on document.body: WidgetWrapper positions every widget with a transform, which would make it the containing block
// of position:fixed popups.
const layers = new Map<string, { overlay: HTMLElement; host: HTMLElement; count: number; release: () => void }>();
const acquireLayer = (key: string, sheets: Sheets) => {
  const known = layers.get(key);
  if (known) {
    known.count += 1;
    return known;
  }
  const host = document.createElement('div');
  host.className = 'tj-cc-popup-host';
  const root = host.attachShadow({ mode: 'open' });
  sheets.adopt(root);
  const overlay = document.createElement('div');
  overlay.className = 'tj-cc-overlay';
  root.appendChild(overlay);
  document.body.appendChild(host);
  const release = isolateInteractiveEvents(host);
  const layer = {
    overlay,
    host,
    count: 1,
    release: () => {
      release();
      sheets.release(root);
      // A pack may keep the layer's root after it is gone (Ant's rc-util style cache is keyed by container): empty it,
      // so the popups and the listeners React put on the overlay go with the layer.
      root.replaceChildren();
      host.remove();
    },
  };
  layers.set(key, layer);
  return layer;
};
const releaseLayer = (key: string) => {
  const layer = layers.get(key);
  if (!layer) return;
  layer.count -= 1;
  if (layer.count <= 0) {
    layer.release();
    layers.delete(key);
  }
};

const isTextField = (node: EventTarget | undefined): boolean =>
  node instanceof HTMLElement &&
  (node.isContentEditable || node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT');

// The canvas drag (Gesto via react-moveable, Grid's `checkInput`) and the editor's hotkeys listen outside
// the shadow root, where an event's target is retargeted to the shadow host, so their "is this a text
// field?" checks never see the bundle's inputs: a press starts a widget drag (preventDefault, no focus)
// and keys go to hotkeys. Stop those events at the host when they start in a text field — or, for
// presses, inside a `[data-tj-no-drag]` region (sliders etc.), like Grid's per-widget inner-element rule.
const PRESS_EVENTS = ['mousedown', 'touchstart'] as const;
const KEY_EVENTS = ['keydown', 'keyup', 'keypress'] as const;

export const isolateInteractiveEvents = (host: HTMLElement): (() => void) => {
  const onPress = (e: Event) => {
    const origin = e.composedPath()[0];
    if (isTextField(origin) || (origin instanceof Element && origin.closest('[data-tj-no-drag]'))) e.stopPropagation();
  };
  const onKey = (e: Event) => {
    if (isTextField(e.composedPath()[0])) e.stopPropagation();
  };
  PRESS_EVENTS.forEach((type) => host.addEventListener(type, onPress));
  KEY_EVENTS.forEach((type) => host.addEventListener(type, onKey));
  return () => {
    PRESS_EVENTS.forEach((type) => host.removeEventListener(type, onPress));
    KEY_EVENTS.forEach((type) => host.removeEventListener(type, onKey));
  };
};

interface InlineLibraryComponentProps {
  bundleUrl: string;
  cssUrl: string;
  cacheKey: string;
  // A dev slot's files change behind the same URL on every push, so they bypass the browser cache.
  isDevBuild?: boolean;
  componentName: string;
  componentProps: Record<string, unknown>;
  componentStyles: Record<string, unknown>;
  // Renders the ToolJet drop area for a slot the bundle mounted (see ToolJet.Slot).
  renderSlot: (name: string) => React.ReactNode;
  setExposedVariable: (key: string, value: unknown) => void;
  fireEvent: (name: string, options?: Record<string, unknown>) => void;
  actions: Map<string, (...args: unknown[]) => unknown>;
  boxShadow?: string;
  dataCy?: string;
  // Pack contract v2 (LibraryComponent.jsx): the host capabilities, the root sized to its content instead of the
  // box, more light-DOM children (list rows) and drop areas drawn inside the popup layer.
  host?: PackHost;
  fit?: boolean;
  /** The box is stretched to its row's height (an Equal heights row): the root gets tj-cc-stretch and fills it. */
  stretch?: boolean;
  /** The app theme reaches the pack as --tj-* tokens (TOKEN_CSS). */
  themed?: boolean;
  /** The app is in dark mode: native parts (scrollbars, date inputs) draw dark too. */
  darkMode?: boolean;
  hostRef?: React.Ref<HTMLDivElement>;
  light?: React.ReactNode;
  popupSlotNames?: string[];
  renderPopupSlot?: (name: string) => React.ReactNode;
}

const InlineLibraryComponent = ({
  bundleUrl,
  cssUrl,
  cacheKey,
  isDevBuild = false,
  componentName,
  componentProps,
  componentStyles,
  renderSlot,
  setExposedVariable,
  fireEvent,
  actions,
  boxShadow,
  dataCy,
  host,
  fit = false,
  stretch = false,
  themed = true,
  darkMode = false,
  hostRef: outerRef,
  light,
  popupSlotNames = [],
  renderPopupSlot,
}: InlineLibraryComponentProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [shadow, setShadow] = useState<{ mount: HTMLElement; popupHost: HTMLElement } | null>(null);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Slots the bundle currently renders, in mount order. Counted, so two ToolJet.Slot elements with the
  // same name (e.g. during a keyed remount) share one drop area until the last one unmounts.
  const [slotNames, setSlotNames] = useState<string[]>([]);
  const slotCounts = useRef(new Map<string, number>());
  const registerSlot = useCallback((name: string) => {
    const counts = slotCounts.current;
    counts.set(name, (counts.get(name) ?? 0) + 1);
    if (counts.get(name) === 1) setSlotNames((names) => [...names, name]);
    return () => {
      const remaining = (counts.get(name) ?? 1) - 1;
      if (remaining > 0) {
        counts.set(name, remaining);
        return;
      }
      counts.delete(name);
      setSlotNames((names) => names.filter((n) => n !== name));
    };
  }, []);

  const sheetKey = cacheKey;
  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const sheets = sheetsFor(sheetKey);
    const root = el.shadowRoot ?? el.attachShadow({ mode: 'open' });
    root.replaceChildren();
    sheets.adopt(root);
    const mount = document.createElement('div');
    mount.className = 'tj-cc-root';
    root.appendChild(mount);
    // The bundle portals its popups into `shadowRoot.tjOverlay` (the library's shared popup layer).
    const layer = acquireLayer(sheetKey, sheets);
    Object.defineProperty(root, 'tjOverlay', { value: layer.overlay, configurable: true });
    const releaseHost = isolateInteractiveEvents(el);
    setShadow({ mount, popupHost: layer.host });
    return () => {
      releaseHost();
      releaseLayer(sheetKey);
      sheets.release(root);
      // A pack may keep the root after the unmount (Ant's icons register every shadow root in rc-util's style
      // container cache): empty it, so it no longer reaches the mount, its listeners or the popup layer.
      delete (root as ShadowRoot & { tjOverlay?: HTMLElement }).tjOverlay;
      root.replaceChildren();
      // And through root.host the kept root reached the whole unmounted page. Once React has removed the tree, cut the
      // host out of it; a host still connected (a hidden Suspense tree, a sheet change) is left alone.
      setTimeout(() => {
        if (el.isConnected) return;
        el.remove();
        el.replaceChildren();
      }, 0);
    };
  }, [sheetKey]);

  useLayoutEffect(() => {
    shadow?.mount.classList.toggle('tj-cc-fit', fit);
    shadow?.mount.classList.toggle('tj-cc-stretch', stretch);
    hostRef.current?.classList.toggle('tj-themed', themed);
    // Popups (menus, pickers, dialogs) draw in the shared popup host, outside the widget: it takes the same theme
    // contract, or every popup fell back to the pack's stock colours, font and radius under an applied theme.
    // The layer is shared by a library's widgets, which an app themes alike.
    shadow?.popupHost?.classList.toggle('tj-themed', themed);
    // The browser draws scrollbars and other native parts from color-scheme: unset, a scrolling card in a dark app kept
    // a light scrollbar. The popup layer follows too.
    const scheme = darkMode ? 'dark' : 'light';
    if (hostRef.current) hostRef.current.style.colorScheme = scheme;
    if (shadow?.popupHost) shadow.popupHost.style.colorScheme = scheme;
  }, [shadow, fit, stretch, themed, darkMode]);

  useEffect(() => {
    let cancelled = false;
    setComponent(null);
    setLoadError(null);
    loadLibraryModule(bundleUrl, cacheKey, { isDevBuild })
      .then((mod) => {
        const exported = mod[componentName] as React.ComponentType<any> | undefined;
        if (!exported) throw new Error(`export "${componentName}" not found in bundle`);
        if (!cancelled) setComponent(() => exported);
      })
      .catch((err) => {
        const message = String(err?.message ?? err);
        console.error(`[LibraryComponent] ${message}`);
        if (!cancelled) setLoadError(message);
      });
    return () => {
      cancelled = true;
    };
  }, [bundleUrl, cacheKey, isDevBuild, componentName]);

  useEffect(() => {
    let cancelled = false;
    loadLibraryCss(cssUrl, cacheKey, { isDevBuild }).then((css) => {
      if (!cancelled) sheetsFor(sheetKey).setLibraryCss(css ?? '');
    });
    return () => {
      cancelled = true;
    };
  }, [cssUrl, cacheKey, isDevBuild, sheetKey]);

  // Latest callbacks behind a stable facade, so the context value changes only when props do.
  const latest = useRef({ setExposedVariable, fireEvent });
  latest.current = { setExposedVariable, fireEvent };

  const instance = useMemo<LibraryInstance>(
    () => ({
      props: componentProps,
      styles: componentStyles,
      setExposedVariable: (key, value) => latest.current.setExposedVariable(key, value),
      fireEvent: (name) => latest.current.fireEvent(name, { isCustomComponentEvent: true }),
      actions,
      registerSlot,
      host,
    }),
    [componentProps, componentStyles, actions, registerSlot, host]
  );

  let content: React.ReactNode = null;
  if (loadError) content = <div className="tj-cc-error">{loadError}</div>;
  else if (Component)
    content = (
      <LibraryInstanceContext.Provider value={instance}>
        <Component {...componentProps} />
      </LibraryInstanceContext.Provider>
    );

  const setRef = (el: HTMLDivElement | null) => {
    hostRef.current = el;
    if (typeof outerRef === 'function') outerRef(el);
    else if (outerRef) (outerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  return (
    <div
      ref={setRef}
      data-cy={dataCy}
      className={fit && !stretch ? 'tw-w-full tw-block' : 'tw-w-full tw-h-full tw-block'}
      style={{ boxShadow }}
    >
      {shadow && createPortal(content, shadow.mount)}
      {/* Light-DOM children, projected into the bundle's <slot> elements. */}
      {slotNames.map((name) => (
        <div key={name} slot={slotAttributeName(name)} className="tw-block tw-w-full tw-h-full">
          {renderSlot(name)}
        </div>
      ))}
      {light}
      {/* Drop areas inside popups: children of the popup layer's host, projected into the popup's <slot>. */}
      {shadow && renderPopupSlot && host
        ? popupSlotNames.map((name) =>
            createPortal(
              <div slot={host.popupSlotAttr(name)} className="tw-block tw-w-full tw-h-full">
                {renderPopupSlot(name)}
              </div>,
              shadow.popupHost,
              name
            )
          )
        : null}
    </div>
  );
};

export default InlineLibraryComponent;
