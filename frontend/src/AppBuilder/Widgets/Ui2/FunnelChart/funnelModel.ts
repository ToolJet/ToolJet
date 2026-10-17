// ToolJet UI 2.0: the pure logic of the Funnel chart. Every function takes whatever the author bound and never throws.
import { fieldList, MAX_ROWS, resolveChartFields, type Row } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { axisLabel } from '@/AppBuilder/Widgets/Ui2/_shared/format';
import { isRecord, isSet, num } from '@/AppBuilder/Widgets/Ui2/_shared/values';

const round1 = (v: number) => Math.round(v * 10) / 10;

/** A funnel draws at most this many stages. */
export const MAX_STAGES = 24;

/** A funnel's stages in data order: label, value (negative reads as 0, a non-number as null), width (share of the
 *  widest stage, 0 to 1), ofFirst and ofPrevious (percent of the first stage and of the stage before, null when that
 *  stage is empty) and the source row. A stage or value field the data lacks falls back to the data's own. */
export interface FunnelStage {
  label: string | number;
  value: number | null;
  width: number;
  ofFirst: number | null;
  ofPrevious: number | null;
  row: Row;
}

export const funnelStages = (data: unknown, stageField: unknown, valueField: unknown): FunnelStage[] => {
  const rows = (Array.isArray(data) ? data : []).filter(isRecord).slice(0, MAX_ROWS);
  if (!rows.length) return [];
  const { x, series } = resolveChartFields(
    rows,
    isSet(stageField) ? String(stageField) : undefined,
    fieldList(valueField)
  );
  const field = series[0];
  const values = rows.map((row) => {
    const n = num(row[field]);
    return n === null ? null : Math.max(0, n);
  });
  const max = Math.max(0, ...values.filter((v): v is number => v !== null));
  const first = values[0];
  return rows.map((row, i) => {
    const value = values[i];
    const prev = i > 0 ? values[i - 1] : null;
    return {
      label: axisLabel(row[String(x)]),
      value,
      width: max > 0 && value !== null ? value / max : 0,
      ofFirst: first !== null && first > 0 && value !== null ? round1((value / first) * 100) : null,
      ofPrevious: prev !== null && prev > 0 && value !== null ? round1((value / prev) * 100) : null,
      row,
    };
  });
};
