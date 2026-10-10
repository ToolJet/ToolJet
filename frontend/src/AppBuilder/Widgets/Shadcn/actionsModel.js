// shadcn/ui pack (experiment): the pure logic of the actions widgets (dropdown menu, button group, navigation,
// calendar, carousel). Everything here takes author data as it comes (null, wrong types, huge lists, ToolJet's
// `{ value }` wrappers from the inspector's option lists) and never throws.
import dayjs from 'dayjs';

const MAX_ITEMS = 200;
const MAX_CHILDREN = 50;
const MAX_SLIDES = 100;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
const arr = (v) => (Array.isArray(v) ? v : []);

/** The inspector's option lists wrap some fields as `{ value }`: the bare value. */
export const unwrap = (v) =>
  isObject(v) && 'value' in v && Object.keys(v).every((k) => k === 'value' || k === 'fxActive') ? v.value : v;
/** A flag set as true, 'true' or '{{true}}'. */
export const flag = (v) => {
  const raw = unwrap(v);
  return raw === true || raw === 'true' || raw === '{{true}}';
};
/** False only when explicitly turned off (visible defaults to on). */
const notOff = (v) => {
  const raw = unwrap(v);
  return !(raw === false || raw === 'false' || raw === '{{false}}');
};
const text = (v) => {
  const raw = unwrap(v);
  return isText(raw) ? String(raw) : '';
};
/** A Tabler icon name ('IconBolt'); anything else means no icon. */
export const iconName = (v) => {
  const raw = text(v).trim();
  return /^Icon[A-Za-z0-9]+$/.test(raw) ? raw : '';
};

/** A whole number within [min, max], or the fallback when the input is not a number. */
export const clampInt = (v, min, max, fallback) => {
  const n = Math.floor(Number(unwrap(v)));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

// ---- Dropdown menu ---------------------------------------------------------------------------------------------

/** One menu entry from author data: a string, or `{ label, value, icon, description, shortcut, disabled, visible,
 *  destructive, separator, group }`. Null when it cannot be an item (and is not a bare separator). */
const menuEntry = (o) => {
  if (isText(o)) {
    return {
      label: String(o),
      value: o,
      icon: '',
      description: '',
      shortcut: '',
      disabled: false,
      visible: true,
      destructive: false,
      separator: false,
      group: '',
    };
  }
  if (!isObject(o)) return null;
  const label = text(o.label ?? o.title);
  let value = unwrap(o.value);
  if (!isText(value)) value = label;
  if (!label && (value === '' || value === undefined)) {
    return o.separator === true || o.type === 'separator' ? { separatorOnly: true } : null;
  }
  return {
    label: label || String(value),
    value,
    icon: iconName(o.icon),
    description: text(o.description),
    shortcut: text(o.shortcut),
    disabled: flag(o.disabled) || flag(o.disable),
    visible: notOff(o.visible),
    destructive: flag(o.destructive) || o.variant === 'destructive',
    separator: flag(o.separator),
    group: text(o.group),
  };
};

/** The rows a dropdown menu draws, in order: `{ kind: 'item', ...item }`, `{ kind: 'label', label }` (a group's
 *  heading) and `{ kind: 'separator' }`. Hidden items are dropped; a separator never leads, trails or doubles. */
export const menuRows = (items) => {
  const rows = [];
  let group;
  let pendingSeparator = false;
  for (const raw of arr(items).slice(0, MAX_ITEMS)) {
    const entry = menuEntry(raw);
    if (!entry) continue;
    if (entry.separatorOnly) {
      pendingSeparator = true;
      continue;
    }
    if (!entry.visible) continue;
    const groupChanged = entry.group !== (group ?? '');
    if ((pendingSeparator || entry.separator || (groupChanged && group !== undefined)) && rows.length) {
      rows.push({ kind: 'separator' });
    }
    if (groupChanged && entry.group) rows.push({ kind: 'label', label: entry.group });
    group = entry.group;
    pendingSeparator = false;
    rows.push({ kind: 'item', ...entry });
  }
  return rows;
};

/** The native PopoverMenu's lastClickedOption shape. */
export const clickedOption = (item) => ({
  label: item?.label ?? '',
  description: item?.description ?? '',
  value: item?.value ?? '',
});

// ---- Button group ----------------------------------------------------------------------------------------------

const BUTTON_VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive'];

/** Buttons as `{ label, value, icon, disabled, variant }`, keyed uniquely by value (the first wins). Plain values
 *  are accepted (['Day', 'Week']). */
export const groupButtons = (buttons) => {
  const seen = new Set();
  const out = [];
  for (const raw of arr(buttons).slice(0, MAX_CHILDREN)) {
    const entry = menuEntry(raw);
    if (!entry || entry.separatorOnly || !entry.visible) continue;
    const key = String(entry.value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      // An icon-only button: an empty label with an icon.
      label: isObject(raw) && raw.label === '' && entry.icon ? '' : entry.label,
      value: entry.value,
      icon: entry.icon,
      disabled: entry.disabled,
      variant: BUTTON_VARIANTS.includes(raw?.variant) ? raw.variant : '',
      tooltip: isObject(raw) ? text(raw.tooltip) : '',
    });
  }
  return out;
};

