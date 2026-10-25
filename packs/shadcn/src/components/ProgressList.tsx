import React, { useEffect, useMemo, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { themeVars } from '../lib/themeVars';
import { cn } from '../lib/cn';
import {
  BAR_HEIGHT,
  TONE_VAR,
  barWidth,
  chipLabel,
  chipTone,
  css,
  cssPx,
  fontStack,
  percentLabel,
  progressEntries,
  progressItem,
  progressMax,
} from '../lib/ui2/charts/progressModel';
import { useRecordSelection } from '../lib/ui2/display/lists/useRecordSelection';
import { LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { ProgressRowsSkel } from '../lib/ui2/loading/shapes';
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import { inkOf } from '../lib/ink';
import '../styles/ui2-charts-progress.css';

// Goals, budgets, quotas: each row a label, its value against a target, a bar, an optional status chip and caption.
const ROWS_PER_STEP = 100;
// A tone as text: readable on its tint and on the background (lib/ink.ts).
const toneInk = (tone: string) => inkOf(TONE_VAR[tone] || TONE_VAR.neutral);

const Chip = ({ value, tone }: { value: string; tone: string }) => {
  const color = TONE_VAR[tone] || TONE_VAR.neutral;
  return (
    <span
      className="ui2-chip"
      title={value}
      data-tone={tone}
      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color: toneInk(tone) }}
    >
      {chipLabel(value)}
    </span>
  );
};

