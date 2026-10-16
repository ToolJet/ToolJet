import { LayoutBox } from './types';

// Plain-words descriptions for the change list. Keep these short: they are
// read in a list next to an outlined canvas, not in a log.

const LABELS: Record<string, string> = {
  text: 'Text',
  label: 'Label',
  placeholder: 'Placeholder',
  value: 'Value',
  defaultValue: 'Default value',
  data: 'Data',
  columns: 'Columns',
  visibility: 'Visibility',
  disabledState: 'Disabled',
  loadingState: 'Loading state',
  tooltip: 'Tooltip',
  title: 'Title',
  options: 'Options',
  backgroundColor: 'Background colour',
  textColor: 'Text colour',
  borderColor: 'Border colour',
  borderRadius: 'Corner radius',
  boxShadow: 'Shadow',
  fontSize: 'Font size',
  fontWeight: 'Font weight',
  textAlign: 'Alignment',
  padding: 'Padding',
  showOnDesktop: 'Shown on desktop',
  showOnMobile: 'Shown on mobile',
  canvasBackgroundColor: 'Canvas background',
  canvasMaxWidth: 'Canvas max width',
  canvasMaxWidthType: 'Canvas width unit',
  canvasMaxHeight: 'Canvas max height',
  appMode: 'Colour mode',
  appInMaintenance: 'Maintenance mode',
  hideHeader: 'Hide header',
  query: 'SQL',
  url: 'URL',
  method: 'Method',
  body: 'Body',
  code: 'Code',
  runOnPageLoad: 'Run on page load',
  showSuccessNotification: 'Success toast',
  transformation: 'Transformation',
  enableTransformation: 'Transformation on',
};

export function humanize(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Component properties are stored as { value, fxActive }. Show the value.
export function unwrap(value: any): any {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'value' in value) return value.value;
  return value;
}

export function show(value: any, max = 48): string {
  const inner = unwrap(value);
  if (inner === undefined || inner === null || inner === '') return 'empty';
  if (typeof inner === 'boolean') return inner ? 'on' : 'off';
  let text: string;
  if (typeof inner === 'string') text = inner;
  else if (typeof inner === 'number' || typeof inner === 'boolean') text = String(inner);
  else text = JSON.stringify(inner);
  text = text.replace(/\s+/g, ' ').trim();
  const boolean = text.match(/^\{\{\s*(true|false)\s*\}\}$/);
  if (boolean) return boolean[1] === 'true' ? 'on' : 'off';
  // {{96}} and 96 read the same to a builder.
  const literal = text.match(/^\{\{\s*(-?\d+(?:\.\d+)?)\s*\}\}$/);
  if (literal) text = literal[1];
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return text;
  return text.length > max ? `"${text.slice(0, max - 1)}…"` : `"${text}"`;
}

const isBinding = (value: any) => typeof unwrap(value) === 'string' && /\{\{[\s\S]*\}\}/.test(unwrap(value));

const refName = (item: any): string | null => {
  if (typeof item === 'string') return item.replace(/^@\w+:/, '');
  if (item && typeof item === 'object') {
    const name = item.name ?? item.key ?? item.label ?? item.columnName ?? item.id;
    return typeof name === 'string' || typeof name === 'number' ? String(name) : null;
  }
  return null;
};

// Lists of named things (table columns, flex child order, options) are
// described by what joined, left or moved, not by the whole list.
function describeListChange(label: string, from: any[], to: any[]): string | null {
  const a = from.map(refName);
  const b = to.map(refName);
  if (a.some((x) => x == null) || b.some((x) => x == null)) return null;
  const added = b.filter((x) => !a.includes(x));
  const removed = a.filter((x) => !b.includes(x));
  const names = (list: string[]) =>
    list.length > 4 ? `${list.slice(0, 3).join(', ')} and ${list.length - 3} more` : list.join(', ');
  const parts: string[] = [];
  if (added.length) parts.push(`added ${names(added)}`);
  if (removed.length) parts.push(`removed ${names(removed)}`);
  const keptA = a.filter((x) => b.includes(x));
  const keptB = b.filter((x) => a.includes(x));
  if (keptA.join('\u0000') !== keptB.join('\u0000')) parts.push('reordered');
  if (!parts.length) {
    const editedCount = to.filter(
      (item, i) => JSON.stringify(item) !== JSON.stringify(from.find((old) => refName(old) === b[i]))
    ).length;
    if (editedCount) parts.push(`${editedCount} edited`);
  }
  return parts.length ? `${label}: ${parts.join(', ')}` : null;
}

