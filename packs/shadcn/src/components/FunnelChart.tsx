import React, { useMemo } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ChartBoundary, ChartNotes, EmptyChart, lookVars, seriesColor, useChartClick } from '../lib/ui2/charts/chartParts';
import { animated, axisLabel, emphasis, fieldList, fieldNote, formatter, hiddenNote, isRecord, isSet, list, num, resolveChartFields, type Row } from '../lib/ui2/charts/chartModel';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';

/** A funnel draws at most this many stages. */
const MAX_STAGES = 24;
const round1 = (v: number) => Math.round(v * 10) / 10;

interface Stage {
  label: string | number;
  value: number | null;
  width: number;
  ofFirst: number | null;
  ofPrevious: number | null;
  row: Row;
}

/** The stages in data order: value (negative reads 0, a non-number null), width (share of the widest), and percent of
 *  the first stage and of the one before. A stage or value field the data lacks falls back to the data's own. */
const funnel = (data: unknown, stageField: unknown, valueField: unknown) => {
  const all = list(data).filter(isRecord);
  const rows = all.slice(0, MAX_STAGES);
  if (!rows.length) return { stages: [] as Stage[], hidden: 0, fieldNote: null as string | null };
  const fields = resolveChartFields(rows, isSet(stageField) ? String(stageField) : undefined, fieldList(valueField));
  const field = fields.series[0];
  const values = rows.map((row) => {
    const n = num(row[field]);
    return n === null ? null : Math.max(0, n);
  });
  const max = Math.max(0, ...values.filter((v): v is number => v !== null));
  const first = values[0];
  const stages = rows.map((row, i): Stage => {
    const value = values[i];
    const prev = i > 0 ? values[i - 1] : null;
    return {
      label: axisLabel(row[String(fields.x)]),
      value,
      width: max > 0 && value !== null ? value / max : 0,
      ofFirst: first !== null && first > 0 && value !== null ? round1((value / first) * 100) : null,
      ofPrevious: prev !== null && prev > 0 && value !== null ? round1((value / prev) * 100) : null,
      row,
    };
  });
  return { stages, hidden: all.length - rows.length, fieldNote: fieldNote(fields) };
};

const FORMAT_ENUM = ['number', 'currency', 'percent', 'compact'];

/** Stages as centred (or left-aligned) bars, widest first, with each stage's value and its conversion from the stage
 *  before (or from the first). Plain HTML: labels never clip. */
