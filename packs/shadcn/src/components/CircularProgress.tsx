import React, { useLayoutEffect, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { clamp, num } from '../lib/data';
import { css, ringGeometry } from '../lib/ui2/charts/progressModel';
import { InPlace, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';
import '../styles/ui2-charts-progress.css';

const ALIGN = ['left', 'center', 'right'];

export const CircularProgress = () => {
  const [value, setValue] = ToolJet.useStateNumber({ name: 'value', label: 'Value (0 to 100)', initialValue: 63 });
  const [size] = ToolJet.useStateNumber({ name: 'size', label: 'Size (px)', initialValue: 96 });
  const [thickness] = ToolJet.useStateNumber({ name: 'thickness', label: 'Thickness (px)', initialValue: 8 });
  const [lineCap] = ToolJet.useStateEnumeration({
    name: 'lineCap',
    label: 'Ends',
    enumDefinition: ['round', 'flat'],
    enumLabels: { round: 'Round', flat: 'Flat' },
    initialValue: 'round',
    inspector: 'switch',
  });
  const [centerText] = ToolJet.useStateEnumeration({
    name: 'centerText',
    label: 'Centre text',
    enumDefinition: ['value', 'custom', 'none'],
    enumLabels: { value: 'Value', custom: 'Custom', none: 'None' },
    initialValue: 'value',
    inspector: 'switch',
  });
  const [customText] = ToolJet.useStateString({ name: 'text', label: 'Custom centre text', initialValue: '' });
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Sub-label', initialValue: 'Complete' });
  const barColor = useThemeColor('barColor', 'Bar color', TOKEN.brand);
  const trackColor = useThemeColor('trackColor', 'Track color', TOKEN.brand);
  const textColor = useThemeColor('textColor', 'Centre text color', TOKEN.text);
  const labelColor = useThemeColor('labelColor', 'Sub-label color', TOKEN.mutedText);
  const alignment = ToolJet.useStyleEnumeration({
    name: 'alignment',
    label: 'Alignment',
    enumDefinition: ['left', 'center', 'right'],
    enumLabels: { left: 'Left', center: 'Center', right: 'Right' },
    initialValue: 'center',
  });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({
    role: 'circularprogress',
    fit: true,
    loading: 'own',
    defaultWidth: 5,
    defaultHeight: 10,
  });

  ToolJet.useAction(
    { name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] },
    (v) => setValue(clamp(num(v), 0, 100))
  );

  // The ring is the size set, or the largest square its box has room for: a 96px ring was cut in a box narrower or
  // shorter than that (a 3-column box on a phone-width page).
  const wrap = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(0);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    // An unlaid box (0 by 0, jsdom, a hidden tab) keeps the size set.
    const measure = () =>
      setRoom(el.clientWidth > 0 && el.clientHeight > 0 ? Math.min(el.clientWidth, el.clientHeight) : 0);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const asked = ringGeometry(value, size, thickness).size;
  const g = ringGeometry(value, room > 0 ? Math.max(16, Math.min(asked, Math.floor(room))) : asked, thickness);
  const mode = ['value', 'custom', 'none'].includes(centerText) ? centerText : 'value';
  const centre = mode === 'value' ? `${Math.round(g.percent)}%` : mode === 'custom' ? String(customText ?? '') : '';
  const centreSize = Math.max(10, Math.round(g.size * 0.22));
  const labelSize = Math.max(9, Math.min(14, Math.round(g.size * 0.11)));
  const c = g.size / 2;
  // 'butt' is the pack's earlier name for flat ends.
  const cap = lineCap === 'flat' || (lineCap as string) === 'butt' ? 'butt' : 'round';
  const align = ALIGN.includes(String(alignment)) ? String(alignment) : 'center';
  const vars = {
    '--pg-bar': css(barColor),
    '--pg-track': css(trackColor),
    '--pg-fg': css(textColor),
    '--pg-label': css(labelColor),
  } as React.CSSProperties;

  return (
    <div ref={wrap} className={`ui ui2-ring-wrap is-${align}`} style={vars}>
      <InPlace loading={ld.loading} skeleton={ld.skeleton} round large={g.size >= 48}>
        <div
          className="ui2-ring"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(g.percent)}
          aria-label={label || 'Progress'}
          style={{ width: g.size, height: g.size }}
        >
          <svg width={g.size} height={g.size} viewBox={`0 0 ${g.size} ${g.size}`}>
            <circle className="ui2-ring-track" cx={c} cy={c} r={g.radius} fill="none" strokeWidth={g.thickness} />
            {g.percent > 0 ? (
              <circle
                className="ui2-ring-bar"
                cx={c}
                cy={c}
                r={g.radius}
                fill="none"
                strokeWidth={g.thickness}
                strokeLinecap={cap}
                strokeDasharray={g.circumference}
                strokeDashoffset={g.offset}
              />
            ) : null}
          </svg>
          {centre || label ? (
            <div className="ui2-ring-text">
              {centre ? (
                <span className="ui2-ring-value" style={{ fontSize: centreSize }}>
                  {centre}
                </span>
              ) : null}
              {label ? (
                <span className="ui2-ring-label" style={{ fontSize: labelSize }}>
                  {label}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </InPlace>
    </div>
  );
};
