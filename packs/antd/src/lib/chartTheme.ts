import type React from 'react';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';

export type Theme = {
  /** Whether the tokens have been read off the element: a chart drawn before that animated in the stock palette and
   *  switched to the theme's colours partway through. */
  ready: boolean;
  brand: string;
  success: string;
  warning: string;
  error: string;
  text: string;
  muted: string;
  axis: string;
  border: string;
  surface: string;
  dark: boolean;
  /** Whether the app applies a ToolJet theme (not the basic one). */
  themed: boolean;
  /** The categorical palette series and slices take, in order (seriesPalette). */
  palette: string[];
};

// G2's (Ant's charting engine) own categorical palette after its first colour, which is antd's primary (or the
// component's colorPrimary style).
export const G2_PALETTE = ['#00C9C9', '#F0884D', '#D580FF', '#7863FF', '#60C42D', '#BD8F24', '#FF80CA', '#2491B3', '#17C76F'];

const rgbOf = (color: string): [number, number, number] | undefined => {
  const t = color.trim().toLowerCase();
  const hex = /^#([0-9a-f]{6})/.exec(t)?.[1] ?? /^#([0-9a-f]{3})$/.exec(t)?.[1]?.replace(/./g, (c) => c + c);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(t);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  // color-mix() in srgb computes to color(srgb r g b), channels 0-1.
  const srgb = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(t);
  if (srgb) return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255];
  return undefined;
};
/** `share` of colour a over b, as rgb() (a canvas cannot draw color-mix()); a when either is unparsable. */
export const mixRgb = (a: string, b: string, share: number) => {
  const x = rgbOf(a);
  const y = rgbOf(b);
  if (!x || !y) return a;
  return `rgb(${x.map((v, i) => Math.round(v * share + y[i] * (1 - share))).join(', ')})`;
};

/**
 * The charts' categorical palette. Stock Ant (no app theme): antd's primary (or the colorPrimary style), then G2's own
 * palette. Under an applied theme every colour comes from the theme, as the MUI pack's charts and the shadcn pack's
 * seriesColors: the brand, tints and a deeper shade of it, then the theme's system colours, then mixes of the brand with
 * them; no stock teal or lilac on a theme that has none.
 */
export const seriesPalette = (t: Pick<Theme, 'brand' | 'success' | 'warning' | 'error' | 'themed'>): string[] =>
  t.themed
    ? [
        t.brand,
        mixRgb(t.brand, '#ffffff', 0.62),
        mixRgb(t.brand, '#ffffff', 0.34),
        mixRgb(t.brand, '#000000', 0.7),
        t.success,
        t.warning,
        t.error,
        mixRgb(t.brand, t.success, 0.5),
        mixRgb(t.brand, t.error, 0.5),
        mixRgb(t.brand, '#000000', 0.45),
      ]
    : [t.brand, ...G2_PALETTE];

const LIGHT_BASE = { brand: '#1677ff', success: '#52c41a', warning: '#faad14', error: '#ff4d4f', themed: false };
const LIGHT: Theme = {
  ...LIGHT_BASE,
  text: 'rgba(0, 0, 0, 0.88)',
  muted: 'rgba(0, 0, 0, 0.45)',
  axis: 'rgba(0, 0, 0, 0.65)',
  border: '#f0f0f0',
  surface: '#ffffff',
  dark: false,
  palette: seriesPalette(LIGHT_BASE),
  ready: false,
};

// The chart draws on a canvas, which cannot read CSS variables: read antd's tokens off the element (stock Ant, or the
// component's style overrides; dark under .tj-ant-dark), and again when the root's class or style changes.
export const useChartTheme = (ref: React.RefObject<HTMLElement>) => {
  const [theme, setTheme] = useState<Theme>(LIGHT);
  // Read before the browser paints, and the charts draw only once it is read (Frame's ready).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = (el.closest('.tj-ant-root') as HTMLElement | null) ?? el;
    const read = () => {
      const cs = getComputedStyle(el);
      // Resolve to rgb() through the element itself, so color-mix() comes back as a plain colour.
      const probe = (name: string, fallback: string) => {
        const value = cs.getPropertyValue(name).trim();
        if (!value) return fallback;
        el.style.setProperty('--tj-ant-probe', value);
        el.style.color = 'var(--tj-ant-probe)';
        const out = getComputedStyle(el).color;
        el.style.removeProperty('color');
        el.style.removeProperty('--tj-ant-probe');
        return out || fallback;
      };
      const base = {
        brand: probe('--ant-color-primary', LIGHT.brand),
        success: probe('--ant-color-success', LIGHT.success),
        warning: probe('--ant-color-warning', LIGHT.warning),
        error: probe('--ant-color-error', LIGHT.error),
        // The host defines the --tj-* tokens only when the app applies a theme (themeMode "own").
        themed: cs.getPropertyValue('--tj-brand').trim() !== '',
      };
      const next: Theme = {
        ...base,
        palette: seriesPalette(base),
        text: probe('--ant-color-text', LIGHT.text),
        muted: probe('--ant-color-text-tertiary', LIGHT.muted),
        // Axis labels and titles in antd's secondary text: the tertiary (45% black) read as very faint on a canvas.
        axis: probe('--ant-color-text-secondary', LIGHT.axis),
        border: probe('--ant-color-split', LIGHT.border),
        surface: probe('--ant-color-bg-container', LIGHT.surface),
        dark: root.classList.contains('tj-ant-dark'),
        ready: true,
      };
      setTheme((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'style'] });
    // Applying or removing an app theme marks the shadow host (tj-themed).
    const host = (el.getRootNode() as ShadowRoot).host;
    if (host) observer.observe(host, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [ref]);
  return theme;
};


