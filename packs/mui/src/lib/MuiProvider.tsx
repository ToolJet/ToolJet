import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { usePortalContainer } from './usePortalContainer';
import { createPackCache } from './emotion';
import { buildTheme, readAppTheme, resolveOverrides, sameAppTheme, seriesPalette, type AppTheme, type ThemeOverrides } from './theme';
import { THEME_TOKEN, useColorStyle } from './themeStyle';

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

/**
 * The component's Styles, by MUI theme path, applied over the app theme or MUI's default theme. Each colour defaults
 * to the theme token it draws (themeStyle.ts); the radius has no default and shows the drawn value as its placeholder,
 * since a stored number would replace the app theme's radius.
 */
export const useThemeStyles = (): ThemeOverrides => {
  const primary = useColorStyle({ name: 'primary', label: 'Primary (palette.primary.main)', token: THEME_TOKEN.brand });
  const textPrimary = useColorStyle({ name: 'textPrimary', label: 'Text (palette.text.primary)', token: THEME_TOKEN.text });
  const backgroundPaper = useColorStyle({ name: 'backgroundPaper', label: 'Paper (palette.background.paper)', token: THEME_TOKEN.surface });
  const divider = useColorStyle({ name: 'divider', label: 'Divider (palette.divider)', token: THEME_TOKEN.borderWeak });
  const borderRadius = ToolJet.useStyleNumber({
    name: 'borderRadius',
    label: 'Border radius (shape.borderRadius)',
    placeholder: 'Theme radius (MUI: 4)',
    // A number field: the code field drew a blank optional number as invalid (red).
    inspector: 'numberInput',
    // No stored default: a '' default was saved on drop as {{""}}, shown as code in an invalid field.
  });
  return useMemo(
    () => ({
      // Colours stay as given (a var() included): MuiProvider resolves them where the component is drawn.
      primary,
      textPrimary,
      backgroundPaper,
      divider,
      borderRadius: isSet(borderRadius) && !Number.isNaN(Number(borderRadius)) ? Number(borderRadius) : undefined,
    }),
    [primary, textPrimary, backgroundPaper, divider, borderRadius]
  );
};

/** The brand the charts' default series palette leads with (undefined in an unthemed app without a Primary style),
 *  and the applied app theme (its tokens are undefined without one). */
const ChartLook = createContext<{ brand?: string; app: AppTheme }>({ app: { mode: 'light' } });

/** Whether the app applies a ToolJet theme (not the basic one): the pack then follows its tokens, else stock MUI. */
export const useIsThemed = () => !!useContext(ChartLook).app.brand;

/** A chart's series colours: its own colors list, else the brand-led palette, else undefined (MUI X's own). */
export const useSeriesColors = (given: string[]): string[] | undefined => {
  const { brand, app } = useContext(ChartLook);
  return useMemo(
    () => (given.length ? given : brand ? seriesPalette(brand, app.brand ? app : undefined) : undefined),
    [given.join('\u0000'), brand, app] // eslint-disable-line react-hooks/exhaustive-deps
  );
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
  rootRef,
}: {
  children: React.ReactNode;
  overrides?: ThemeOverrides;
  /** Fill the widget box (charts, grids, containers), instead of sizing to the content. */
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Also given the root element: what a component's popup guard (useOwnerGuard) checks for disabled or hidden. */
  rootRef?: React.MutableRefObject<HTMLDivElement | null>;
}) => {
  const [anchorRef, container] = usePortalContainer();
  const setRoot = useCallback(
    (el: HTMLDivElement | null) => {
      (anchorRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      if (rootRef) rootRef.current = el;
    },
    [anchorRef, rootRef]
  );
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

  // A colour style that names a CSS variable (a theme swatch) resolves at the component, so it is re-read with the app
  // theme; before the mount there is no element, and the children are not drawn yet.
  const resolved = useMemo(
    () => resolveOverrides(overrides ?? {}, anchorRef.current),
    [overridesKey, app, attached, themeVersion] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const resolvedKey = JSON.stringify(resolved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const theme = useMemo(() => buildTheme(app, resolved, container), [app, resolvedKey, container]);
  const chartBrand = resolved.primary ?? app.brand;
  const chartLook = useMemo(() => ({ brand: chartBrand, app }), [chartBrand, app]);
  return (
    <div
      ref={setRoot}
      className={['tj-mui tj-mui-root', fill ? 'tj-mui--fill' : '', className ?? ''].join(' ').trim()}
      style={{ fontFamily: app.font, ...style }}
    >
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <PopupContainer.Provider value={container}>
            <ChartLook.Provider value={chartLook}>{attached ? children : null}</ChartLook.Provider>
          </PopupContainer.Provider>
        </ThemeProvider>
      </CacheProvider>
    </div>
  );
};
