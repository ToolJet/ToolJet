import React, { useRef } from 'react';
import { ResponsiveContainer } from 'recharts';
import { formatValue } from './format';
import { toList } from './data';

// shadcn/ui chart palette, led by the app's brand color (or the chart's own color style).
export const PALETTE = ['#2a9d90', '#e76e50', '#274754', '#e8c468', '#f4a462', '#8b5cf6', '#06b6d4', '#ec4899'];

export const seriesColors = (colors: unknown, primary: string, count: number): string[] => {
  const custom = toList(colors);
  // Built in, the widget sits under UI 2.0's theme tokens: the theme's on-brand chart scale leads (tints and a deeper
  // shade of the brand colour), then the shadcn palette. A chart colour style leads instead of the brand.
  const lead = primary || 'var(--sc-chart-1, var(--cc-primary-brand))';
  const scale = primary
    ? [`color-mix(in srgb, ${primary} 62%, white)`, `color-mix(in srgb, ${primary} 34%, white)`, `color-mix(in srgb, ${primary} 70%, black)`]
    : ['var(--sc-chart-2, #e76e50)', 'var(--sc-chart-3, #274754)', 'var(--sc-chart-4, #e8c468)'];
  const base = [lead, ...scale, ...PALETTE];
  return Array.from({ length: Math.max(1, count) }, (_, i) => custom[i] || base[i % base.length]);
};

export const axisTick = (color?: string) => ({ fill: color || 'var(--cc-placeholder-text, #6a727c)', fontSize: 12 });

export const valueFormatter = (format: string, opts: { currency?: string; prefix?: string; suffix?: string }) => (v: unknown) =>
  formatValue(v, { format, currency: opts.currency, prefix: opts.prefix, suffix: opts.suffix });

export const tooltipStyle = {
  contentStyle: {
    background: 'var(--cc-surface1-surface, #fff)',
    border: '1px solid var(--cc-default-border, #e4e4e7)',
    borderRadius: 8,
    boxShadow: '0 10px 24px -6px rgb(16 24 40 / 0.18)',
    color: 'var(--cc-primary-text, #1b1f24)',
    fontSize: 12,
    padding: '8px 10px',
  },
  labelStyle: { fontWeight: 600, marginBottom: 4 },
  cursor: { fill: 'color-mix(in srgb, var(--cc-placeholder-text, #6a727c) 10%, transparent)' },
};

// Chart click → exposed clickedDataPoint + onClick; double click re-fires on the last hovered point.
export const useChartClicks = (setClicked: (p: Record<string, unknown>) => void, onClick: () => void, onDoubleClick: () => void) => {
  const last = useRef<Record<string, unknown> | null>(null);
  const handle = (state: { activePayload?: { payload?: Record<string, unknown>; dataKey?: unknown; value?: unknown }[]; activeLabel?: unknown } | null) => {
    const hit = state?.activePayload?.[0];
    if (!hit) return null;
    return { ...(hit.payload ?? {}), series: hit.dataKey, value: hit.value, label: state?.activeLabel };
  };
  return {
    onMouseMove: (state: Parameters<typeof handle>[0]) => {
      const p = handle(state);
      if (p) last.current = p;
    },
    onClick: (state: Parameters<typeof handle>[0]) => {
      const p = handle(state);
      if (!p) return;
      setClicked(p);
      onClick();
    },
    onDoubleClick: () => {
      if (!last.current) return;
      setClicked(last.current);
      onDoubleClick();
    },
  };
};

export const ChartFrame = ({
  empty,
  emptyText,
  onDoubleClick,
  children,
  legend,
}: {
  empty: boolean;
  emptyText: string;
  onDoubleClick?: () => void;
  children: React.ReactElement;
  legend?: React.ReactNode;
}) =>
  empty ? (
    <div className="ui ui-chart-empty ui-description">{emptyText}</div>
  ) : (
    <div className="ui ui-chart" onDoubleClick={onDoubleClick}>
      <div className="ui-chart-plot">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
      {legend}
    </div>
  );

export const Legend = ({ items }: { items: { label: string; color: string }[] }) => (
  <div className="ui-chart-legend">
    {items.map((i) => (
      <span key={i.label} className="ui-chart-legend-item">
        <span className="ui-chart-legend-dot" style={{ background: i.color }} />
        {i.label}
      </span>
    ))}
  </div>
);

export const labelFor = (labels: unknown, key: string): string => {
  const custom = labels && typeof labels === 'object' ? (labels as Record<string, unknown>)[key] : undefined;
  return typeof custom === 'string' && custom ? custom : key;
};

export const MONTHLY = [
  { month: 'Jan', revenue: 18600, cost: 8000, margin: 0.57 },
  { month: 'Feb', revenue: 30500, cost: 20000, margin: 0.34 },
  { month: 'Mar', revenue: 23700, cost: 12000, margin: 0.49 },
  { month: 'Apr', revenue: 27300, cost: 19000, margin: 0.3 },
  { month: 'May', revenue: 20900, cost: 13000, margin: 0.38 },
  { month: 'Jun', revenue: 31400, cost: 14000, margin: 0.55 },
];