export const ProgressList = () => {
  const [data] = ToolJet.useStateArray({
    name: 'data',
    label: 'Data',
    initialValue: [
      { id: 1, label: 'Marketing', spent: 18400, budget: 25000, status: 'On track', note: '12 days left in the quarter' },
      { id: 2, label: 'Engineering tools', spent: 9100, budget: 10000, status: 'At risk', note: 'Renewals due in November' },
      { id: 3, label: 'Travel', spent: 7600, budget: 6000, status: 'Over budget', note: 'Over by $1,600' },
      { id: 4, label: 'Training', spent: 1200, budget: 5000, status: '', note: 'Courses start in November' },
    ],
  });
  const [labelField] = ToolJet.useStateString({ name: 'labelField', label: 'Label field', initialValue: 'label' });
  const [valueField] = ToolJet.useStateString({ name: 'valueField', label: 'Value field', initialValue: 'spent' });
  const [targetField] = ToolJet.useStateString({ name: 'targetField', label: 'Target field', initialValue: 'budget' });
  const [percentField] = ToolJet.useStateString({ name: 'percentField', label: 'Percent field (0 to 100; overrides value / target)', initialValue: '' });
  const [captionField] = ToolJet.useStateString({ name: 'captionField', label: 'Caption field (a line under the bar)', initialValue: 'note' });
  const [statusField] = ToolJet.useStateString({ name: 'statusField', label: 'Status field (a chip, or a tone name)', initialValue: 'status' });
  // Number by default: a currency default printed bound order counts as $10 (the sample budgets read as figures).
  const [valueFormat] = ToolJet.useStateEnumeration({ name: 'valueFormat', label: 'Value format', enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact'], enumLabels: { auto: 'Auto', number: 'Number', currency: 'Currency', percent: 'Percent', compact: 'Compact' }, initialValue: 'number' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency (ISO code, e.g. USD)', initialValue: 'USD' });
  const [idField] = ToolJet.useStateString({ name: 'idField', label: 'Id field', initialValue: 'id' });
  const [autoTone] = ToolJet.useStateEnumeration({ name: 'autoTone', label: 'Tone from progress', enumDefinition: ['none', 'goal', 'limit'], enumLabels: { none: 'None', goal: 'Goal', limit: 'Limit' }, initialValue: 'none', inspector: 'switch' });
  const [showValues] = ToolJet.useStateBoolean({ name: 'showValues', label: 'Show value of target', initialValue: true });
  const [showPercent] = ToolJet.useStateBoolean({ name: 'showPercent', label: 'Show percentage', initialValue: true });
  const [barSize] = ToolJet.useStateEnumeration({ name: 'barSize', label: 'Bar size', enumDefinition: ['thin', 'default', 'thick'], enumLabels: { thin: 'Thin', default: 'Default', thick: 'Thick' }, initialValue: 'default', inspector: 'switch' });
  const [listStyle] = ToolJet.useStateEnumeration({ name: 'listStyle', label: 'List style', enumDefinition: ['card', 'plain'], enumLabels: { card: 'Card', plain: 'Plain' }, initialValue: 'card', inspector: 'switch' });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty text', initialValue: 'Nothing to track yet' });
  const [, setSelectedItem] = ToolJet.useStateObject({ name: 'selectedItem', initialValue: {}, inspector: 'hidden' });
  const [, setSelectedItemId] = ToolJet.useStateString({ name: 'selectedItemId', initialValue: '', inspector: 'hidden' });
  const [, setSelectedItemIndex] = ToolJet.useStateNumber({ name: 'selectedItemIndex', initialValue: -1, inspector: 'hidden' });
  const onItemClicked = ToolJet.useEventCallback({ name: 'onItemClicked' });
  const backgroundColor = useThemeColor('backgroundColor', 'List background', TOKEN.surface);
  const borderColor = useThemeColor('borderColor', 'Border and divider color', TOKEN.border);
  const titleColor = useThemeColor('titleColor', 'Label and value color', TOKEN.text);
  const textColor = useThemeColor('textColor', 'Caption color', TOKEN.mutedText);
  const accent = useThemeColor('accentColor', 'Bar color (rows without a tone)', TOKEN.brand);
  const trackColor = useThemeColor('trackColor', 'Bar track color', TOKEN.text);
  const borderRadius = useThemeRadius('borderRadius', 'List radius');
  const titleFontFamily = ToolJet.useStyleEnumeration({
    name: 'titleFontFamily',
    label: 'Label typeface',
    enumDefinition: ['theme', 'sans', 'serif', 'display', 'mono'],
    enumLabels: { theme: 'Theme font', sans: 'Sans serif', serif: 'Serif', display: 'Display serif', mono: 'Monospace' },
    initialValue: 'theme',
  });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 36 });

  const fields = { labelField, valueField, targetField, percentField, captionField, statusField, valueFormat, currency, idField, autoTone };
  const entries = useMemo(() => progressEntries(data, idField), [data, idField]);
  const max = useMemo(() => progressMax(entries, fields), [entries, valueField, targetField]); // eslint-disable-line react-hooks/exhaustive-deps
  // The first rows and a Show more button for the next ones: a 10,000-row binding would freeze the page.
  const [shown, setShown] = useState(ROWS_PER_STEP);
  useEffect(() => setShown(ROWS_PER_STEP), [entries]);
  const rows = entries.slice(0, shown).map((entry) => progressItem(entry, { ...fields, max }));
  const barHeight = BAR_HEIGHT[String(barSize)] || BAR_HEIGHT.default;
  const card = listStyle !== 'plain';
  const remaining = entries.length - shown;

  // Followed through every entry, not only the rows drawn so far; the id keeps its type (a number stays a number).
  const { pick: select } = useRecordSelection(
    entries,
    (row) => row[idField || 'id'],
    { setItem: setSelectedItem, setId: (id) => setSelectedItemId(id as string), setIndex: setSelectedItemIndex },
    onItemClicked
  );

  const vars = {
    ...themeVars({ primary: css(accent) }),
    '--pg-bg': css(backgroundColor),
    '--pg-border': css(borderColor),
    '--pg-title': css(titleColor),
    '--pg-text': css(textColor),
    '--pg-accent': css(accent),
    '--pg-track': css(trackColor),
    '--pg-radius': cssPx(borderRadius),
    '--pg-title-font': fontStack(titleFontFamily) || undefined,
  } as React.CSSProperties;

  if (!entries.length) {
    return (
      <LoadingFrame loading={ld.loading} minHeight={160} look={ld.skeleton ? <ProgressRowsSkel count={Math.min(rows.length || 4, 8)} barHeight={barHeight} /> : <LoadingBox />}>
        <div className={cn('ui ui2-plist is-fill', card && 'is-card')} style={vars}>
          <div className="ui2-plist-empty-wrap">
            <p className="ui2-plist-empty">{emptyText || 'Nothing to track yet'}</p>
          </div>
        </div>
      </LoadingFrame>
    );
  }

  return (
    <LoadingFrame loading={ld.loading} minHeight={160} look={ld.skeleton ? <ProgressRowsSkel count={Math.min(rows.length || 4, 8)} barHeight={barHeight} /> : <LoadingBox />}>
      <div className={cn('ui ui2-plist is-fill', card && 'is-card')} style={vars}>
        <ul className="ui2-plist-rows" role="list">
          {rows.map((row) => {
            const figure = showValues && row.value ? (row.target ? `${row.value} of ${row.target}` : row.value) : '';
            // A relative bar (a share of the largest value) is drawn, never printed as a percentage.
            const pct = row.pct !== null && Number.isFinite(row.pct) && !row.relative ? percentLabel(row.pct) : '';
            const headPct = pct && showPercent && !row.caption;
            return (
              <li key={row.key} data-tone={row.tone || undefined}>
                <button type="button" className="ui2-plist-row" onClick={() => select(row)}>
                  <span className="ui2-plist-head">
                    <span className="ui2-plist-title">
                      <span className="ui2-plist-label">{row.label}</span>
                      {row.status ? <Chip value={row.status} tone={row.tone || chipTone(row.status)} /> : null}
                    </span>
                    {figure || headPct ? (
                      <span className="ui2-plist-figure">
                        {figure ? <b>{figure}</b> : null}
                        {headPct ? <span className="ui2-plist-pct">{pct}</span> : null}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="ui2-plist-bar"
                    role="progressbar"
                    aria-label={row.label || undefined}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={row.pct !== null && Number.isFinite(row.pct) ? Math.round(barWidth(row.pct)) : undefined}
                    style={{ height: barHeight }}
                  >
                    <span style={{ width: `${barWidth(row.pct)}%`, background: row.tone ? TONE_VAR[row.tone] : undefined }} />
                  </span>
                  {row.caption ? (
                    <span className="ui2-plist-foot">
                      <span className="ui2-plist-caption">{row.caption}</span>
                      {pct && showPercent ? (
                        <span className="ui2-plist-pct" style={row.tone ? { color: toneInk(row.tone) } : undefined}>
                          {pct}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
        {remaining > 0 ? (
          <div className="ui2-plist-more">
            <button type="button" onClick={() => setShown((n) => n + ROWS_PER_STEP)}>
              {`Show ${Math.min(ROWS_PER_STEP, remaining)} more of ${remaining}`}
            </button>
          </div>
        ) : null}
      </div>
    </LoadingFrame>
  );
};
