// UI 2.0's Timeline items (the shadcn pack's lib/ui2/nav/model.ts timelineItems, statusColor and formatDate), ported
// for the pack with MUI palette colours. Every function takes whatever the author bound and never throws.

import { formatDatePattern, isRecord, isScalar, toDay } from './lists/model';

// A palette colour by its theme path (success.main, text.secondary), which MUI's sx reads from the theme.
const PALETTE_PATH = /^(primary|secondary|error|warning|info|success|grey|text|action|common|background)\.\w+$/;

/** A colour a dot can be drawn in: a palette path or any CSS colour. Text that is neither ('notacolor') drew no dot at
 *  all, as MUI's sx passes it through and the browser drops it (MU-26). */
export const usableColor = (value: unknown): string | undefined => {
  if (!isScalar(value)) return undefined;
  const v = String(value).trim();
  if (!v) return undefined;
  if (PALETTE_PATH.test(v) || typeof document === 'undefined') return v;
  const probe = document.createElement('span').style;
  probe.color = v;
  return probe.color ? v : undefined;
};

export interface TimelineItem extends Record<string, unknown> {
  key: string;
  index: number;
  title: string;
  description: string;
  time: string;
  status: string;
  color: string;
  icon: string;
}

/** Timeline items in the given order or newest first; `limit` entries from the end it is read from. A string entry is
 *  a title; anything else that is not a record is skipped. */
export const timelineItems = (items: unknown, newestFirst = false, limit = Infinity): TimelineItem[] => {
  const all = Array.isArray(items) ? items : [];
  const start = newestFirst ? Math.max(0, all.length - limit) : 0;
  const out = all.slice(start, start + limit).flatMap((entry: unknown, offset): TimelineItem[] => {
    const index = start + offset;
    const pick = (v: unknown): string => (isScalar(v) && !(typeof v === 'number' && !Number.isFinite(v)) ? String(v) : '');
    if (isScalar(entry)) return [{ key: String(index), index, title: pick(entry), description: '', time: '', status: '', color: '', icon: '' }];
    if (!isRecord(entry)) return [];
    return [
      {
        ...entry,
        key: isScalar(entry.id) ? String(entry.id) : String(index),
        index,
        title: pick(entry.title ?? entry.label ?? entry.name ?? entry.children),
        description: pick(entry.description ?? entry.content ?? entry.text),
        time: pick(entry.time ?? entry.date ?? entry.timestamp),
        status: pick(entry.status),
        color: pick(entry.color),
        icon: pick(entry.icon),
      },
    ];
  });
  return newestFirst ? out.reverse() : out;
};

// Status words and the MUI palette colour each maps to (the author's statusColors map wins).
const STATUS_PALETTE: Record<string, string> = {
  success: 'success.main',
  completed: 'success.main',
  complete: 'success.main',
  done: 'success.main',
  paid: 'success.main',
  approved: 'success.main',
  delivered: 'success.main',
  warning: 'warning.main',
  pending: 'warning.main',
  waiting: 'warning.main',
  'in progress': 'info.main',
  info: 'info.main',
  active: 'primary.main',
  current: 'primary.main',
  primary: 'primary.main',
  error: 'error.main',
  failed: 'error.main',
  danger: 'error.main',
  destructive: 'error.main',
  cancelled: 'error.main',
  canceled: 'error.main',
  rejected: 'error.main',
};

/** A status's colour: the author's statusColors entry (exact word, then lowercase) when it is a colour, else its
 *  palette colour. */
export const statusColor = (status: unknown, colors: unknown): string | undefined => {
  if (!isScalar(status) || String(status).trim() === '') return undefined;
  const word = String(status).trim();
  if (isRecord(colors)) {
    const mine = usableColor(colors[word] ?? colors[word.toLowerCase()]);
    if (mine) return mine;
  }
  const lower = word.toLowerCase();
  return Object.prototype.hasOwnProperty.call(STATUS_PALETTE, lower) ? STATUS_PALETTE[lower] : undefined;
};

/** An ISO date or a timestamp in `dateFormat` (dayjs tokens: D MMM, HH:mm); anything else, or no format, as given. */
export const formatTime = (time: unknown, dateFormat: unknown): string => {
  if (!isScalar(time) || String(time) === '') return '';
  const format = typeof dateFormat === 'string' ? dateFormat.trim() : '';
  if (!format || !(typeof time === 'number' || /^\d{4}-\d{2}-\d{2}/.test(String(time)))) return String(time);
  const d = toDay(time);
  return d ? formatDatePattern(d, format) : String(time);
};
