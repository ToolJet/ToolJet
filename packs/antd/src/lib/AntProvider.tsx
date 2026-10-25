import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ConfigProvider } from 'antd';
import { createCache, StyleProvider } from '@ant-design/cssinjs';
// The module Ant's icons insert their styles through (@ant-design/icons utils.js useInsertStyles).
import { clearContainerCache } from 'rc-util/es/Dom/dynamicCSS';
import { usePortalContainer } from './usePortalContainer';
import { RADIUS_HINT, THEME_COLOR, useThemeColor, useThemeNumber } from './themeStyles';

// Must match THEME in scripts/extract-styles.mjs: the static antd.css is written for these class names (`.tj`
// marks every antd root, no hash), so the runtime renders the same markup the extracted CSS styles.
const THEME = { cssVar: { key: 'tj', prefix: 'ant' }, hashed: false } as const;

// antd always generates its CSS-in-JS at runtime. The pack ships that CSS statically (src/styles/antd.css, adopted
// by every shadow root of the library, the popup layer included), so the runtime copy goes to a detached element,
// once per page: one cache shared by every instance.
const cache = createCache();
let sink: HTMLElement | undefined;
const sinkElement = () => {
  if (!sink && typeof document !== 'undefined') sink = document.createElement('div');
  return sink;
};

const isSet = (v: unknown) => v !== undefined && v !== null && v !== '';

const mix = (c: string, p: number, base: string) => `color-mix(in srgb, ${c} ${p}%, ${base})`;
const alpha = (c: string, p: number) => `color-mix(in srgb, ${c} ${p}%, transparent)`;

/**
 * Ant's own design-token names as the component's Styles. Each colour defaults to the theme colour it draws (a swatch
 * in the inspector, lib/themeStyles); left at that default it keeps the look (stock Ant, or the applied ToolJet
 * theme). A value overrides that token and the ones antd derives from it (hover, active, tints), as --tj-ant-*
 * variables the static antd.css reads first.
 */
export const useTokenStyles = () => {
  const colorPrimary = useThemeColor('colorPrimary', 'Primary color', THEME_COLOR.brand);
  const colorText = useThemeColor('colorText', 'Text color', THEME_COLOR.text);
  const colorBgContainer = useThemeColor('colorBgContainer', 'Container background', THEME_COLOR.surface);
  const colorBorder = useThemeColor('colorBorder', 'Border color', THEME_COLOR.border);
  const borderRadius = useThemeNumber('borderRadius', 'Border radius', RADIUS_HINT);
  return useMemo(() => {
    const vars: Record<string, string> = {};
    if (isSet(colorPrimary)) {
      const c = String(colorPrimary);
      for (const family of ['primary', 'info', 'link']) {
        vars[`--tj-ant-color-${family}`] = c;
        vars[`--tj-ant-color-${family}-hover`] = mix(c, 82, '#fff');
        vars[`--tj-ant-color-${family}-active`] = mix(c, 82, '#000');
      }
      for (const family of ['primary', 'info']) {
        vars[`--tj-ant-color-${family}-text`] = c;
        vars[`--tj-ant-color-${family}-text-hover`] = mix(c, 82, '#fff');
        vars[`--tj-ant-color-${family}-text-active`] = mix(c, 82, '#000');
        vars[`--tj-ant-color-${family}-bg`] = alpha(c, 10);
        vars[`--tj-ant-color-${family}-bg-hover`] = alpha(c, 18);
        vars[`--tj-ant-color-${family}-border`] = alpha(c, 40);
        vars[`--tj-ant-color-${family}-border-hover`] = alpha(c, 60);
      }
      vars['--tj-ant-control-item-bg-active'] = alpha(c, 10);
      vars['--tj-ant-control-item-bg-active-hover'] = alpha(c, 18);
      vars['--tj-ant-control-outline'] = alpha(c, 18);
    }
    if (isSet(colorText)) {
      const c = String(colorText);
      vars['--tj-ant-color-text'] = c;
      vars['--tj-ant-color-text-heading'] = c;
      vars['--tj-ant-color-text-label'] = alpha(c, 80);
      vars['--tj-ant-color-text-secondary'] = alpha(c, 72);
      vars['--tj-ant-color-text-description'] = alpha(c, 55);
    }
    if (isSet(colorBgContainer)) {
      vars['--tj-ant-color-bg-container'] = String(colorBgContainer);
      vars['--tj-ant-color-bg-elevated'] = String(colorBgContainer);
    }
    if (isSet(colorBorder)) vars['--tj-ant-color-border'] = String(colorBorder);
    if (isSet(borderRadius) && !Number.isNaN(Number(borderRadius))) {
      const r = Number(borderRadius);
      vars['--tj-ant-border-radius'] = `${r}px`;
      vars['--tj-ant-border-radius-sm'] = `${Math.max(0, r - 2)}px`;
      vars['--tj-ant-border-radius-lg'] = `${r + 2}px`;
      vars['--tj-ant-border-radius-xs'] = `${Math.max(0, r - 4)}px`;
    }
    return vars as CSSProperties;
  }, [colorPrimary, colorText, colorBgContainer, colorBorder, borderRadius]);
};

