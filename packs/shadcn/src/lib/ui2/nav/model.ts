// The pure logic of UI 2.0's navigation and action widgets (Ui2/_actions/actionsModel, Ui2/_display/displayModel,
// Ui2/Tabs/tabsModel), ported for the pack. Author data arrives as it comes (null, wrong types, huge lists, ToolJet's
// `{ value }` wrappers) and nothing here throws.

export type Rec = Record<string, unknown>;
export type Text = string | number | boolean;

export const isRecord = (v: unknown): v is Rec => !!v && typeof v === 'object' && !Array.isArray(v);
export const isScalar = (v: unknown): v is Text =>
  typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v)) || typeof v === 'boolean';
export const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** The inspector's option lists wrap some fields as `{ value }`: the bare value. */
export const unwrap = (v: unknown): unknown =>
  isRecord(v) && 'value' in v && Object.keys(v).every((k) => k === 'value' || k === 'fxActive') ? v.value : v;
/** A flag set as true, 'true' or '{{true}}'. */
export const flag = (v: unknown): boolean => {
  const raw = unwrap(v);
  return raw === true || raw === 'true' || raw === '{{true}}';
};
/** False only when explicitly turned off (visible defaults to on). */
export const notOff = (v: unknown): boolean => {
  const raw = unwrap(v);
  return !(raw === false || raw === 'false' || raw === '{{false}}');
};
export const text = (v: unknown): string => {
  const raw = unwrap(v);
  return isScalar(raw) ? String(raw) : '';
};
export const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = Math.floor(Number(unwrap(v)));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
/** An own key only: a value named constructor or __proto__ must not find Object.prototype's members. */
export const own = <T>(map: Record<string, T>, key: unknown): T | undefined =>
  typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;

