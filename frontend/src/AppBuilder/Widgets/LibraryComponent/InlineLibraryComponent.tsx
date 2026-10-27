import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  LibraryInstance,
  LibraryInstanceContext,
  loadLibraryCss,
  loadLibraryModule,
  slotAttributeName,
} from './inlineRuntime';

// Shadow-root baseline. ToolJet's global CSS stays out, while inherited properties and theme custom
// properties (--cc-*, --text-*) still flow in. The body is non-scrollable and sized by the widget box.
// A render error inside the bundle is caught by RenderWidget's FallbackBoundary (portals bubble).
const BASE_CSS = `
:host { display: block; position: relative; }
.tj-cc-root { width: 100%; height: 100%; overflow: hidden; }
*, *::before, *::after { box-sizing: border-box; }
.tj-cc-error { padding: 8px; font: 12px/1.4 monospace; color: var(--text-danger); white-space: pre-wrap; }
`;

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

const isolateInteractiveEvents = (host: HTMLElement): (() => void) => {
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
}: InlineLibraryComponentProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadow, setShadow] = useState<{
    mount: HTMLElement;
    style: HTMLStyleElement;
    popupStyle: HTMLStyleElement;
  } | null>(null);
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

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    const base = document.createElement('style');
    base.textContent = BASE_CSS;
    const style = document.createElement('style');
    const mount = document.createElement('div');
    mount.className = 'tj-cc-root';
    root.replaceChildren(base, style, mount);

    // Popup layer for the bundle's select lists, menus and dialogs. WidgetWrapper positions every widget
    // with a transform, which would make it the containing block for position:fixed popups (a dialog
    // centred on the widget box, lists stacked under later widgets). So popups get their own shadow root
    // on document.body, with the same bundle CSS, exposed to the bundle as `shadowRoot.tjOverlay`.
    const popupHost = document.createElement('div');
    popupHost.className = 'tj-cc-popup-host';
    const popupRoot = popupHost.attachShadow({ mode: 'open' });
    const popupBase = document.createElement('style');
    popupBase.textContent = BASE_CSS;
    const popupStyle = document.createElement('style');
    const overlay = document.createElement('div');
    overlay.className = 'tj-cc-overlay';
    popupRoot.append(popupBase, popupStyle, overlay);
    document.body.appendChild(popupHost);
    Object.defineProperty(root, 'tjOverlay', { value: overlay, configurable: true });

    const releaseHost = isolateInteractiveEvents(host);
    const releasePopup = isolateInteractiveEvents(popupHost);

    setShadow({ mount, style, popupStyle });
    return () => {
      releaseHost();
      releasePopup();
      popupHost.remove();
    };
  }, []);

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
    if (!shadow) return;
    let cancelled = false;
    loadLibraryCss(cssUrl, cacheKey, { isDevBuild }).then((css) => {
      if (cancelled) return;
      shadow.style.textContent = css ?? '';
      shadow.popupStyle.textContent = css ?? '';
    });
    return () => {
      cancelled = true;
    };
  }, [shadow, cssUrl, cacheKey, isDevBuild]);

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
    }),
    [componentProps, componentStyles, actions, registerSlot]
  );

  let content: React.ReactNode = null;
  if (loadError) content = <div className="tj-cc-error">{loadError}</div>;
  else if (Component)
    content = (
      <LibraryInstanceContext.Provider value={instance}>
        <Component {...componentProps} />
      </LibraryInstanceContext.Provider>
    );

  return (
    <div ref={hostRef} data-cy={dataCy} className="tw-w-full tw-h-full tw-block" style={{ boxShadow }}>
      {shadow && createPortal(content, shadow.mount)}
      {/* Light-DOM children, projected into the bundle's <slot> elements. */}
      {slotNames.map((name) => (
        <div key={name} slot={slotAttributeName(name)} className="tw-block tw-w-full tw-h-full">
          {renderSlot(name)}
        </div>
      ))}
    </div>
  );
};

export default InlineLibraryComponent;