/** The selected keys (strings) from a default value: one value for 'single', a list for 'multiple', none for
 *  'actions'. Values that name no button are dropped. */
export const initialSelection = (defaultValue, mode, buttons) => {
  if (mode !== 'single' && mode !== 'multiple') return [];
  const keys = new Set(buttons.map((b) => String(b.value)));
  const raw = unwrap(defaultValue);
  const wanted = (Array.isArray(raw) ? raw : raw === '' || raw === undefined || raw === null ? [] : [raw])
    .filter(isText)
    .map(String)
    .filter((k) => keys.has(k));
  const unique = [...new Set(wanted)];
  return mode === 'single' ? unique.slice(0, 1) : unique;
};

/** The selection after clicking `key`: single picks it (or clears it when deselecting is allowed), multiple
 *  toggles it. */
export const toggleSelection = (selected, key, mode, allowDeselect = false) => {
  const has = selected.includes(key);
  if (mode === 'single') return has ? (allowDeselect ? [] : selected) : [key];
  if (mode === 'multiple') return has ? selected.filter((k) => k !== key) : [...selected, key];
  return selected;
};

/** The exposed values for a selection: value (single: the value or ''; multiple: the list), values and the native
 *  ButtonGroup's selected (always a list). */
export const selectionExposed = (selected, mode, buttons) => {
  const byKey = new Map(buttons.map((b) => [String(b.value), b.value]));
  const values = selected.filter((k) => byKey.has(k)).map((k) => byKey.get(k));
  return { value: mode === 'multiple' ? values : values[0] ?? '', values, selected: values };
};

// ---- Navigation ------------------------------------------------------------------------------------------------

const navEntry = (o, seen) => {
  const entry = menuEntry(isObject(o) && o.value === undefined && isText(o.id) ? { ...o, value: o.id } : o);
  if (!entry || entry.separatorOnly) return entry?.separatorOnly ? { separator: true } : null;
  if (!entry.visible) return null;
  const key = String(entry.value);
  if (seen.has(key)) return null;
  seen.add(key);
  const badge = unwrap(o?.badge);
  return {
    label: entry.label,
    value: entry.value,
    key,
    icon: entry.icon,
    disabled: entry.disabled,
    badge: isText(badge) && String(badge) !== '' ? String(badge) : '',
    group: entry.group,
    separator: entry.separator,
  };
};

/** Navigation items as `{ label, value, key, icon, badge, disabled, group, children }` (one level of children;
 *  deeper levels are flattened into it), plus `{ separator: true }` rows. Values are unique across the tree. */