/** A link the page may open: http(s), mailto, tel or a relative path. A script URL is none. */
export const safeUrl = (v: unknown): string => {
  const raw = text(v).trim();
  return /^(https?:|mailto:|tel:|\/|#|\?)/i.test(raw) ? raw : '';
};
export const safeImageUrl = (v: unknown): string => {
  const raw = text(v).trim();
  return /^(https?:|data:image\/|blob:|\/)/i.test(raw) ? raw : '';
};

// ---- Dropdown menu ---------------------------------------------------------------------------------------------

export const MAX_ITEMS = 200;
export const MAX_CHILDREN = 50;
const NAV_DEPTH = 3;

export interface MenuEntry {
  label: string;
  value: Text;
  icon: string;
  description: string;
  shortcut: string;
  disabled: boolean;
  visible: boolean;
  destructive: boolean;
  separator: boolean;
  group: string;
}

type Entry = MenuEntry | { separatorOnly: true } | null;

/** One entry: a string, or `{ label, value, icon, description, shortcut, disabled, visible, destructive, separator,
 *  group }`. The pack's own `{ separator: true }` and `{ heading }` rows are read too. */
export const menuEntry = (o: unknown): Entry => {
  if (isScalar(o)) {
    return { label: String(o), value: o, icon: '', description: '', shortcut: '', disabled: false, visible: true, destructive: false, separator: false, group: '' };
  }
  if (!isRecord(o)) return null;
  const label = text(o.label ?? o.title);
  const raw = unwrap(o.value);
  const value = isScalar(raw) ? raw : label;
  if (!label && (value === '' || value === undefined)) {
    return o.separator === true || o.type === 'separator' ? { separatorOnly: true } : null;
  }
  return {
    label: label || String(value),
    value,
    icon: text(o.icon).trim(),
    description: text(o.description),
    shortcut: text(o.shortcut),
    disabled: flag(o.disabled) || flag(o.disable),
    visible: notOff(o.visible) && !flag(o.hidden),
    destructive: flag(o.destructive) || o.variant === 'destructive',
    separator: flag(o.separator),
    group: text(o.group),
  };
};

export type MenuRow = ({ kind: 'item' } & MenuEntry) | { kind: 'label'; label: string } | { kind: 'separator' };

/** The rows a menu draws: items, group headings and separators. Hidden items are dropped; a separator never leads,
 *  trails or doubles. */
export const menuRows = (items: unknown): MenuRow[] => {
  const rows: MenuRow[] = [];
  let group: string | undefined;
  let pendingSeparator = false;
  for (const raw of list(items).slice(0, MAX_ITEMS)) {
    // The pack's heading rows: { heading: 'My account' }.
    if (isRecord(raw) && isScalar(raw.heading) && raw.label === undefined) {
      if (rows.length && rows[rows.length - 1].kind !== 'separator') rows.push({ kind: 'separator' });
      rows.push({ kind: 'label', label: String(raw.heading) });
      pendingSeparator = false;
      continue;
    }
    const entry = menuEntry(raw);
    if (!entry) continue;
    if ('separatorOnly' in entry) {
      pendingSeparator = true;
      continue;
    }
    if (!entry.visible) continue;
    const groupChanged = entry.group !== (group ?? '');
    const last = rows[rows.length - 1];
    if ((pendingSeparator || entry.separator || (groupChanged && group !== undefined)) && last && last.kind === 'item') {
      rows.push({ kind: 'separator' });
    }
    if (groupChanged && entry.group) rows.push({ kind: 'label', label: entry.group });
    group = entry.group;
    pendingSeparator = false;
    rows.push({ kind: 'item', ...entry });
  }
  while (rows.length && rows[rows.length - 1].kind === 'separator') rows.pop();
  return rows;
};

/** The native PopoverMenu's lastClickedOption shape. */
export const clickedOption = (item: Partial<MenuEntry> | null | undefined) => ({
  label: item?.label ?? '',
  description: item?.description ?? '',
  value: item?.value ?? '',
});

// ---- Button group ----------------------------------------------------------------------------------------------

const BUTTON_VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive'];

export interface GroupButton {
  label: string;
  value: Text;
  icon: string;
  disabled: boolean;
  variant: string;
  tooltip: string;
}

/** Buttons as `{ label, value, icon, disabled, variant, tooltip }`, unique by value (the first wins). */
export const groupButtons = (buttons: unknown): GroupButton[] => {
  const seen = new Set<string>();
  const out: GroupButton[] = [];
  for (const raw of list(buttons).slice(0, MAX_CHILDREN)) {
    const entry = menuEntry(raw);
    if (!entry || 'separatorOnly' in entry || !entry.visible) continue;
    const key = String(entry.value);
    if (seen.has(key)) continue;
    seen.add(key);
    const o = isRecord(raw) ? raw : {};
    out.push({
      // An icon-only button: an empty label with an icon.
      label: o.label === '' && entry.icon ? '' : entry.label,
      value: entry.value,
      icon: entry.icon,
      disabled: entry.disabled,
      variant: BUTTON_VARIANTS.includes(String(o.variant)) ? String(o.variant) : '',
      tooltip: text(o.tooltip),
    });
  }
  return out;
};

/** The selected keys from a default value: one value for 'single', a list for 'multiple', none for 'actions'. */
export const initialSelection = (defaultValue: unknown, mode: string, buttons: readonly GroupButton[]): string[] => {
  if (mode !== 'single' && mode !== 'multiple') return [];
  const keys = new Set(buttons.map((b) => String(b.value)));
  const raw = unwrap(defaultValue);
  const wanted = (Array.isArray(raw) ? raw : raw === '' || raw === undefined || raw === null ? [] : [raw])
    .filter(isScalar)
    .map(String)
    .filter((k) => keys.has(k));
  const unique = [...new Set(wanted)];
  return mode === 'single' ? unique.slice(0, 1) : unique;
};

export const toggleSelection = (selected: string[], key: string, mode: string, allowDeselect: boolean): string[] => {
  const has = selected.includes(key);
  if (mode === 'single') return has ? (allowDeselect ? [] : selected) : [key];
  if (mode === 'multiple') return has ? selected.filter((k) => k !== key) : [...selected, key];
  return selected;
};

/** value (single: the value or ''; multiple: the list) and selected (always a list). */
export const selectionExposed = (selected: readonly string[], mode: string, buttons: readonly GroupButton[]) => {
  const byKey = new Map(buttons.map((b) => [String(b.value), b.value]));
  const values = selected.map((k) => byKey.get(k)).filter((v): v is Text => v !== undefined);
  return { value: mode === 'multiple' ? values : values[0] ?? '', selected: values };
};

// ---- Navigation ------------------------------------------------------------------------------------------------

export interface NavItem {
  label: string;
  value: Text;
  key: string;
  icon: string;
  disabled: boolean;
  badge: string;
  group: string;
  separator: false;
  children: NavItem[];
}
export type NavRow = NavItem | { separator: true; key?: undefined };

const navEntry = (o: unknown, seen: Set<string>): Omit<NavItem, 'children' | 'separator'> | { separator: true } | null => {
  const entry = menuEntry(isRecord(o) && o.value === undefined && isScalar(o.id) ? { ...o, value: o.id } : o);
  if (!entry) return null;
  if ('separatorOnly' in entry) return { separator: true };
  if (!entry.visible) return null;
  const key = String(entry.value);
  if (seen.has(key)) return null;
  seen.add(key);
  const badge = unwrap(isRecord(o) ? o.badge : undefined);
  return {
    label: entry.label,
    value: entry.value,
    key,
    icon: entry.icon,
    disabled: entry.disabled,
    badge: isScalar(badge) && String(badge) !== '' ? String(badge) : '',
    group: entry.group,
    ...(entry.separator ? { leadingSeparator: true } : {}),
  };
};

/** Navigation items with one level of children (deeper levels flattened into it) and separator rows. Values are
 *  unique across the tree. */
export const navItems = (items: unknown): NavRow[] => {
  const seen = new Set<string>();
  const out: NavRow[] = [];
  const pushSeparator = () => {
    if (out.length && !out[out.length - 1].separator) out.push({ separator: true });
  };
  for (const raw of list(items).slice(0, MAX_ITEMS)) {
    const entry = navEntry(raw, seen);
    if (!entry) continue;
    if ('separator' in entry) {
      pushSeparator();
      continue;
    }
    const children: NavItem[] = [];
    const walk = (nested: unknown, depth: number) => {
      for (const child of list(nested).slice(0, MAX_CHILDREN)) {
        if (children.length >= MAX_CHILDREN) return;
        const c = navEntry(child, seen);
        if (!c || 'separator' in c) continue;
        children.push({ ...c, separator: false, children: [] });
        if (depth < NAV_DEPTH && isRecord(child)) walk(child.children, depth + 1);
      }
    };
    if (isRecord(raw)) walk(raw.children, 1);
    if ((entry as { leadingSeparator?: boolean }).leadingSeparator) pushSeparator();
    out.push({ ...entry, separator: false, children });
  }
  while (out.length && out[out.length - 1].separator) out.pop();
  return out;
};

export interface NavFound {
  item: NavItem;
  parent: NavItem | null;
}

export const findNav = (items: readonly NavRow[], value: unknown): NavFound | null => {
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

/** The exposed selectedItem: `{ label, value, parentLabel, parentValue }`, or null. */
export const activeItemExposed = (found: NavFound | null) =>
  found
    ? {
        label: found.item.label,
        value: found.item.value,
        parentLabel: found.parent?.label ?? null,
        parentValue: found.parent?.value ?? null,
      }
    : null;

/** Items with setItemVisibility / setItemDisable changes applied (by item value). */
export const patchNavItems = (items: unknown, changes: Record<string, { visible?: boolean; disabled?: boolean }>): unknown => {
  if (!Object.keys(changes).length || !Array.isArray(items)) return items;
  const patch = (raw: unknown, depth: number): unknown => {
    const obj: Rec | null = isScalar(raw) ? { label: String(raw), value: raw } : isRecord(raw) ? raw : null;
    if (!obj) return raw;
    const change = own(changes, String(obj.value ?? obj.id ?? ''));
    const children =
      depth < NAV_DEPTH && Array.isArray(obj.children) ? obj.children.slice(0, MAX_CHILDREN).map((c) => patch(c, depth + 1)) : obj.children;
    return change || children !== obj.children ? { ...obj, ...(change || {}), children } : raw;
  };
  return items.slice(0, MAX_ITEMS).map((raw) => patch(raw, 0));
};

// ---- Carousel --------------------------------------------------------------------------------------------------

export interface Slide {
  image: string;
  title: string;
  description: string;
  link: string;
}

/** Slides from objects (image, src or url) or plain image URLs. Slides with neither an image nor a title are dropped. */
export const carouselSlides = (slides: unknown): Slide[] => {
  const out: Slide[] = [];
  for (const raw of list(slides).slice(0, 100)) {
    const slide = isRecord(raw)
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

export const carouselPositions = (count: number, perView = 1): number => Math.max(1, count - Math.max(1, perView) + 1);

export const moveIndex = (index: unknown, positions: number, loop: boolean): number => {
  if (positions <= 1) return 0;
  const i = Math.floor(Number(index));
  if (!Number.isFinite(i)) return 0;
  if (loop) return ((i % positions) + positions) % positions;
  return Math.max(0, Math.min(positions - 1, i));
};

const RATIOS: Record<string, number> = { '16/9': 16 / 9, '4/3': 4 / 3, '3/2': 3 / 2, '1/1': 1, '21/9': 21 / 9, '3/4': 3 / 4, '9/16': 9 / 16 };

/** The CSS aspect ratio for a setting, or null for 'fill' (the slides fill the widget's height). */
export const aspectRatio = (v: unknown): number | null => {
  const raw = text(v).trim().replace(':', '/');
  if (raw === 'fill' || raw === '') return null;
  const named = own(RATIOS, raw);
  if (named) return named;
  const [w, h] = raw.split('/').map(Number);
  if (Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0) return Math.min(10, Math.max(0.1, w / h));
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(10, Math.max(0.1, n)) : 16 / 9;
};

// ---- Timeline --------------------------------------------------------------------------------------------------

// Status words and the theme colour each maps to (the author's statusColors map wins).
const STATUS_TOKENS: Record<string, string> = {
  success: 'var(--ui-success)',
  completed: 'var(--ui-success)',
  complete: 'var(--ui-success)',
  done: 'var(--ui-success)',
  paid: 'var(--ui-success)',
  approved: 'var(--ui-success)',
  delivered: 'var(--ui-success)',
  warning: 'var(--ui-warning)',
  pending: 'var(--ui-warning)',
  waiting: 'var(--ui-warning)',
  'in progress': 'var(--ui-info)',
  active: 'var(--ui-primary)',
  current: 'var(--ui-primary)',
  info: 'var(--ui-info)',
  primary: 'var(--ui-primary)',
  error: 'var(--ui-destructive)',
  failed: 'var(--ui-destructive)',
  danger: 'var(--ui-destructive)',
  destructive: 'var(--ui-destructive)',
  cancelled: 'var(--ui-destructive)',
  canceled: 'var(--ui-destructive)',
  rejected: 'var(--ui-destructive)',
};

export const statusColor = (status: unknown, colors: unknown): string | undefined => {
  if (!isScalar(status) || String(status) === '') return undefined;
  const word = String(status).trim();
  if (isRecord(colors)) {
    const mine = colors[word] ?? colors[word.toLowerCase()];
    if (isScalar(mine) && String(mine) !== '') return String(mine);
  }
  return own(STATUS_TOKENS, word.toLowerCase());
};

export interface TimelineItem extends Rec {
  key: string;
  index: number;
  title: string;
  description: string;
  time: string;
  status: string;
  color: string;
  icon: string;
}

/** Timeline items in the given order or newest first; `limit` entries from the end it is read from. */
export const timelineItems = (items: unknown, newestFirst = false, limit = Infinity): TimelineItem[] => {
  const all = list(items);
  const start = newestFirst ? Math.max(0, all.length - limit) : 0;
  const out = all.slice(start, start + limit).flatMap((entry, offset): TimelineItem[] => {
    const index = start + offset;
    const pick = (v: unknown): string => (isScalar(v) ? String(v) : '');
    if (isScalar(entry)) return [{ key: String(index), index, title: String(entry), description: '', time: '', status: '', color: '', icon: '' }];
    if (!isRecord(entry)) return [];
    return [
      {
        ...entry,
        key: isScalar(entry.id) ? String(entry.id) : String(index),
        index,
        title: pick(entry.title ?? entry.label ?? entry.name),
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

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** dayjs's format tokens (YYYY YY MMMM MMM MM M DD D dddd ddd HH H hh h mm ss A a), text in [brackets] kept. */
export const formatDateTokens = (d: Date, format: string): string =>
  format.replace(/\[([^\]]*)]|YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|hh|h|mm|ss|A|a/g, (token, literal) => {
    if (literal !== undefined) return literal;
    const h = d.getHours();
    switch (token) {
      case 'YYYY': return String(d.getFullYear());
      case 'YY': return pad(d.getFullYear() % 100);
      case 'MMMM': return MONTHS[d.getMonth()];
      case 'MMM': return MONTHS[d.getMonth()].slice(0, 3);
      case 'MM': return pad(d.getMonth() + 1);
      case 'M': return String(d.getMonth() + 1);
      case 'DD': return pad(d.getDate());
      case 'D': return String(d.getDate());
      case 'dddd': return DAYS[d.getDay()];
      case 'ddd': return DAYS[d.getDay()].slice(0, 3);
      case 'HH': return pad(h);
      case 'H': return String(h);
      case 'hh': return pad(h % 12 || 12);
      case 'h': return String(h % 12 || 12);
      case 'mm': return pad(d.getMinutes());
      case 'ss': return pad(d.getSeconds());
      case 'A': return h < 12 ? 'AM' : 'PM';
      default: return h < 12 ? 'am' : 'pm';
    }
  });

/** An ISO date or a timestamp in `dateFormat`; anything else, or no format, as given. */
export const formatDate = (time: unknown, dateFormat: unknown): string => {
  if (!isScalar(time) || String(time) === '') return '';
  const format = text(dateFormat).trim();
  if (!format) return String(time);
  if (!(typeof time === 'number' || /^\d{4}-\d{2}-\d{2}/.test(String(time)))) return String(time);
  // A bare date is that day where the viewer is, not midnight UTC.
  const raw = String(time);
  const d = typeof time === 'number' ? new Date(time) : /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : formatDateTokens(d, format);
};

// ---- Steps -----------------------------------------------------------------------------------------------------

export type StepId = string | number | boolean;
export interface Step extends Rec {
  id: StepId;
  name: string;
  description: string;
  tooltip: string;
  visible: boolean;
  disabled: boolean;
}

/** Steps from objects ({ id, name | title | label, description, tooltip, visible, disabled, hidden }), plain names,
 *  JSON text or comma-separated text. A step without an id gets its position (from 1); repeated ids are suffixed. */
export const normalizeSteps = (steps: unknown): Step[] => {
  let source: unknown = steps;
  if (typeof steps === 'string') {
    try {
      source = JSON.parse(steps);
    } catch {
      source = steps.trim() ? steps.split(',') : [];
    }
  }
  const taken = new Set<string>();
  return list(source)
    .slice(0, 100)
    .flatMap((entry, index): Step[] => {
      const step: Rec = isScalar(entry) ? { name: String(entry).trim() } : isRecord(entry) ? { ...entry } : (null as unknown as Rec);
      if (!step) return [];
      const rawId = unwrap(step.id);
      let id: StepId = isScalar(rawId) && String(rawId) !== '' ? rawId : index + 1;
      while (taken.has(String(id))) id = `${id}-${index + 1}`;
      taken.add(String(id));
      const name = unwrap(step.name ?? step.title ?? step.label);
      return [
        {
          ...step,
          id,
          name: isScalar(name) ? String(name) : '',
          description: text(step.description),
          tooltip: text(step.tooltip),
          visible: notOff(step.visible) && !flag(step.hidden),
          disabled: flag(step.disabled),
        },
      ];
    });
};

export const stepIndexOf = (steps: readonly { id: StepId }[], id: unknown): number =>
  isScalar(id) ? steps.findIndex((s) => String(s.id) === String(id)) : -1;

// ---- Pagination ------------------------------------------------------------------------------------------------

export type PageItem = number | 'start-ellipsis' | 'end-ellipsis';

/** Page numbers with gaps: `siblings` pages either side of the current one, the first and last always shown, and a
 *  constant length once pages overflow. */
export const pageItems = (page: number, count: number, siblings: number): PageItem[] => {
  const total = Math.max(1, Math.floor(count || 1));
  const current = Math.min(total, Math.max(1, page));
  const sib = Math.min(5, Math.max(0, Math.floor(siblings)));
  const slots = sib * 2 + 5;
  if (total <= slots) return Array.from({ length: total }, (_, i) => i + 1);
  const range = (a: number, b: number): number[] => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const left = Math.max(current - sib, 2);
  const right = Math.min(current + sib, total - 1);
  const showLeftGap = left > 3;
  const showRightGap = right < total - 2;
  if (!showLeftGap && showRightGap) return [...range(1, 3 + 2 * sib), 'end-ellipsis', total];
  if (showLeftGap && !showRightGap) return [1, 'start-ellipsis', ...range(total - (2 + 2 * sib), total)];
  return [1, 'start-ellipsis', ...range(left, right), 'end-ellipsis', total];
};

// ---- Tabs ------------------------------------------------------------------------------------------------------

export interface Tab {
  id: string;
  title: string;
  icon: string;
  badge: string;
  disable: boolean;
  visible: boolean;
  loading: boolean;
}

/** Tabs as `{ id, label | title, icon, iconVisibility, badge | count, disable | disabled, visible | hidden, loading }`;
 *  a tab without an id gets its position. */
export const toTabs = (raw: unknown, fallbackLabel = 'Tab'): Tab[] =>
  list(raw).flatMap((t, i): Tab[] => {
    if (isScalar(t)) return [{ id: String(t), title: String(t), icon: '', badge: '', disable: false, visible: true, loading: false }];
    if (!isRecord(t)) return [];
    const id = text(t.id ?? t.value);
    const badge = unwrap(t.badge ?? t.count);
    return [
      {
        id: id || String(i + 1),
        title: text(t.label ?? t.title) || `${fallbackLabel} ${i + 1}`,
        // UI 2.0 shows a tab's icon only with iconVisibility on; here an icon shows unless that is turned off.
        icon: t.iconVisibility !== undefined && !flag(t.iconVisibility) ? '' : text(t.icon).trim(),
        badge: isScalar(badge) && String(badge) !== '' ? String(badge) : '',
        disable: flag(t.disable) || flag(t.disabled),
        visible: notOff(t.visible) && !flag(t.hidden),
        loading: flag(t.loading),
      },
    ];
  });

/** The next (step 1) or previous (step -1) visible, enabled tab from `currentId`; null at either end. */
export const neighbourTab = (tabs: Tab[], currentId: string, step: number): Tab | null => {
  const shown = tabs.filter((t) => t.visible);
  let index = shown.findIndex((t) => t.id === currentId);
  if (index < 0) return null;
  for (index += step; index >= 0 && index < shown.length; index += step) if (!shown[index].disable) return shown[index];
  return null;
};
