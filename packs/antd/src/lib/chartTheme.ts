import type React from 'react';
import { useEffect, useMemo, useState } from 'react';

export type Theme = { brand: string; success: string; error: string; text: string; muted: string; axis: string; border: string; surface: string; dark: boolean };
const LIGHT: Theme = { brand: '#1677ff', success: '#52c41a', error: '#ff4d4f', text: 'rgba(0, 0, 0, 0.88)', muted: 'rgba(0, 0, 0, 0.45)', axis: 'rgba(0, 0, 0, 0.65)', border: '#f0f0f0', surface: '#ffffff', dark: false };

// The chart draws on a canvas, which cannot read CSS variables: read antd's tokens off the element (stock Ant, or the
// component's style overrides; dark under .tj-ant-dark), and again when the root's class or style changes.
export const useChartTheme = (ref: React.RefObject<HTMLElement>) => {
  const [theme, setTheme] = useState<Theme>(LIGHT);
  useEffect(() => {
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
      const next: Theme = {
        brand: probe('--ant-color-primary', LIGHT.brand),
        success: probe('--ant-color-success', LIGHT.success),
        error: probe('--ant-color-error', LIGHT.error),
        text: probe('--ant-color-text', LIGHT.text),
        muted: probe('--ant-color-text-tertiary', LIGHT.muted),
        // Axis labels and titles in antd's secondary text: the tertiary (45% black) read as very faint on a canvas.
        axis: probe('--ant-color-text-secondary', LIGHT.axis),
        border: probe('--ant-color-split', LIGHT.border),
        surface: probe('--ant-color-bg-container', LIGHT.surface),
        dark: root.classList.contains('tj-ant-dark'),
      };
      setTheme((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'style'] });
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
