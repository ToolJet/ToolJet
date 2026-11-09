import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

import {
  LibraryInstance,
  LibraryInstanceContext,
  PackHost,
  loadLibraryCss,
  loadLibraryModule,
  slotAttributeName,
} from './inlineRuntime';
import { setActionRegistrySettled } from './actionRegistry';
import { MODAL_ATTR, installModalFocusTrap, restoreFocusInside } from './packFocus';
import useStore from '@/AppBuilder/_stores/store';

// Shadow-root baseline. ToolJet's global CSS stays out, while inherited properties and theme custom
// properties (--cc-*, --text-*) still flow in. The body is non-scrollable and sized by the widget box.
// A render error inside the bundle is caught by RenderWidget's FallbackBoundary (portals bubble).
const BASE_CSS = `
:host { display: block; position: relative; font-family: var(--cc-font-family, inherit); }
.tj-cc-root { width: 100%; height: 100%; overflow: hidden; }
/* A control that fills its box draws its focus ring (Ant's 2px glow, the shadcn pack's 1px ring) just outside it: clipped
   at the box, an Ant input in the editor kept its ring on the top edge only, under its label. Paint 4px past the box. */
@supports (overflow-clip-margin: 4px) { .tj-cc-root { overflow: clip; overflow-clip-margin: 4px; } }
.tj-cc-root.tj-cc-fit { height: auto; overflow: visible; }
.tj-cc-root.tj-cc-fit > * { height: auto; }
.tj-cc-root.tj-cc-fit.tj-cc-stretch, .tj-cc-root.tj-cc-fit.tj-cc-stretch > * { height: 100%; }
*, *::before, *::after { box-sizing: border-box; }
.tj-cc-error { padding: 8px; font: 12px/1.4 monospace; color: var(--text-danger); white-space: pre-wrap; }
/* The component's code failed to load (QA item 19): a plain note with Retry, and the components inside it below. */
.tj-cc-load-error { display: flex; flex-direction: column; gap: 8px; width: 100%; height: 100%; padding: 8px;
  border: 1px dashed var(--borders-default); border-radius: 6px; color: var(--text-placeholder); font-size: 12px;
  font-family: inherit; white-space: normal; }
.tj-cc-load-error-note { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tj-cc-load-error-note button { padding: 2px 8px; border: 1px solid var(--borders-default); border-radius: 4px;
  background: transparent; color: var(--text-default); font: inherit; cursor: pointer; }
.tj-cc-load-error-slot { position: relative; flex: 1 1 0; min-height: 40px; }
`;

// When a library's code fails to load, it is tried again on its own after these delays, then Retry is offered.
export const LOAD_RETRY_DELAYS_MS = [2000, 5000];

// The components whose library's code failed to load, by cacheKey: once one of them loads it (a Retry), the others try
// again too, so one Retry brings back every component from that library, not only the one it was pressed on.
const waitingForLibrary = new Map<string, Set<() => void>>();
const waitForLibrary = (cacheKey: string, retry: () => void) => {
  const waiting = waitingForLibrary.get(cacheKey) ?? new Set();
  waiting.add(retry);
  waitingForLibrary.set(cacheKey, waiting);
  return () => {
    waiting.delete(retry);
    if (!waiting.size && waitingForLibrary.get(cacheKey) === waiting) waitingForLibrary.delete(cacheKey);
  };
};
// Each waiting component is told once and let go (it waits again only if its own try fails), so one that fails for
// another reason (its export missing from the code) cannot set off a round of retries on every load.
const libraryLoaded = (cacheKey: string) => {
  const waiting = waitingForLibrary.get(cacheKey);
  if (!waiting) return;
  waitingForLibrary.delete(cacheKey);
  waiting.forEach((retry) => retry());
};