export const FunnelChart = () => {
  const [data] = ToolJet.useStateArray({
    name: 'data',
    label: 'Data',
    initialValue: [
      { stage: 'Visited', count: 12480 },
      { stage: 'Signed up', count: 3920 },
      { stage: 'Activated', count: 2210 },
      { stage: 'Trial', count: 1180 },
      { stage: 'Paid', count: 412 },
    ],
  });
  const [stageField] = ToolJet.useStateString({ name: 'stageField', label: 'Stage field', initialValue: 'stage' });
  const [valueField] = ToolJet.useStateString({ name: 'valueField', label: 'Value field', initialValue: 'count' });
  const [showConversion] = ToolJet.useStateBoolean({ name: 'showConversion', label: 'Conversion %', initialValue: true });
  const [conversionBase] = ToolJet.useStateEnumeration({ name: 'conversionBase', label: 'Conversion from', enumDefinition: ['previous', 'first'], enumLabels: { previous: 'Previous stage', first: 'First stage' }, initialValue: 'previous', inspector: 'switch' });
  const [align] = ToolJet.useStateEnumeration({ name: 'align', label: 'Bar alignment', enumDefinition: ['center', 'left'], initialValue: 'center', inspector: 'switch' });
  const [colorByStage] = ToolJet.useStateBoolean({ name: 'colorByStage', label: 'Colour per stage', initialValue: false });
  const [yAxisFormat] = ToolJet.useStateEnumeration({ name: 'yAxisFormat', label: 'Value format', enumDefinition: FORMAT_ENUM, initialValue: 'number', inspector: 'switch' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency code', initialValue: 'USD' });
  const [valuePrefix] = ToolJet.useStateString({ name: 'valuePrefix', label: 'Value prefix', initialValue: '' });
  const [valueSuffix] = ToolJet.useStateString({ name: 'valueSuffix', label: 'Value suffix', initialValue: '' });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty message', initialValue: 'No data' });
  const [animate] = ToolJet.useStateBoolean({ name: 'animate', label: 'Animate', initialValue: true });
  const [colors] = ToolJet.useStateArray({ name: 'colors', label: 'Series colors (in order)', initialValue: [] });
  const [highlightClicked] = ToolJet.useStateBoolean({ name: 'highlightClicked', label: 'Highlight clicked point', description: 'Draws the clicked stage emphasised until Clear clicked point runs or another is clicked.', initialValue: false });
  const click = useChartClick(highlightClicked);
  const chartColor = useThemeColor('chartColor', 'Chart color (series palette from it)', TOKEN.brand);
  const axisTextColor = useThemeColor('axisTextColor', 'Stage label color', TOKEN.mutedText);
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 24 });

  const drawn = useMemo(() => funnel(data, stageField, valueField), [data, stageField, valueField]);
  const { stages } = drawn;
  const format = useMemo(
    () => formatter({ format: yAxisFormat, currency, prefix: valuePrefix, suffix: valueSuffix }, yAxisFormat === 'compact'),
    [yAxisFormat, currency, valuePrefix, valueSuffix]
  );
  const conversion = showConversion !== false;
  const labelWidth = Math.min(180, Math.max(56, Math.max(0, ...stages.map((s) => String(s.label).length)) * 7 + 12));
  const valueWidth = Math.max(40, Math.max(0, ...stages.map((s) => String(format(s.value)).length)) * 7.5 + 4) + (conversion ? 52 : 0);
  const base = conversionBase === 'first' ? 'ofFirst' : 'ofPrevious';
  const centred = align !== 'left';
  const byStage = colorByStage === true;
  const fade = (i: number) => (stages.length > 1 ? 1 - (i / (stages.length - 1)) * 0.45 : 1);
  const empty = !stages.length || stages.every((s) => s.value === null);
  const grow = animated(animate);

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <div className="ui ui2-chart" style={lookVars({ '--lk-axis': axisTextColor })} onDoubleClick={click.doubleClick}>
        <div className="ui2-chart-plot">
          {empty ? (
            <EmptyChart text={String(isSet(emptyText) ? emptyText : 'No data')} />
          ) : (
            <ChartBoundary resetKey={[data, stageField, valueField]}>
              <div className="ui2-funnel">
                {stages.map((stage, i) => {
                  const conv = i > 0 ? stage[base] : null;
                  return (
                    <button type="button" key={`${stage.label}-${i}`} className="ui2-funnel-stage" onClick={() => click.pick(stage.row)}>
                      <span className="ui2-funnel-label" style={{ width: labelWidth }} title={String(stage.label)}>
                        {String(stage.label)}
                      </span>
                      <span className="ui2-funnel-track" style={{ justifyContent: centred ? 'center' : 'flex-start' }}>
                        <span
                          className="ui2-funnel-bar"
                          style={{
                            // A late stage of a steep funnel still reads as a bar, not a hairline.
                            width: `${stage.value ? Math.max(6, stage.width * 100) : 0}%`,
                            background: seriesColor(colors, chartColor, byStage ? i : 0),
                            opacity: (byStage ? 1 : fade(i)) * emphasis(stage.row, click.highlighted),
                            ...(grow ? { animation: `ui2-funnel-grow 600ms ease-out ${i * 60}ms both`, transformOrigin: centred ? 'center' : 'left' } : {}),
                          }}
                        />
                      </span>
                      <span className="ui2-funnel-figures" style={{ width: valueWidth }}>
                        <span className="ui2-funnel-value">{format(stage.value)}</span>
                        {conversion ? <span className="ui2-funnel-conv">{conv === null ? '' : `${conv}%`}</span> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ChartBoundary>
          )}
        </div>
        <ChartNotes notes={[drawn.fieldNote, hiddenNote(drawn.hidden, 'stage')]} />
      </div>
    </LoadingFrame>
  );
};