export const navItems = (items) => {
  const seen = new Set();
  const out = [];
  for (const raw of arr(items).slice(0, MAX_ITEMS)) {
    const entry = navEntry(raw, seen);
    if (!entry) continue;
    if (entry.separator && !entry.key) {
      if (out.length && !out[out.length - 1].separator) out.push({ separator: true });
      continue;
    }
    const children = [];
    const walk = (list, depth) => {
      for (const child of arr(list).slice(0, MAX_CHILDREN)) {
        if (children.length >= MAX_CHILDREN) return;
        const c = navEntry(child, seen);
        if (!c || !c.key) continue;
        children.push({ ...c, separator: false, children: [] });
        if (depth < 3 && isObject(child)) walk(child.children, depth + 1);
      }
    };
    if (isObject(raw)) walk(raw.children, 1);
    if (entry.separator && out.length && !out[out.length - 1].separator) out.push({ separator: true });
    out.push({ ...entry, separator: false, children });
  }
  while (out.length && out[out.length - 1].separator) out.pop();
  return out;
};

/** The item with this value (a top-level item or a child) and its parent, or null. */
export const findNav = (items, value) => {
  if (value === undefined || value === null || value === '') return null;
  const key = String(value);
  for (const item of items) {
    if (item.separator) continue;
    if (item.key === key) return { item, parent: null };
    const child = item.children.find((c) => c.key === key);
    if (child) return { item: child, parent: item };
  }
  return null;
};

/** The exposed activeItem: `{ label, value, parentLabel, parentValue }`, or null when nothing is active. */
export const activeItemExposed = (found) =>
  found
    ? {
        label: found.item.label,
        value: found.item.value,
        parentLabel: found.parent?.label ?? null,
        parentValue: found.parent?.value ?? null,
      }
    : null;

// ---- Calendar --------------------------------------------------------------------------------------------------

/** A date from author data ('2026-10-09', an ISO string, a timestamp, a Date), or undefined. */
export const toDate = (v) => {
  const raw = unwrap(v);
  if (raw === undefined || raw === null || raw === '' || typeof raw === 'boolean') return undefined;
  if (!(raw instanceof Date) && !isText(raw)) return undefined;
  const d = dayjs(raw);
  return d.isValid() ? d.startOf('day').toDate() : undefined;
};
export const ymd = (d) => (d && dayjs(d).isValid() ? dayjs(d).format('YYYY-MM-DD') : '');

/** The selection from a default value: a Date (single), a list of Dates (multiple) or `{ from, to }` (range). */
export const calendarSelection = (raw, mode) => {
  const value = unwrap(raw);
  if (mode === 'multiple') {
    const dates = (Array.isArray(value) ? value : [value]).slice(0, 1000).map(toDate).filter(Boolean);
    const seen = new Set();
    return dates.filter((d) => !seen.has(ymd(d)) && seen.add(ymd(d)));
  }
  if (mode === 'range') {
    const pair = Array.isArray(value)
      ? value
      : isObject(value)
      ? [value.from ?? value.start ?? value.startDate, value.to ?? value.end ?? value.endDate]
      : [value];
    const from = toDate(pair[0]);
    const to = toDate(pair[1]);
    if (!from) return undefined;
    return to && to < from ? { from: to, to: from } : { from, to };
  }
  return toDate(Array.isArray(value) ? value[0] : value);
};

/** The exposed values of a selection. value: 'YYYY-MM-DD' (single), a list (multiple) or [start, end] (range). */
export const calendarExposed = (selected, mode) => {
  if (mode === 'multiple') {
    const dates = arr(selected).map(ymd).filter(Boolean).sort();
    return { value: dates, selectedDate: dates[0] ?? '', selectedDates: dates, startDate: '', endDate: '' };
  }
  if (mode === 'range') {
    const start = ymd(selected?.from);
    const end = ymd(selected?.to);
    return {
      value: [start, end],
      selectedDate: start,
      selectedDates: [start, end].filter(Boolean),
      startDate: start,
      endDate: end,
    };
  }
  const date = ymd(selected);
  return { value: date, selectedDate: date, selectedDates: date ? [date] : [], startDate: '', endDate: '' };
};

