import React from 'react';
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
  const [size] = ToolJet.useStateString({ name: 'size', label: 'Size (sm, default, lg or px)', initialValue: 'default' });
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
  const alignment = ToolJet.useStyleEnumeration({ name: 'alignment', label: 'Alignment', enumDefinition: ['left', 'center', 'right'], initialValue: 'left', inspector: 'switch' });
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 4 });

  const px = spinnerSize(size);
  const stroke = Math.max(2, Math.round(px / 10));
  const r = (px - stroke) / 2;
  const text = label === undefined || label === null ? '' : String(label).trim() ? String(label) : '';
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
      <div role="status" aria-label={text || 'Loading'} className={cn('ui2-spinner', labelPosition === 'bottom' && 'is-below')}>
        {indicator}
        {text ? <span className="ui2-spinner-label">{text}</span> : null}
      </div>
    </div>
  );
};
