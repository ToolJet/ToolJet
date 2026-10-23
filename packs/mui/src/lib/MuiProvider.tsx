import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { usePortalContainer } from './usePortalContainer';
import { createPackCache } from './emotion';
import { buildTheme, normalizeColor, readAppTheme, sameAppTheme, type AppTheme, type ThemeOverrides } from './theme';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// ToolJet writes the app theme (--cc-*) onto <html>'s style, and dark mode onto its and <body>'s classes: one observer
// per page bumps a version that every instance re-reads the app theme on. (Each instance also watches its shadow host:
// the host marks it tj-themed, which defines the --tj-* tokens, once the app applies a theme.)
let version = 0;
const listeners = new Set<() => void>();
let observer: MutationObserver | undefined;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (!observer && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => {
      version += 1;
      listeners.forEach((l) => l());
    });
    const attributeFilter = ['style', 'class', 'data-theme', 'data-bs-theme'];
    observer.observe(document.documentElement, { attributes: true, attributeFilter });
    if (document.body) observer.observe(document.body, { attributes: true, attributeFilter });
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      observer?.disconnect();
      observer = undefined;
    }
  };
};
const useThemeVersion = () => useSyncExternalStore(subscribe, () => version, () => 0);

const isSet = (v: unknown) => v !== undefined && v !== null && v !== '';

/** The component's Styles, by MUI theme path, applied over MUI's default theme. Empty = MUI's default. */
export const useThemeStyles = (): ThemeOverrides => {
  const primary = ToolJet.useStyleString({ name: 'primary', label: 'Primary (palette.primary.main)', inspector: 'color', initialValue: '' });
  const textPrimary = ToolJet.useStyleString({ name: 'textPrimary', label: 'Text (palette.text.primary)', inspector: 'color', initialValue: '' });
  const backgroundPaper = ToolJet.useStyleString({ name: 'backgroundPaper', label: 'Paper (palette.background.paper)', inspector: 'color', initialValue: '' });
  const divider = ToolJet.useStyleString({ name: 'divider', label: 'Divider (palette.divider)', inspector: 'color', initialValue: '' });
  const borderRadius = ToolJet.useStyleNumber({ name: 'borderRadius', label: 'Border radius (shape.borderRadius)', initialValue: '' });
  return useMemo(() => {
    const color = (v: unknown) => (isSet(v) ? normalizeColor(String(v)) : undefined);
    return {
      primary: color(primary),
      textPrimary: color(textPrimary),
      backgroundPaper: color(backgroundPaper),
      divider: color(divider),
      borderRadius: isSet(borderRadius) && !Number.isNaN(Number(borderRadius)) ? Number(borderRadius) : undefined,
    };
  }, [primary, textPrimary, backgroundPaper, divider, borderRadius]);
};

// MUI's typography is Roboto; like an MUI app, the page loads it once (from Google Fonts, MUI's CDN install). A font
// face declared inside a shadow root is not used, so it goes into the document. Without it, MUI's own fallback stack
// (Helvetica, Arial) applies.
const ROBOTO = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap';
const loadRoboto = () => {
  if (typeof document === 'undefined' || document.querySelector(`link[href="${ROBOTO}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = ROBOTO;
  document.head.appendChild(link);
};

/** The popup layer element (null until known): a component that portals while it is open renders only once it is set. */
const PopupContainer = createContext<HTMLElement | null>(null);
export const usePopupContainer = () => useContext(PopupContainer);

// Every pack component renders inside this: its own Emotion cache (styles into its shadow root and the popup layer),
// and MUI's ThemeProvider with MUI's default theme in the app's light or dark mode, popups portalled into the layer.
export const MuiProvider = ({
  children,
  overrides,
  fill = false,
  className,
  style,
}: {
  children: React.ReactNode;
  overrides?: ThemeOverrides;
  /** Fill the widget box (charts, grids, containers), instead of sizing to the content. */
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
}) => {
  const [anchorRef, container] = usePortalContainer();
  const cache = useMemo(createPackCache, []);
  const themeVersion = useThemeVersion();
  const [app, setApp] = useState<AppTheme>({ mode: 'light' });
  const [hostVersion, setHostVersion] = useState(0);
  // The children mount once the shadow root is attached, so every MUI element is created with its styles in place.
  // Mounted earlier, a style recalc before the attach (any layout read in a child's effect) gives them the browser's
  // defaults, and MUI's transitions then animate from those (grey buttons fading in). The build's server render
  // records the hooks with the children rendered straight away.
  const [attached, setAttached] = useState(typeof window === 'undefined');
  const overridesKey = JSON.stringify(overrides ?? {});

  useIsomorphicLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || !('attach' in cache.sheet)) return;
    const own = anchor.getRootNode();
    cache.sheet.attach(own instanceof ShadowRoot ? own : anchor.ownerDocument.head);
    setAttached(true);
    if (container) {
      const layer = container.getRootNode();
      cache.sheet.attach(layer instanceof ShadowRoot ? layer : container.ownerDocument.head);
    }
  }, [cache, container]);

  useIsomorphicLayoutEffect(() => {
    const root = anchorRef.current?.getRootNode();
    const host = root instanceof ShadowRoot ? root.host : null;
    if (!host || typeof MutationObserver === 'undefined') return;
    const watch = new MutationObserver(() => setHostVersion((v) => v + 1));
    watch.observe(host, { attributes: true, attributeFilter: ['class'] });
    return () => watch.disconnect();
  }, []);

  useIsomorphicLayoutEffect(() => {
    loadRoboto();
    const anchor = anchorRef.current;
    if (!anchor) return;
    const next = readAppTheme(anchor);
    setApp((prev) => (sameAppTheme(prev, next) ? prev : next));
  }, [themeVersion, hostVersion]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const theme = useMemo(() => buildTheme(app, overrides ?? {}, container), [app, overridesKey, container]);
  return (
    <div
      ref={anchorRef}
      className={['tj-mui tj-mui-root', fill ? 'tj-mui--fill' : '', className ?? ''].join(' ').trim()}
      style={{ fontFamily: app.font, ...style }}
    >
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <PopupContainer.Provider value={container}>{attached ? children : null}</PopupContainer.Provider>
        </ThemeProvider>
      </CacheProvider>
    </div>
  );
};