// G2's hover tooltip is HTML inside the chart's own element (in the shadow root), so it takes antd's token variables
// directly: the theme's font, text, surface and radius, dark with the app, instead of G2's stock sans-serif panel.
const sel = (part: string) => `.g2-${part}`;
export const TOOLTIP_CSS = {
  [sel('tooltip')]: {
    'font-family': 'var(--ant-font-family)',
    'font-size': 'var(--ant-font-size-sm)',
    color: 'var(--ant-color-text)',
    background: 'var(--ant-color-bg-elevated)',
    'border-radius': 'var(--ant-border-radius)',
    'box-shadow': 'var(--ant-box-shadow-secondary)',
    opacity: 1,
  },
  [sel('tooltip-title')]: { color: 'var(--ant-color-text-secondary)' },
  [sel('tooltip-list-item-name-label')]: { color: 'var(--ant-color-text-secondary)' },
  [sel('tooltip-list-item-value')]: { color: 'var(--ant-color-text)' },
};

/**
 * Where a chart's hover tooltip is drawn: a layer of its own in the library's popup layer (the shadow root's
 * tjOverlay), over the page. Drawn inside the chart, a tall tooltip (a dozen series) was cut by the widget box. The
 * layer carries the root's classes and token overrides, so the tooltip keeps the themed look (TOOLTIP_CSS), and the
 * tooltip is kept inside the window.
 */
export const useTooltipLayer = (ref: React.RefObject<HTMLElement>, dark: boolean) => {
  const layer = useMemo(() => (typeof document === 'undefined' ? undefined : document.createElement('div')), []);
  useEffect(() => {
    const el = ref.current;
    if (!layer || !el) return undefined;
    const overlay = (el.getRootNode() as ShadowRoot & { tjOverlay?: HTMLElement }).tjOverlay;
    if (!overlay) return undefined;
    const root = el.closest('.tj-ant-root') as HTMLElement | null;
    layer.className = `tj-ant tj-ant-chart-tips${dark ? ' tj-ant-dark' : ''}`;
    layer.style.cssText = root?.style.cssText ?? '';
    overlay.appendChild(layer);
    // G2 flips a tooltip that overflows the chart once, which for a tooltip taller than the chart still leaves it
    // past an edge: nudge it back inside the window.
    let observer: MutationObserver | null = null;
    const keepInside = () => {
      layer.querySelectorAll<HTMLElement>('.g2-tooltip').forEach((tip) => {
        if (getComputedStyle(tip).visibility === 'hidden') return;
        const r = tip.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const dy = r.top < 4 ? 4 - r.top : r.bottom > window.innerHeight - 4 ? Math.max(4 - r.top, window.innerHeight - 4 - r.bottom) : 0;
        const dx = r.right > window.innerWidth - 4 ? Math.max(4 - r.left, window.innerWidth - 4 - r.right) : r.left < 4 ? 4 - r.left : 0;
        if (dy) tip.style.top = `${(parseFloat(tip.style.top) || 0) + dy}px`;
        if (dx) tip.style.left = `${(parseFloat(tip.style.left) || 0) + dx}px`;
      });
      // Our own nudge is a style change too: drop its records, or the observer would answer itself.
      observer?.takeRecords();
    };
    observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver(keepInside);
    observer?.observe(layer, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
    return () => {
      observer?.disconnect();
      layer.remove();
    };
  }, [layer, ref, dark]);
  return layer;
};

/** The tooltip interaction every chart takes: the themed look, drawn in the chart's tooltip layer. */
export const tooltipInteraction = (mount: HTMLElement | undefined) => ({ tooltip: { css: TOOLTIP_CSS, ...(mount ? { mount } : {}) } });