// After the library's own CSS: ToolJet's theme tokens that a pack reads through the standard --tj-* names (radius
// scale, text on the brand colour, status colours, surfaces), so a shipped theme restyles every pack the same way.
// A pack maps them onto its own variables (the shadcn pack: --ui-*), or reads them directly.
// The app theme as --tj-* tokens, defined only when the host has tj-themed: a pack drawn in its own design system
// (manifest themeMode "own") gets them only once the app applies a theme, and falls back to its stock look otherwise.
// A theme's small and large radius are optional, and 0 means not set (the shipped ToolJet themes save 6/0/0): either
// one at 0 follows the default radius as stock Ant's scale does (6/4/8), else Ant drew square cards, tags and Segmented
// thumbs beside 6px inputs. max(set, min(derived, (1px - set) * 1000)) is the set value from 1px up, the derived one at 0.
const TOKEN_CSS = `
:host(.tj-themed) {
  --tj-radius: var(--cc-radius-default, 6px);
  --tj-radius-small: max(var(--cc-radius-small, 0px), min(max(0px, var(--tj-radius) - 2px), (1px - var(--cc-radius-small, 0px)) * 1000));
  --tj-radius-large: max(var(--cc-radius-large, 0px), min(var(--tj-radius) + min(var(--tj-radius), 2px), (1px - var(--cc-radius-large, 0px)) * 1000));
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
  /** The library's CSS has been applied once: a component drawn before that showed unstyled for a moment. */
  hasCss: () => boolean;
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
    let loaded = false;
    sheets = {
      adopt: (root) => (root.adoptedStyleSheets = list),
      release: (root) => (root.adoptedStyleSheets = []),
      setLibraryCss: (css) => {
        loaded = true;
        if (css === applied) return;
        applied = css;
        library.replaceSync(css);
      },
      hasCss: () => loaded,
    };
  } else {
    const roots = new Set<ShadowRoot>();
    let libraryCss = '';
    let loaded = false;
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
        loaded = true;
        if (css === libraryCss) return;
        libraryCss = css;
        roots.forEach((root) =>
          root.querySelectorAll('style[data-tj-sheet="1"]').forEach((el) => (el.textContent = css))
        );
      },
      hasCss: () => loaded,
    };
  }
  sheetsByLibrary.set(key, sheets);
  return sheets;
};

// One popup layer per library revision and level (select lists, menus, dialogs), shared by its instances there. It sits
// outside every widget: WidgetWrapper positions each widget with a transform, which would make it the containing block
// of position:fixed popups.
// The store writes a pack component makes as it mounts (each ToolJet.useStateX publishes its value, useValidation its
// isValid and isMandatory) are held in the store's exposed-value batch and applied together, in one store update, once
// the mount's effects have run. Each write on its own re-ran every widget's store selectors, so a page of N pack
// widgets cost N x writes x N selector runs: 100 Ant fields took ~3 s to switch to, a native page of 100 ~0.4 s. The
// batch is ref-counted (a page switch holds one too): every widget mounting in one commit opens it in its layout
// effect, before any passive effect of that commit runs, and the last one to close applies all the writes.
export const holdStoreWrites = (): (() => void) => {
  const state = useStore.getState() as { startExposedValueBatch?: () => void; flushExposedValueBatch?: () => void };
  if (typeof state.startExposedValueBatch !== 'function') return () => {};
  state.startExposedValueBatch();
  let open = true;
  return () => {
    if (!open) return;
    open = false;
    (useStore.getState() as { flushExposedValueBatch: () => void }).flushExposedValueBatch();
  };
};

// Where a layer is drawn and how it stacks. Every pack drew into one layer on document.body, above the whole app, so the
// packs' own z-indexes decided between packs (Rocket 50, Ant 1000-1050, MUI 1300): an Ant Select in an MUI Dialog opened
// behind it, and a ToolJet Modal, drawn in the canvas (its own stacking context), could never open above a pack dialog.
// A layer now sits in the canvas as the ToolJet Modal does (ModalV2's container), at an explicit level: canvas-level
// widgets just under a ToolJet Modal (1060), and a widget drawn inside a dialog (another layer, or a ToolJet Modal) in a
// layer of its own one level above that dialog. Each layer is its own stacking context, so a pack's z-indexes only order
// its popups within it. It covers the canvas without taking clicks; its popups take them, whatever a modal library set on
// the page's body.
const CANVAS_LAYER_Z = 1055;
const TOOLJET_MODAL_Z = 1060;
const LAYER_HOST = 'tj-cc-popup-host';
const canvasArea = (): HTMLElement => document.querySelector<HTMLElement>('.tj-canvas-area') ?? document.body;
/** The dialog a widget is drawn in: a pack's popup layer (a dialog body's components are its light-DOM children) or a
 *  ToolJet Modal; null on the canvas. */
const dialogOf = (widgetHost: HTMLElement): HTMLElement | null =>
  widgetHost.parentElement?.closest<HTMLElement>(`.${LAYER_HOST}, .modal`) ?? null;
const levelOf = (dialog: HTMLElement | null): number => {
  if (!dialog) return CANVAS_LAYER_Z;
  const z = Number.parseInt(dialog.style.zIndex || getComputedStyle(dialog).zIndex, 10);
  return (Number.isFinite(z) ? z : dialog.classList.contains(LAYER_HOST) ? CANVAS_LAYER_Z : TOOLJET_MODAL_Z) + 1;
};
const elementIds = new WeakMap<Element, number>();
let lastElementId = 0;
const idOf = (el: Element | null): number => {
  if (!el) return 0;
  if (!elementIds.has(el)) elementIds.set(el, (lastElementId += 1));
  return elementIds.get(el) as number;
};

// A page taller than the window scrolls the whole canvas inside the app's scroller, so a layer the canvas's size drew a
// centred dialog half a page down and a drawer past the window's bottom. A canvas layer covers only what is visible of
// the canvas (within its scroller and the window), follows it as the page scrolls or the canvas resizes, and is the
// containing block its dialogs and drawers fill (the transform).
const scrollerOf = (el: HTMLElement): HTMLElement | null => {
  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) return node;
  }
  return null;
};
const fitToView = (host: HTMLElement, container: HTMLElement) => {
  const area = container.getBoundingClientRect();
  const view = scrollerOf(container)?.getBoundingClientRect();
  const top = Math.max(area.top, view?.top ?? 0, 0);
  const bottom = Math.min(area.bottom, view?.bottom ?? Infinity, window.innerHeight);
  host.style.top = `${top - area.top}px`;
  host.style.height = `${Math.max(0, bottom - top)}px`;
};

type Layer = { overlay: HTMLElement; host: HTMLElement; container: HTMLElement; count: number; release: () => void };
const layers = new Map<string, Layer>();
// One watch per canvas while it has layers: a scroll anywhere (capture), a window resize or the canvas resizing refits
// them once per frame.
const views = new Map<HTMLElement, () => void>();
const watchView = (container: HTMLElement) => {
  if (views.has(container)) return;
  let frame = 0;
  const fit = () => {
    frame = 0;
    layers.forEach((layer) => {
      if (layer.container === container) fitToView(layer.host, container);
    });
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(fit);
  };
  document.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
  const resized = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
  resized?.observe(container);
  views.set(container, () => {
    cancelAnimationFrame(frame);
    document.removeEventListener('scroll', schedule, true);
    window.removeEventListener('resize', schedule);
    resized?.disconnect();
  });
};
const unwatchView = (container: HTMLElement) => {
  if ([...layers.values()].some((layer) => layer.container === container)) return;
  views.get(container)?.();
  views.delete(container);
};

const acquireLayer = (library: string, sheets: Sheets, widgetHost: HTMLElement) => {
  const container = canvasArea();
  const dialog = dialogOf(widgetHost);
  const key = `${library}|${idOf(container)}|${idOf(dialog)}`;
  const known = layers.get(key);
  if (known) {
    known.count += 1;
    return { key, layer: known };
  }
  const host = document.createElement('div');
  host.className = LAYER_HOST;
  const inCanvas = container !== document.body;
  Object.assign(host.style, {
    position: 'absolute',
    ...(inCanvas ? { left: '0', width: '100%', transform: 'translateZ(0)' } : { inset: '0' }),
    pointerEvents: 'none',
    zIndex: String(levelOf(dialog)),
  });
  const root = host.attachShadow({ mode: 'open' });
  sheets.adopt(root);
  const overlay = document.createElement('div');
  overlay.className = 'tj-cc-overlay';
  overlay.style.pointerEvents = 'auto';
  root.appendChild(overlay);
  container.appendChild(host);
  const release = isolateInteractiveEvents(host);
  const layer: Layer = {
    overlay,
    host,
    container,
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
  installModalFocusTrap(openPackModals);
  if (inCanvas) {
    fitToView(host, container);
    watchView(container);
  }
  return { key, layer };
};
// The open pack dialogs on the page, bottom to top: by layer level, then in drawing order.
const openPackModals = (): Element[] =>
  [...layers.values()]
    .filter((layer) => layer.host.isConnected)
    .sort((a, b) => (Number(a.host.style.zIndex) || 0) - (Number(b.host.style.zIndex) || 0))
    .flatMap((layer) => Array.from(layer.overlay.querySelectorAll(`[${MODAL_ATTR}="open"]`)));

const releaseLayer = (key: string) => {
  const layer = layers.get(key);
  if (!layer) return;
  layer.count -= 1;
  if (layer.count <= 0) {
    layer.release();
    layers.delete(key);
    unwatchView(layer.container);
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
// Keys are stopped from any control inside the shadow root, not only text fields: a slider thumb, an open select list or
// a calendar day holds focus too, and the hotkeys took its keys (ArrowRight moved the selected widget, Backspace asked
// to delete it, Cmd+C copied it, Cmd+A selected the canvas). The pack's own handlers have run by then. Escape from a
// control that is not a text field still goes out, so a ToolJet Modal around the pack closes on it.
// Native components in a ToolJet.Slot are the host's light-DOM children: nothing retargets their events, so the canvas
// and hotkeys see them as usual, and they need theirs to reach React (a Text Input's Enter fires on keyup). Only events
// from inside the shadow root are stopped; `contains` does not cross into it.
const PRESS_EVENTS = ['mousedown', 'touchstart'] as const;
const KEY_EVENTS = ['keydown', 'keyup', 'keypress'] as const;

// The single-line fields whose Enter submits their form (HTML's implicit submission); a textarea's makes a new line.
const SUBMITTING_INPUTS = new Set([
  'text',
  'search',
  'url',
  'tel',
  'email',
  'password',
  'number',
  'date',
  'datetime-local',
  'month',
  'time',
  'week',
]);

// Enter in a field of a <form> clicks the form's default button, its first submit button: a ToolJet Form's Submit
// Button, whose click submits the Form. A pack's field is in the widget's shadow root, which the <form> does not reach,
// so the browser never did that for it and Enter in a pack input inside a Form submitted nothing. The host does it as
// the browser does: for a single-line field, not mid-composition (IME), when the component left the Enter alone. A
// field whose list is open (aria-expanded) takes Enter as picking from it: Ant's AutoComplete picks without marking it.
const submitOnEnter = (host: HTMLElement, origin: EventTarget | undefined, e: KeyboardEvent) => {
  if (e.key !== 'Enter' || e.isComposing || e.defaultPrevented) return;
  if (!(origin instanceof HTMLInputElement) || !SUBMITTING_INPUTS.has(origin.type)) return;
  if (origin.getAttribute('aria-expanded') === 'true') return;
  const form = host.closest('form');
  const submit = form
    ? Array.from(form.elements).find(
        (el): el is HTMLButtonElement | HTMLInputElement =>
          (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) && el.type === 'submit'
      )
    : undefined;
  if (submit && !submit.disabled) submit.click();
};

// A part that drags itself (a Kanban card, marked [data-tj-inner-drag]) needs the press from the first one: the canvas
// cannot see the mark inside the shadow root and took the press as a widget drag, so the card never moved (QA item 24).
// The canvas selects a widget on that same press, so the host, stopping it, selects the widget in its place
// (`onInnerPress`, given only in the editor). A press with a modifier (adding to a selection) or another button (the
// widget's menu) is the editor's, as before.
const isPlainPress = (e: Event) =>
  !(e instanceof MouseEvent) || (e.button === 0 && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey);

// `options` is read at each press, so a host can change it (the editor's mode) without adding its listeners again.
export const isolateInteractiveEvents = (
  host: HTMLElement,
  options: { onInnerPress?: () => void } = {}
): (() => void) => {
  const fromShadow = (origin: EventTarget | undefined) => !(origin instanceof Node && host.contains(origin));
  const onPress = (e: Event) => {
    const origin = e.composedPath()[0];
    if (!fromShadow(origin)) return;
    if (isTextField(origin) || (origin instanceof Element && origin.closest('[data-tj-no-drag]'))) {
      e.stopPropagation();
      return;
    }
    const { onInnerPress } = options;
    if (onInnerPress && origin instanceof Element && origin.closest('[data-tj-inner-drag]') && isPlainPress(e)) {
      e.stopPropagation();
      onInnerPress();
    }
  };
  const onKey = (e: Event) => {
    const origin = e.composedPath()[0];
    if (!fromShadow(origin)) return;
    if (isTextField(origin) || (e as KeyboardEvent).key !== 'Escape') e.stopPropagation();
    if (e.type === 'keydown') submitOnEnter(host, origin, e as KeyboardEvent);
  };
  PRESS_EVENTS.forEach((type) => host.addEventListener(type, onPress));
  KEY_EVENTS.forEach((type) => host.addEventListener(type, onKey));
  return () => {
    PRESS_EVENTS.forEach((type) => host.removeEventListener(type, onPress));
    KEY_EVENTS.forEach((type) => host.removeEventListener(type, onKey));
  };
};

const NO_SLOTS: string[] = [];

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
  /** The widget's saved height: a fitted box keeps it until the component draws, so the dynamic height measure does
   *  not read the empty box (the page's widgets collapsed onto each other, then jumped to their heights). */
  reserveHeight?: number;
  /** The app theme reaches the pack as --tj-* tokens (TOKEN_CSS). */
  themed?: boolean;
  /** The app is in dark mode: native parts (scrollbars, date inputs) draw dark too. */
  darkMode?: boolean;
  hostRef?: React.Ref<HTMLDivElement>;
  light?: React.ReactNode;
  popupSlotNames?: string[];
  renderPopupSlot?: (name: string) => React.ReactNode;
  /** In the editor: a press on a part that drags itself (a Kanban card) selects the widget (isolateInteractiveEvents). */
  onInnerPress?: () => void;
  /** The slots that hold components: drawn under the load failure note, so they stay on the canvas when the code
   *  that would place them has not loaded. */
  fallbackSlotNames?: string[];
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
  reserveHeight,
  themed = true,
  darkMode = false,
  hostRef: outerRef,
  light,
  popupSlotNames = [],
  renderPopupSlot,
  onInnerPress,
  fallbackSlotNames = NO_SLOTS,
}: InlineLibraryComponentProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  // Read at each press: the host's listeners are added once per shadow root.
  const pressOptions = useRef<{ onInnerPress?: () => void }>({});
  pressOptions.current.onInnerPress = onInnerPress;
  const [shadow, setShadow] = useState<{ mount: HTMLElement; popupHost: HTMLElement } | null>(null);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  // Drawn once the library's CSS is applied (at once when another instance already loaded it), not unstyled first.
  const [cssReady, setCssReady] = useState(() => sheetsFor(cacheKey).hasCss());
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
    const { key: layerKey, layer } = acquireLayer(sheetKey, sheets, el);
    Object.defineProperty(root, 'tjOverlay', { value: layer.overlay, configurable: true });
    const releaseHost = isolateInteractiveEvents(el, pressOptions.current);
    const releaseFocus = restoreFocusInside(el, root);
    setShadow({ mount, popupHost: layer.host });
    return () => {
      releaseHost();
      releaseFocus();
      releaseLayer(layerKey);
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

  // The host already dims a disabled widget's box. It marks the root too, so a component whose controls dim
  // themselves when disabled can keep them at full opacity (the pack's CSS reads the mark) instead of dimming twice.
  const hostDisabled = !!host?.disabled;
  const popupBlocked = hostDisabled || !!host?.loading;
  const popupDisabled = hostDisabled && !host?.loading;
  useLayoutEffect(() => {
    shadow?.mount.toggleAttribute('data-tj-host-disabled', hostDisabled);
  }, [shadow, hostDisabled]);

  // Each load of the code (and the stylesheet) is one attempt. A failed one is tried again on its own after each of
  // LOAD_RETRY_DELAYS_MS; once those fail too the component says it couldn't load and offers Retry, and tries again
  // when the browser comes back online (QA item 19). The loader lets a failed load go, so each attempt fetches anew.
  const [attempt, setAttempt] = useState(0);
  const autoRetries = useRef(0);
  useEffect(() => {
    autoRetries.current = 0;
  }, [bundleUrl, cacheKey, componentName]);
  // Retry and coming back online try once more: one that fails shows the note again at once.
  const retry = useCallback(() => {
    autoRetries.current = LOAD_RETRY_DELAYS_MS.length;
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    setComponent(null);
    setLoadError(null);
    loadLibraryModule(bundleUrl, cacheKey, { isDevBuild })
      .then((mod) => {
        const exported = mod[componentName] as React.ComponentType<any> | undefined;
        // The code loaded: the components from it still showing the note try again (they take it from the cache).
        libraryLoaded(cacheKey);
        if (!exported) throw new Error(`export "${componentName}" not found in bundle`);
        if (!cancelled) setComponent(() => exported);
      })
      .catch((err) => {
        const message = String(err?.message ?? err);
        // The cause is for developers: logged here, while the component shows a plain note.
        console.error(`[LibraryComponent] ${message}`);
        if (cancelled) return;
        const delay = LOAD_RETRY_DELAYS_MS[autoRetries.current];
        if (delay === undefined) {
          setLoadError(message);
          return;
        }
        autoRetries.current += 1;
        retryTimer = setTimeout(() => setAttempt((n) => n + 1), delay);
      });
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [bundleUrl, cacheKey, isDevBuild, componentName, attempt]);

  useEffect(() => {
    if (!loadError) return undefined;
    window.addEventListener('online', retry);
    const stopWaiting = waitForLibrary(cacheKey, retry);
    return () => {
      window.removeEventListener('online', retry);
      stopWaiting();
    };
  }, [loadError, retry, cacheKey]);

  useEffect(() => {
    let cancelled = false;
    setCssReady(sheetsFor(sheetKey).hasCss());
    loadLibraryCss(cssUrl, cacheKey, { isDevBuild })
      .then((css) => {
        if (!cancelled) sheetsFor(sheetKey).setLibraryCss(css ?? '');
      })
      // A stylesheet that fails to load must not keep the component from drawing.
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCssReady(true);
      });
    return () => {
      cancelled = true;
    };
    // attempt: a retry fetches a stylesheet that failed to load too.
  }, [cssUrl, cacheKey, isDevBuild, sheetKey, attempt]);

  // Latest callbacks behind a stable facade, so the context value changes only when props do.
  // The component's first commit: its mount effects' store writes go out as one update (holdStoreWrites). Opened in a
  // layout effect, closed in this component's passive effect, which runs after its children's (the pack component's)
  // passive effects; a timer closes it should the passive effects be dropped.
  const mountHold = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    if (!Component) return undefined;
    const release = holdStoreWrites();
    mountHold.current = release;
    const fallback = setTimeout(release, 0);
    return () => {
      clearTimeout(fallback);
      release();
    };
  }, [Component]);
  useEffect(() => {
    if (!Component) return;
    mountHold.current?.();
    mountHold.current = null;
  }, [Component]);

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
  const drawn = !!loadError || (!!Component && cssReady);
  // Once the component has drawn, its ToolJet.useAction handlers are registered (its effects run before this one), and
  // once its bundle has failed none will be: an action still waiting for a handler it has not registered stops waiting.
  useEffect(() => {
    setActionRegistrySettled(actions, drawn);
  }, [actions, drawn]);
  // A failed load draws the slots that hold components itself (the code that would place them never ran).
  const lightSlotNames = loadError ? [...new Set([...slotNames, ...fallbackSlotNames])] : slotNames;
  if (loadError)
    content = (
      // tj-cc-error: what tells a load failure apart from a drawn component.
      <div className="tj-cc-error tj-cc-load-error" data-tj-load-error="" role="alert">
        <div className="tj-cc-load-error-note">
          <span>This component couldn&apos;t load.</span>
          {/* data-tj-no-drag: in the editor a press on it is a click, not the start of a widget drag. */}
          <button type="button" data-tj-no-drag="" onClick={retry}>
            Retry
          </button>
        </div>
        {fallbackSlotNames.map((name) => (
          <div key={name} className="tj-cc-load-error-slot">
            <slot name={slotAttributeName(name)} />
          </div>
        ))}
      </div>
    );
  else if (Component && cssReady)
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
      style={{ boxShadow, ...(fit && !stretch && !drawn && reserveHeight ? { minHeight: reserveHeight } : {}) }}
    >
      {shadow && createPortal(content, shadow.mount)}
      {/* Light-DOM children, projected into the bundle's <slot> elements. */}
      {lightSlotNames.map((name) => (
        <div key={name} slot={slotAttributeName(name)} className="tw-block tw-w-full tw-h-full">
          {renderSlot(name)}
        </div>
      ))}
      {light}
      {/* Drop areas inside popups: children of the popup layer's host, projected into the popup's <slot>. They draw
          outside the widget, so the widget's inert (disabled or loading, it takes no input) never reached them: a
          disabled Dialog's body stayed usable (QA item 34). They take no input as the widget does, and are
          aria-disabled and dimmed while disabled, as ModalV2's body (a pack's popup refuses a choice there). */}
      {shadow && renderPopupSlot && host
        ? popupSlotNames.map((name) =>
            createPortal(
              <div
                slot={host.popupSlotAttr(name)}
                className={cn('tw-block tw-w-full tw-h-full', { 'tw-opacity-50': popupDisabled })}
                aria-disabled={popupDisabled ? 'true' : undefined}
                {...(popupBlocked ? { inert: '' } : {})}
              >
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