export function describeValueChange(label: string, from: any, to: any): string {
  const a = unwrap(from);
  const b = unwrap(to);
  if (Array.isArray(a) && Array.isArray(b)) {
    const listed = describeListChange(label, a, b);
    if (listed) return listed;
  }
  if (from === undefined) return `${label} set to ${show(to)}`;
  if (to === undefined) return `${label} cleared (was ${show(from)})`;
  const fromText = show(from);
  const toText = show(to);
  if (fromText === toText) {
    const fxFrom = !!from?.fxActive;
    const fxTo = !!to?.fxActive;
    if (fxFrom !== fxTo) return `${label} ${fxTo ? 'now set with code' : 'no longer set with code'}`;
    return `${label} changed`;
  }
  if (isBinding(to) && !isBinding(from)) return `${label} now bound to ${toText} (was ${fromText})`;
  // Long code: quote the stretch around the first difference, not the start.
  const code = (value: any) =>
    typeof unwrap(value) === 'string'
      ? unwrap(value).replace(/\s+/g, ' ').replace(/\{\{ /g, '{{').replace(/ \}\}/g, '}}')
      : null;
  const fromCode = code(from);
  const toCode = code(to);
  if (fromCode && toCode && (fromCode.length > 48 || toCode.length > 48)) {
    let i = 0;
    while (i < fromCode.length && i < toCode.length && fromCode[i] === toCode[i]) i++;
    const start = Math.max(0, i - 10);
    const clip = (text: string) =>
      `"${start ? '…' : ''}${text.slice(start, start + 34)}${text.length > start + 34 ? '…' : ''}"`;
    return `${label} edited: ${clip(fromCode)} became ${clip(toCode)}`;
  }
  return `${label} changed from ${fromText} to ${toText}`;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Desktop layouts keep left and width in grid columns (43 to the row) and
// top and height in pixels.
export function describeLayoutChange(kind: 'desktop' | 'mobile', from?: LayoutBox, to?: LayoutBox): string[] {
  const where = kind === 'mobile' ? ' on mobile' : '';
  if (!from && to) return [`Placed${where}`];
  if (from && !to) return [`No longer placed${where}`];
  if (!from || !to) return [];
  const out: string[] = [];
  const dx = Math.round((to.left - from.left) * 100) / 100;
  const dy = Math.round(to.top - from.top);
  if (dx || dy) {
    const parts: string[] = [];
    if (dx) parts.push(`${plural(Math.abs(dx), 'column')} ${dx > 0 ? 'right' : 'left'}`);
    if (dy) parts.push(`${Math.abs(dy)}px ${dy > 0 ? 'down' : 'up'}`);
    out.push(`Moved ${parts.join(' and ')}${where}`);
  }
  const dw = Math.round((to.width - from.width) * 100) / 100;
  const dh = Math.round(to.height - from.height);
  if (dw || dh) {
    const parts: string[] = [];
    if (dw) parts.push(`${dw > 0 ? 'wider' : 'narrower'} by ${plural(Math.abs(dw), 'column')}`);
    if (dh) parts.push(`${dh > 0 ? 'taller' : 'shorter'} by ${Math.abs(dh)}px`);
    out.push(`Resized${where}: ${parts.join(', ')}`);
  }
  const flexKeys: Array<keyof LayoutBox> = ['widthPx', 'fillWidth', 'grow', 'dimensionUnit'];
  if (flexKeys.some((key) => (from[key] ?? null) !== (to[key] ?? null))) out.push(`Sizing rule changed${where}`);
  return out;
}

export function describeEvent(definition: Record<string, any>): string {
  const action = definition.actionId ?? 'action';
  const on = humanize(String(definition.eventId ?? 'event').replace(/^on/, '')).toLowerCase();
  const target =
    definition.queryName ??
    definition.queryId ??
    definition.pageId ??
    definition.modal ??
    definition.componentId ??
    definition.url ??
    null;
  const what = humanize(String(action)).toLowerCase();
  const ref = typeof target === 'string' ? ` ${target.replace(/^@\w+:/, '')}` : '';
  return `On ${on}: ${what}${ref}`;
}
