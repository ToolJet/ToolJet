import React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { themeVars } from '../lib/themeVars';
import { cn } from '../lib/cn';
import { css, cssPx } from '../lib/ui2/charts/progressModel';
import { BarSkel, LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useDrawnNumber, useThemeColor } from '../lib/styleDefaults';
import '../styles/ui2-charts-progress.css';

export const Progress = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: '' });
  const [value, setValue] = ToolJet.useStateNumber({
    name: 'value',
    label: 'Percent',
    initialValue: 60,
  });
  const [showValue] = ToolJet.useStateBoolean({ name: 'showValue', label: 'Show percent', initialValue: false });
  const [variant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Color',
    enumDefinition: ['default', 'success', 'warning', 'destructive'],
    initialValue: 'default',
    section: 'Appearance',
  });

  ToolJet.useAction(
    { name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] },
    (next) => setValue(Number(next) || 0)
  );
  const barColor = useThemeColor('barColor', 'Bar color', TOKEN.brand);
  const trackColor = useThemeColor('trackColor', 'Track color', TOKEN.brand);
  const labelColor = useThemeColor('labelColor', 'Label color', TOKEN.text);
  const valueColor = useThemeColor('valueColor', 'Percent text color', TOKEN.mutedText);
  const barHeight = useDrawnNumber('barHeight', 'Bar height', 8);
  // The pack's earlier name for the bar color; Bar color wins when both are set.
  const accent = ToolJet.useStyleString({ name: 'accentColor', label: 'Fill', inspector: 'color', initialValue: '' });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ role: 'progress', fit: false, loading: 'own', defaultWidth: 12, defaultHeight: 4 });

  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  const bar = css(barColor) || css(accent);
  const vars = {
    ...themeVars({ primary: bar }),
    '--pg-track': css(trackColor),
    '--pg-label': css(labelColor),
    '--pg-value': css(valueColor),
    '--pg-height': cssPx(barHeight),
  } as React.CSSProperties;

  return (
    <LoadingFrame loading={ld.loading} look={ld.skeleton ? <BarSkel label={!!(label || showValue)} /> : <LoadingBox />}>
      <div className="ui ui2-progress" style={vars}>
        {label || showValue ? (
          <div className="ui2-progress-head">
            <span className="ui2-progress-label">{label}</span>
            {showValue ? <span className="ui2-progress-value">{Math.round(pct)}%</span> : null}
          </div>
        ) : null}
        <ProgressPrimitive.Root
          className={cn('ui-progress', !bar && `ui-progress--${variant}`)}
          value={pct}
          aria-label={label || 'Progress'}
        >
          <ProgressPrimitive.Indicator
            className="ui-progress-bar"
            style={{ transform: `translateX(-${100 - pct}%)` }}
          />
        </ProgressPrimitive.Root>
      </div>
    </LoadingFrame>
  );
};