// Dark app, dark Ant: whether the app is dark (its surface colour: the theme's --tj-surface when one is applied, else
// the page's own --cc-surface1-surface) puts the root on antd's dark algorithm (.tj-ant-dark in antd.css). One
// observer on <html> and <body> for every instance.
const darkListeners = new Set<() => void>();
let darkObserver: MutationObserver | null = null;
const watchTheme = (listener: () => void) => {
  darkListeners.add(listener);
  if (!darkObserver && typeof MutationObserver !== 'undefined') {
    darkObserver = new MutationObserver(() => darkListeners.forEach((l) => l()));
    [document.documentElement, document.body].forEach((node) =>
      darkObserver!.observe(node, { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-bs-theme'] })
    );
  }
  return () => {
    darkListeners.delete(listener);
  };
};
const isDarkAt = (el: HTMLElement) => {
  const cs = getComputedStyle(el);
  const surface = cs.getPropertyValue('--tj-surface').trim() || cs.getPropertyValue('--cc-surface1-surface').trim();
  if (!surface) return false;
  el.style.setProperty('--tj-ant-probe', surface);
  el.style.color = 'var(--tj-ant-probe)';
  const rgb = getComputedStyle(el).color.match(/\d+(\.\d+)?/g)?.map(Number) ?? [255, 255, 255];
  el.style.removeProperty('color');
  el.style.removeProperty('--tj-ant-probe');
  return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255 < 0.4;
};
/** Whether the app applies a ToolJet theme at `el`: the host defines the --tj-* tokens only then (themeMode "own"). */
export const isThemedAt = (el: Element) => getComputedStyle(el).getPropertyValue('--tj-brand').trim() !== '';
const useAppLook = (anchor: React.RefObject<HTMLElement>) => {
  const [look, setLook] = useState({ dark: false, themed: false });
  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    const read = () => {
      const next = { dark: isDarkAt(el), themed: isThemedAt(el) };
      setLook((prev) => (prev.dark === next.dark && prev.themed === next.themed ? prev : next));
    };
    read();
    // The host marks itself tj-themed when the app applies a theme; <html> and <body> carry light or dark.
    const host = (el.getRootNode() as ShadowRoot).host;
    const hostWatch = host && typeof MutationObserver !== 'undefined' ? new MutationObserver(read) : null;
    hostWatch?.observe(host, { attributes: true, attributeFilter: ['class'] });
    const stop = watchTheme(read);
    return () => {
      hostWatch?.disconnect();
      stop();
    };
  }, [anchor]);
  return look;
};

/** Whether the component sits in a dark app (antd's dark algorithm applies); charts pick G2's dark theme from it. */
const DarkContext = createContext(false);
export const useIsDark = () => useContext(DarkContext);

/** Whether the app applies a ToolJet theme (not the basic one): the pack then follows its tokens, else stock Ant. */
const ThemedContext = createContext(false);
export const useIsThemed = () => useContext(ThemedContext);

/** The component's token overrides, for popups that render outside its root (the popup layer). */
const PopupTheme = createContext<{ className: string; style: CSSProperties; container: HTMLElement | null }>({
  className: 'tj-ant',
  style: {},
  container: null,
});
export const usePopupTheme = () => useContext(PopupTheme);

// Every pack component renders inside this: antd's ConfigProvider with popups portalled into ToolJet's popup layer, and
// a root that declares antd's token variables (the `.tj-ant` rule in antd.css), dark when the app is.
export const AntProvider = ({
  children,
  tokens,
  fill = false,
  className,
  style,
  ownerRef,
}: {
  children: React.ReactNode;
  /** Set to the root element: what owns the component's popups (lib/useOwnerGuard reads whether it takes input). */
  ownerRef?: React.MutableRefObject<HTMLElement | null>;
  tokens?: CSSProperties;
  /** Fill the widget box (charts, tables, containers), instead of sizing to the content. */
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
}) => {
  const [anchorRef, container] = usePortalContainer();
  const { dark, themed } = useAppLook(anchorRef);
  // Ant's icons put their styles in each widget's shadow root through rc-util, whose module-level cache maps every root
  // it served to its real parent and never lets go, so a page switch kept every old Ant root (and its listeners)
  // alive. Emptied when a widget unmounts; the cache is only a lookup, refilled on the next insert.
  useEffect(() => () => clearContainerCache(), []);
  const popup = useMemo(() => ({ className: dark ? 'tj-ant tj-ant-dark' : 'tj-ant', style: tokens ?? {}, container }), [tokens, container, dark]);
  return (
    <div
      ref={(el) => {
        (anchorRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        if (ownerRef) ownerRef.current = el;
      }}
      className={['tj-ant tj-ant-root', dark ? 'tj-ant-dark' : '', fill ? 'tj-ant--fill' : '', className ?? ''].join(' ').trim()}
      style={{ ...tokens, ...style }}
    >
      <StyleProvider cache={cache} container={sinkElement()}>
        <ConfigProvider
          theme={THEME}
          getPopupContainer={() => container ?? document.body}
          getTargetContainer={() => container ?? window}
        >
          <DarkContext.Provider value={dark}>
            <ThemedContext.Provider value={themed}>
              <PopupTheme.Provider value={popup}>{children}</PopupTheme.Provider>
            </ThemedContext.Provider>
          </DarkContext.Provider>
        </ConfigProvider>
      </StyleProvider>
    </div>
  );
};

/** The popup theme for an Ant control whose component renders AntProvider itself: read inside the provider, as a
 *  popup's class and style must be (read beside it, a popup got the default theme: no token overrides, never dark). */
export const WithPopupTheme = ({ children }: { children: (popup: ReturnType<typeof usePopupTheme>) => React.ReactNode }) => (
  <>{children(usePopupTheme())}</>
);
