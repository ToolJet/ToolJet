// ToolJet UI 2.0: the pure logic of the Combo chart. Every function takes whatever the author bound and never throws.
import { fieldList, MAX_SERIES } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';

/** The series a combo chart draws: the bar fields, then the line fields not already drawn as bars, each on the left
 *  value axis or, when listed in rightFields, the right one (a margin % line over revenue bars). */
export interface ComboSeries {
  field: string;
  kind: 'bar' | 'line';
  axis: 'left' | 'right';
}

export const comboSeries = (barFields: unknown, lineFields: unknown, rightFields: unknown): ComboSeries[] => {
  const bars = fieldList(barFields);
  const right = fieldList(rightFields);
  const lines = fieldList(lineFields).filter((f) => !bars.includes(f));
  return [
    ...bars.map((field): ComboSeries => ({ field, kind: 'bar', axis: right.includes(field) ? 'right' : 'left' })),
    ...lines.map((field): ComboSeries => ({ field, kind: 'line', axis: right.includes(field) ? 'right' : 'left' })),
  ].slice(0, MAX_SERIES);
};
