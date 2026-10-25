import React from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { FONT_LABELS, FONT_VALUES, fontStack, px, styleVars } from '../lib/ui2/display/lists/model';
import { useWidth } from '../lib/ui2/display/lists/parts';
import { STRIP_VALUE_FORMATS, stripColumns, summaryFigures } from '../lib/ui2/display/summary';
import { LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { FiguresSkel } from '../lib/ui2/loading/shapes';
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-display.css';

const MIN_WIDTH: Record<string, number> = { sm: 120, default: 140, lg: 170 };

// A row of figures: [{ label, value, delta, format, deltaFormat, tone, lowerIsBetter, caption }].
export const SummaryStrip = () => {
  const [items] = ToolJet.useStateArray({
    name: 'items',
    label: 'Figures',
    description: 'Array of { label, value, delta, format, deltaFormat, tone, lowerIsBetter, caption }.',
    initialValue: [
      { label: 'Revenue', value: 48210, delta: 12.4, caption: 'vs last month' },
      { label: 'Orders', value: 1284, format: 'number', delta: 5.1, caption: 'vs last month' },
      { label: 'Average order', value: 37.55, delta: -2.3, caption: 'vs last month' },
      { label: 'Refund rate', value: 2.1, format: 'percent', delta: -0.4, deltaFormat: 'number', lowerIsBetter: true, caption: 'points' },
    ],
  });
  const [valueFormat] = ToolJet.useStateEnumeration({
    name: 'valueFormat',
    label: 'Value format',
    enumDefinition: STRIP_VALUE_FORMATS,
    enumLabels: { auto: 'Auto', number: 'Number', currency: 'Currency', percent: 'Percent', compact: 'Compact', date: 'Date' },
    initialValue: 'auto',
  });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency (ISO code, e.g. USD)', initialValue: 'USD' });
  const [deltaFormat] = ToolJet.useStateEnumeration({
    name: 'deltaFormat',
    label: 'Change format (numbers)',
    enumDefinition: ['percent', 'number', 'currency'],
    enumLabels: { percent: 'Percent', number: 'Number', currency: 'Currency' },
    initialValue: 'percent',
    inspector: 'switch',
  });
  // 'cards' is the pack's own extra: each figure in its own panel.
  const [appearance] = ToolJet.useStateEnumeration({
    name: 'appearance',
    label: 'Appearance',
    enumDefinition: ['panel', 'plain', 'cards'],
    enumLabels: { panel: 'Panel', plain: 'Plain', cards: 'Cards' },
    initialValue: 'panel',
    inspector: 'switch',
  });
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['sm', 'default', 'lg'],
    enumLabels: { sm: 'Small', default: 'Default', lg: 'Large' },
    initialValue: 'default',
    inspector: 'switch',
  });
  const [align] = ToolJet.useStateEnumeration({
    name: 'align',
    label: 'Align',
    enumDefinition: ['left', 'center'],
    enumLabels: { left: 'Left', center: 'Center' },
    initialValue: 'left',
    inspector: 'switch',
  });
  const background = useThemeColor('backgroundColor', 'Panel background', TOKEN.surface);
  const borderColor = useThemeColor('borderColor', 'Border and separator color', TOKEN.border);
  const labelColor = useThemeColor('labelColor', 'Label and caption color', TOKEN.mutedText);
  const valueColor = useThemeColor('valueColor', 'Figure color', TOKEN.text);
  const positive = useThemeColor('positiveColor', 'Positive change color', TOKEN.success);
  const negative = useThemeColor('negativeColor', 'Negative change color', TOKEN.error);
  const borderRadius = useThemeRadius('borderRadius', 'Panel radius');
  const valueFontFamily = ToolJet.useStyleEnumeration({ name: 'valueFontFamily', label: 'Figure typeface', enumDefinition: FONT_VALUES, enumLabels: FONT_LABELS, initialValue: 'theme' });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 43, defaultHeight: 11 });

  const [ref, width] = useWidth<HTMLDivElement>();
  const figures = summaryFigures(items, { valueFormat, currency, deltaFormat });
  const sizeKey = MIN_WIDTH[size] ? size : 'default';
  const look = ['panel', 'plain', 'cards'].includes(appearance) ? appearance : 'panel';
  const columns = stripColumns(figures.length, width || 960, MIN_WIDTH[sizeKey]);
  const captions = figures.some((f) => f.caption);
  const vars = styleVars([
    [background, '--lk-bg'],
    [borderColor, '--lk-border'],
    [labelColor, '--lk-fg'],
    [valueColor, '--lk-title'],
    [positive, '--lk-pos'],
    [negative, '--lk-neg'],
    [borderRadius, '--lk-radius', px],
    [valueFontFamily, '--lk-title-font', fontStack],
  ]);

  return (
    <LoadingFrame loading={ld.loading} minHeight={80} look={ld.skeleton ? <FiguresSkel count={figures.length || 4} columns={columns} captions={figures.some((f) => !!f.caption)} /> : <LoadingBox />}>
      <div ref={ref} className="ui ui2-strip-box" style={vars}>
        {!figures.length ? (
          <div className={cn('ui2-strip', `is-${look}`, 'is-empty')}>
            <p>No figures yet</p>
          </div>
        ) : (
          <dl
            className={cn('ui2-strip', `is-${look}`, `is-${sizeKey}`, align === 'center' && 'is-centered')}
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {figures.map((f, i) => (
              <div key={f.key} className={cn('ui2-strip-cell', i % columns !== 0 && 'has-left', i >= columns && 'has-top')}>
                {f.label ? <dt className="ui2-strip-label">{f.label}</dt> : null}
                <dd className="ui2-strip-line">
                  <span className="ui2-strip-value">{f.value || '–'}</span>
                  {f.delta ? (
                    <span className="ui2-strip-delta" data-tone={f.delta.tone}>
                      {f.delta.text}
                    </span>
                  ) : null}
                </dd>
                {f.caption ? (
                  <dd className="ui2-strip-caption">{f.caption}</dd>
                ) : captions ? (
                  <dd aria-hidden="true" className="ui2-strip-caption is-spacer">
                    &nbsp;
                  </dd>
                ) : null}
              </div>
            ))}
          </dl>
        )}
      </div>
    </LoadingFrame>
  );
};
