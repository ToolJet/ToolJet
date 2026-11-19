import React, { useLayoutEffect, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { styleVars } from '../lib/ui2/display/lists/model';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';
import '../styles/ui2-display.css';

const SIZES: Record<string, number> = { sm: 16, default: 24, lg: 32 };
// UI 2.0's size: a named size or a number of px (8 to 200).
const spinnerSize = (value: unknown): number => {
  const key = String(value ?? '').trim();
  if (Object.prototype.hasOwnProperty.call(SIZES, key)) return SIZES[key];
  const n = Number(key === '' ? NaN : key);
  return Number.isFinite(n) ? Math.min(200, Math.max(8, n)) : 24;
};

export const Spinner = () => {
  const [variant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Variant',
    enumDefinition: ['ring', 'dots', 'bars'],
    enumLabels: { ring: 'Ring', dots: 'Dots', bars: 'Bars' },
    initialValue: 'ring',
    inspector: 'switch',
  });
  const [size] = ToolJet.useStateString({
    name: 'size',
    label: 'Size',
    description: 'Use sm, default, lg, or a size in px.',
    initialValue: 'default',
  });
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Loading…' });
  const [labelPosition] = ToolJet.useStateEnumeration({
    name: 'labelPosition',
    label: 'Label position',
    enumDefinition: ['right', 'bottom'],
    enumLabels: { right: 'Beside', bottom: 'Below' },
    initialValue: 'right',
    inspector: 'switch',
  });
  const spinnerColor = useThemeColor('spinnerColor', 'Spinner color', TOKEN.brand);
  const trackColor = useThemeColor('trackColor', 'Ring track color', TOKEN.brand);
  const labelColor = useThemeColor('labelColor', 'Label color', TOKEN.mutedText);
  const alignment = ToolJet.useStyleEnumeration({
    name: 'alignment',
    label: 'Alignment',
    enumDefinition: ['left', 'center', 'right'],
    initialValue: 'left',
    inspector: 'switch',
  });
  ToolJet.useComponentSettings({ role: 'spinner', fit: false, loading: 'own', defaultWidth: 6, defaultHeight: 4 });

  // The size set, or the room its box has (less the label's line below it): a 200px spinner was cut in an 80px box.
  // An unlaid box (0 by 0, jsdom, a hidden tab) keeps the size set, as Circular Progress does.
  const wrap = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setRoom({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const text = label === undefined || label === null ? '' : String(label).trim() ? String(label) : '';
  const labelLine = text && labelPosition === 'bottom' ? 26 : 0;
  const fits = room.width > 0 && room.height > 0 ? Math.floor(Math.min(room.width, room.height - labelLine)) : 0;
  const px = fits > 0 ? Math.max(8, Math.min(spinnerSize(size), fits)) : spinnerSize(size);
  const stroke = Math.max(2, Math.round(px / 10));
  const r = (px - stroke) / 2;
  const indicator =
    variant === 'ring' || (variant !== 'dots' && variant !== 'bars') ? (
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} className="ui2-spinner-ring" aria-hidden="true">
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" strokeWidth={stroke} className="ui2-spinner-track" />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${Math.PI * r * 0.5} ${Math.PI * r * 2}`}
          className="ui2-spinner-arc"
        />
      </svg>
    ) : variant === 'dots' ? (
      <span className="ui2-spinner-dots" style={{ height: px, gap: Math.max(2, px / 8) }} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: px / 4, height: px / 4, animationDelay: `${i * 0.15}s` }} />
        ))}
      </span>
    ) : (
      <span className={cn('ui-spinner', 'ui-spinner--bars')} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </span>
    );
  return (
    <div
      ref={wrap}
      className="ui ui2-spinner-wrap"
      style={{
        justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
        ['--ui-spin-size' as string]: `${px}px`,
        ['--ui-spin-color' as string]: 'var(--lk-spin, var(--ui-primary))',
        ...styleVars([
          [spinnerColor, '--lk-spin'],
          [trackColor, '--lk-track'],
          [labelColor, '--lk-label'],
        ]),
      }}
    >
      <div
        role="status"
        aria-label={text || 'Loading'}
        className={cn('ui2-spinner', labelPosition === 'bottom' && 'is-below')}
      >
        {indicator}
        {text ? <span className="ui2-spinner-label">{text}</span> : null}
      </div>
    </div>
  );
};
