import React, { useLayoutEffect, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { themeVars } from '../lib/themeVars';
import { isSet } from '../lib/ui2/display/lists/model';
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-display.css';

const Bar = ({ width, height = 16, round }: { width: string | number; height?: number; round?: boolean }) => (
  <div className="ui-skeleton ui2-skeleton" style={{ width, height, borderRadius: round ? 999 : undefined }} />
);

const LINE = 16;
const LINE_GAP = 8;

export const Skeleton = () => {
  const [shape] = ToolJet.useStateEnumeration({
    name: 'shape',
    label: 'Shape',
    enumDefinition: ['profile', 'card', 'lines'],
    enumLabels: { profile: 'Profile', card: 'Card', lines: 'Text lines' },
    initialValue: 'lines',
    inspector: 'switch',
  });
  const [lines] = ToolJet.useStateNumber({ name: 'lines', label: 'Lines', initialValue: 3 });
  // UI 2.0: a round avatar placeholder beside the lines.
  const [avatar] = ToolJet.useStateBoolean({ name: 'avatar', label: 'Avatar', initialValue: false });
  const placeholderColor = useThemeColor('placeholderColor', 'Placeholder color', TOKEN.brand);
  const baseColor = useThemeColor('baseColor', 'Shade', TOKEN.brand);
  const background = useThemeColor('backgroundColor', 'Background', 'transparent');
  const radius = useThemeRadius('borderRadius', 'Border radius');
  ToolJet.useComponentSettings({ role: 'skeleton', fit: false, loading: 'own', defaultWidth: 10, defaultHeight: 6 });

  // As many lines as fit the box (a 16px line and an 8px gap each), as UI 2.0 draws them.
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setHeight(el.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const asked = Math.max(1, Math.min(50, Math.floor(Number(lines)) || 3));
  const fit = Math.max(1, Math.floor((height + LINE_GAP) / (LINE + LINE_GAP)));
  const count = height > 0 ? Math.min(asked, fit) : asked;
  const textLines = Array.from({ length: count }, (_, i) => (
    <Bar key={i} width={i === count - 1 && count > 1 ? '60%' : '100%'} />
  ));

  const fill = isSet(placeholderColor)
    ? String(placeholderColor)
    : isSet(baseColor)
      ? `color-mix(in srgb, ${baseColor} 10%, var(--ui-bg))`
      : undefined;
  return (
    <div
      ref={ref}
      className="ui ui-skeleton-wrap ui2-skeleton-wrap"
      aria-busy="true"
      aria-label="Loading"
      style={{
        ...themeVars({ bg: background || undefined, radius }),
        ...(fill ? { ['--lk-bg' as string]: fill } : {}),
        ...(isSet(background) ? { background } : {}),
      }}
    >
      {shape === 'profile' ? (
        <div className="ui-skeleton-row">
          <Bar width={48} height={48} round />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bar width="70%" />
            <Bar width="45%" />
          </div>
        </div>
      ) : null}
      {shape === 'card' ? (
        <>
          <div className="ui-skeleton ui2-skeleton" style={{ flex: 1, minHeight: 60, borderRadius: 10 }} />
          <Bar width="80%" />
          <Bar width="55%" />
        </>
      ) : null}
      {shape !== 'profile' && shape !== 'card' ? (
        <div className="ui2-skeleton-lines">
          {avatar ? <Bar width={48} height={48} round /> : null}
          <div className="ui2-skeleton-stack">{textLines}</div>
        </div>
      ) : null}
    </div>
  );
};
