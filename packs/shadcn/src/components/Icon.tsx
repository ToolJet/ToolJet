import React, { useLayoutEffect, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { iconFor } from '../lib/icons';
import { cn } from '../lib/cn';
import { px as pxValue, styleVars } from '../lib/ui2/display/lists/model';
import { InPlace, useLoadingLook } from '../lib/ui2/loading/look';
import '../styles/ui2-display.css';

// UI 2.0's tone colours (the Icon color style wins). 'danger' stays as the pack's old name for destructive.
const TONES: Record<string, string> = {
  default: 'var(--ui-fg)',
  muted: 'var(--ui-muted-fg)',
  primary: 'var(--ui-primary)',
  success: 'var(--ui-success)',
  warning: 'var(--ui-warning)',
  destructive: 'var(--ui-destructive)',
  danger: 'var(--ui-destructive)',
};

const clampCoerce = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim() === '' ? NaN : value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export const Icon = () => {
  const [icon] = ToolJet.useStateString({ name: 'icon', label: 'Icon', description: 'Any lucide name (trending-up, TrendingUp, bell) or Tabler name (IconBell).', initialValue: 'trending-up', inspector: 'icon' });
  const [size] = ToolJet.useStateNumber({ name: 'size', label: 'Icon size (px)', initialValue: 20 });
  const [strokeWidth] = ToolJet.useStateNumber({ name: 'strokeWidth', label: 'Stroke width', initialValue: 2 });
  const [tone] = ToolJet.useStateEnumeration({
    name: 'tone',
    label: 'Tone (unless Icon color is set)',
    enumDefinition: ['default', 'muted', 'primary', 'success', 'warning', 'destructive'],
    initialValue: 'primary',
  });
  const [chip] = ToolJet.useStateEnumeration({
    name: 'chip',
    label: 'Background chip',
    enumDefinition: ['none', 'circle', 'square'],
    enumLabels: { none: 'None', circle: 'Circle', square: 'Rounded square' },
    initialValue: 'square',
    inspector: 'switch',
  });
  const [chipSize] = ToolJet.useStateString({ name: 'chipSize', label: 'Chip size (px, empty: icon x 2)', initialValue: '' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const onHover = ToolJet.useEventCallback({ name: 'onHover' });
  const iconColor = ToolJet.useStyleString({ name: 'iconColor', label: 'Icon color', inspector: 'color', initialValue: '' });
  const chipColor = ToolJet.useStyleString({ name: 'chipColor', label: 'Chip background (default: icon color tint)', inspector: 'color', initialValue: '' });
  const chipRadius = ToolJet.useStyleNumber({ name: 'chipRadius', label: 'Chip radius (square chip)', initialValue: '' });
  const alignment = ToolJet.useStyleEnumeration({ name: 'alignment', label: 'Alignment', enumDefinition: ['left', 'center', 'right'], initialValue: 'left', inspector: 'switch' });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 3, defaultHeight: 4 });

  ToolJet.useAction({ name: 'click', displayName: 'Click' }, () => onClick());

  // The chip and icon scale down together to fit the box's height, as in UI 2.0.
  const ref = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setRoom(el.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Glyph = iconFor(icon);
  const iconPx = clampCoerce(size, 8, 512, 20);
  const stroke = clampCoerce(strokeWidth, 0.5, 4, 2);
  const shape = chip === 'circle' || chip === 'square' ? chip : 'none';
  const asked = shape === 'none' ? iconPx : clampCoerce(chipSize, iconPx, 1024, Math.round(iconPx * 2));
  const scale = room > 0 ? Math.min(1, Math.max(8, room) / asked) : 1;
  const box = Math.floor(asked * scale);
  const glyphPx = Math.max(4, Math.floor(iconPx * scale));
  return (
    <div
      ref={ref}
      className="ui ui-icon-wrap"
      style={{
        justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
        ['--ic-tone' as string]: TONES[tone] ?? TONES.default,
        ...styleVars([
          [iconColor, '--lk-icon'],
          [chipColor, '--lk-chip'],
          [chipRadius, '--lk-radius', pxValue],
        ]),
      }}
    >
      <InPlace loading={ld.loading} skeleton={ld.skeleton} round={shape === 'circle'}>
        <span
          role="img"
          aria-label={typeof icon === 'string' && icon ? icon : 'icon'}
          className={cn('ui2-icon', shape !== 'none' && `is-${shape}`)}
          style={{ width: box, height: box }}
          onClick={onClick}
          onMouseEnter={onHover}
        >
          {Glyph ? <Glyph size={glyphPx} strokeWidth={stroke} aria-hidden="true" /> : <span className="ui-description">?</span>}
        </span>
      </InPlace>
    </div>
  );
};
