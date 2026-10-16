// ToolJet UI 2.0: the progress list's rows (ProgressList.tsx), pure as sectionsModel.ts: every function takes
// whatever the author bound and never throws.
import { FORMATS } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { chipTone } from '@/AppBuilder/Widgets/Ui2/_shared/chipTone';
import { firstTextField, formatValue, isText, percentOf, shown, uniqueKeys, type Row } from './sectionsModel';

export const PROGRESS_TONES: readonly string[] = ['success', 'warning', 'danger', 'info', 'neutral'];
const TONE_NAMES: Record<string, string> = {
  positive: 'success',
  good: 'success',
  negative: 'danger',
  bad: 'danger',
  error: 'danger',
};
// Words a goal or a budget is described with that a status chip does not know.
const PROGRESS_WORDS: [string, RegExp][] = [
  ['danger', /\b(over|over budget|over limit|overspent|exceeded|behind|off track)\b/],
  ['success', /\b(ahead|achieved|met|hit|reached|under budget)\b/],
];

/** A row's tone from its status: a tone name ('success', 'warning', 'danger', 'info', 'neutral'), else the status's
 *  words ('On track' success, 'At risk' warning, 'Over budget' or 'Behind' danger). '' when it has none. */
export const progressTone = (status: unknown): string => {
  if (typeof status !== 'string' || !status.trim()) return '';
  const text = status.trim().toLowerCase();
  if (PROGRESS_TONES.includes(text)) return text;
  if (TONE_NAMES[text]) return TONE_NAMES[text];
  const word = PROGRESS_WORDS.find(([, re]) => re.test(text.replace(/[_-]+/g, ' ')));
  if (word && !/^not\b/.test(text)) return word[0];
  const tone = chipTone(status);
  return tone === 'neutral' ? '' : tone;
};

/** The tone a percentage gives under autoTone: 'goal' turns green at 100%; 'limit' (a budget, a quota) amber from
 *  80% and red over 100%. '' otherwise. */
export const autoProgressTone = (pct: number | null, mode: unknown): string => {
  if (pct === null || !Number.isFinite(pct)) return '';
  if (mode === 'goal') return pct >= 100 ? 'success' : '';
  if (mode === 'limit') return pct > 100 ? 'danger' : pct >= 80 ? 'warning' : '';
  return '';
};

const PROGRESS_FORMATS: readonly string[] = ['auto', ...FORMATS];

/** Rows of a progress list: { key, label, value, target, pct, caption, status, tone, row, index }. pct is percentField
 *  when it holds a number, else value / target; a row with a value and no target reads its value as the percentage.
 *  value and target show in valueFormat. The status gives the tone (a status that only names a tone shows no chip),
 *  else autoTone does. Rows that are not objects are skipped. */
/** The progress list's field properties, as bound. */
export interface ProgressFields {
  labelField?: unknown;
  valueField?: unknown;
  targetField?: unknown;
  percentField?: unknown;
  statusField?: unknown;
  captionField?: unknown;
  idField?: unknown;
  valueFormat?: unknown;
  autoTone?: unknown;
  currency?: unknown;
}

export interface ProgressItem {
  key: string;
  label: string;
  value: string;
  target: string;
  pct: number | null;
  caption: string;
  status: string;
  tone: string;
  row: Row;
  index: number;
}

export const progressItems = (data: unknown, fields: ProgressFields = {}): ProgressItem[] => {
  if (!Array.isArray(data)) return [];
  const f = fields || {};
  const format = typeof f.valueFormat === 'string' && PROGRESS_FORMATS.includes(f.valueFormat) ? f.valueFormat : 'auto';
  const numberOf = (v: unknown): number | null =>
    typeof v === 'number' ? (Number.isFinite(v) ? v : null) : percentOf(v);
  const items = data.flatMap((row: Row, index: number): (ProgressItem & { keyFromId: boolean })[] => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const labelKey = isText(f.labelField) && f.labelField in row ? f.labelField : firstTextField(row);
    const id = isText(f.idField) ? row[f.idField] : row.id;
    const rawValue = isText(f.valueField) ? row[f.valueField] : undefined;
    const rawTarget = isText(f.targetField) ? row[f.targetField] : undefined;
    const value = numberOf(rawValue);
    const target = numberOf(rawTarget);
    let pct = isText(f.percentField) ? numberOf(row[f.percentField]) : null;
    if (pct === null && value !== null) pct = target !== null ? (target > 0 ? (value / target) * 100 : null) : value;
    const status = isText(f.statusField) ? shown(row[f.statusField]).trim() : '';
    const tone = progressTone(status) || autoProgressTone(pct, f.autoTone);
    return [
      {
        key: shown(id) || String(index),
        keyFromId: !!shown(id),
        label: labelKey ? shown(row[labelKey]) : '',
        value: value !== null ? formatValue(value, format, f.currency) : '',
        target: target !== null ? formatValue(target, format, f.currency) : '',
        pct,
        caption: isText(f.captionField) ? shown(row[f.captionField]).trim() : '',
        // A status that only names a tone colours the bar without a chip.
        status: status && !PROGRESS_TONES.includes(status.toLowerCase()) ? status : '',
        tone,
        row,
        index,
      },
    ];
  });
  return uniqueKeys(
    items.map(({ keyFromId, ...item }) => item),
    items.map((item) => item.keyFromId)
  );
};