/** The exposed visible period: visibleMonth 'YYYY-MM' and the first and last day shown across the months. */
export const visiblePeriod = (month, numberOfMonths = 1) => {
  const start = dayjs(month).isValid() ? dayjs(month).startOf('month') : dayjs().startOf('month');
  return {
    visibleMonth: start.format('YYYY-MM'),
    visibleStart: start.format('YYYY-MM-DD'),
    visibleEnd: start
      .add(Math.max(1, numberOfMonths) - 1, 'month')
      .endOf('month')
      .format('YYYY-MM-DD'),
  };
};

/** Markers by day ('YYYY-MM-DD' -> [{ label, color }]): `[{ date, label?, color? }]`, or plain dates. */
export const markersByDay = (markers) => {
  const map = new Map();
  for (const raw of arr(markers).slice(0, 2000)) {
    const date = toDate(isObject(raw) ? raw.date ?? raw.day ?? raw.start : raw);
    if (!date) continue;
    const key = ymd(date);
    const marker = {
      label: isObject(raw) ? text(raw.label ?? raw.title) : '',
      color: isObject(raw) ? text(raw.color) : '',
    };
    map.set(key, [...(map.get(key) || []), marker]);
  }
  return map;
};

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** react-day-picker's disabled matchers from min and max dates, a list of disabled dates and disabled weekdays
 *  (0 to 6 or names). */
export const disabledMatchers = ({ minDate, maxDate, disabledDates, disabledDays } = {}) => {
  const matchers = [];
  const min = toDate(minDate);
  const max = toDate(maxDate);
  if (min) matchers.push({ before: min });
  if (max) matchers.push({ after: max });
  const dates = arr(disabledDates).slice(0, 2000).map(toDate).filter(Boolean);
  if (dates.length) matchers.push(...dates);
  const days = arr(disabledDays)
    .map((d) => (typeof d === 'string' && WEEKDAYS.includes(d.toLowerCase()) ? WEEKDAYS.indexOf(d.toLowerCase()) : d))
    .map(Number)
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  if (days.length) matchers.push({ dayOfWeek: [...new Set(days)] });
  return matchers;
};

// ---- Carousel --------------------------------------------------------------------------------------------------

/** Slides as `{ image, title, description, link }`: from objects (image, src or url) or plain image URLs. Slides
 *  with neither an image nor a title are dropped. */
export const carouselSlides = (slides) => {
  const out = [];
  for (const raw of arr(slides).slice(0, MAX_SLIDES)) {
    const slide = isObject(raw)
      ? {
          image: text(raw.image ?? raw.src ?? raw.url ?? raw.imageUrl),
          title: text(raw.title ?? raw.label),
          description: text(raw.description ?? raw.subtitle),
          link: text(raw.link ?? raw.href),
        }
      : typeof raw === 'string'
      ? { image: raw, title: '', description: '', link: '' }
      : null;
    if (slide && (slide.image || slide.title)) out.push(slide);
  }
  return out;
};

/** The number of positions a carousel can rest at, showing `perView` slides at a time. */
export const carouselPositions = (count, perView = 1) => Math.max(1, count - Math.max(1, perView) + 1);

/** The index after a move: wrapped round when looping, else clamped. */
export const moveIndex = (index, positions, loop) => {
  if (positions <= 1) return 0;
  const i = Math.floor(Number(index));
  if (!Number.isFinite(i)) return 0;
  if (loop) return ((i % positions) + positions) % positions;
  return Math.max(0, Math.min(positions - 1, i));
};

const RATIOS = { '16/9': 16 / 9, '4/3': 4 / 3, '3/2': 3 / 2, '1/1': 1, '21/9': 21 / 9, '3/4': 3 / 4, '9/16': 9 / 16 };

/** The CSS aspect ratio for a setting, or null for 'fill' (the slides fill the widget's height). Accepts '16/9',
 *  '16:9' or a number. */
export const aspectRatio = (v) => {
  const raw = text(v).trim().replace(':', '/');
  if (raw === 'fill' || raw === '') return null;
  if (RATIOS[raw]) return RATIOS[raw];
  const [w, h] = raw.split('/').map(Number);
  if (Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0) return Math.min(10, Math.max(0.1, w / h));
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(10, Math.max(0.1, n)) : 16 / 9;
};
