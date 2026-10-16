// shadcn/ui pack (experiment): the pure logic of the actions widgets (dropdown menu, button group, navigation,
// carousel; the calendar's is in calendarModel). Everything here takes author data as it comes (null, wrong
// types, huge lists, ToolJet's `{ value }` wrappers from the inspector's option lists) and never throws.

import type { Bound, Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';

const MAX_ITEMS = 200;
const MAX_CHILDREN = 50;
const MAX_SLIDES = 100;

/** A value an author can type: text, a number or a flag. */
export type Text = string | number | boolean;

export const isObject = (v: unknown): v is Resolved => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v: unknown): v is Text => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
export const arr = (v: unknown): Bound[] => (Array.isArray(v) ? v : []);

/** The inspector's option lists wrap some fields as `{ value }`: the bare value. */
export const unwrap = (v: unknown): unknown =>
  isObject(v) && 'value' in v && Object.keys(v).every((k) => k === 'value' || k === 'fxActive') ? v.value : v;
/** A flag set as true, 'true' or '{{true}}'. */
export const flag = (v: unknown): boolean => {
  const raw = unwrap(v);
  return raw === true || raw === 'true' || raw === '{{true}}';
};
/** False only when explicitly turned off (visible defaults to on). */
const notOff = (v: unknown): boolean => {
  const raw = unwrap(v);
  return !(raw === false || raw === 'false' || raw === '{{false}}');
};
export const text = (v: unknown): string => {
  const raw = unwrap(v);
  return isText(raw) ? String(raw) : '';
};
/** A Tabler icon name ('IconBolt'); anything else means no icon. */
export const iconName = (v: unknown): string => {
  const raw = text(v).trim();
  return /^Icon[A-Za-z0-9]+$/.test(raw) ? raw : '';
};

/** A whole number within [min, max], or the fallback when the input is not a number. */
export const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = Math.floor(Number(unwrap(v)));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

// ---- Dropdown menu ---------------------------------------------------------------------------------------------

/** One menu entry from author data: a string, or `{ label, value, icon, description, shortcut, disabled, visible,
 *  destructive, separator, group }`. Null when it cannot be an item (and is not a bare separator). */
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
  separatorOnly?: undefined;
}

/** A bare separator in the author's list (no label or value). */
interface SeparatorOnly {
  separatorOnly: true;
}

const menuEntry = (o: unknown): MenuEntry | SeparatorOnly | null => {
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
  const raw = unwrap(o.value);
  const value = isText(raw) ? raw : label;
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
/** A row of a dropdown menu. */
export type MenuRow = ({ kind: 'item' } & MenuEntry) | { kind: 'label'; label: string } | { kind: 'separator' };

export const menuRows = (items: unknown): MenuRow[] => {
  const rows: MenuRow[] = [];
  let group: string | undefined;
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
export const clickedOption = (
  item: Partial<Pick<MenuEntry, 'label' | 'description' | 'value'>> | null | undefined
): { label: string; description: string; value: Text } => ({
  label: item?.label ?? '',
  description: item?.description ?? '',
  value: item?.value ?? '',
});

// ---- Button group ----------------------------------------------------------------------------------------------

const BUTTON_VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive'];

/** Buttons as `{ label, value, icon, disabled, variant }`, keyed uniquely by value (the first wins). Plain values
 *  are accepted (['Day', 'Week']). */
/** A button of a button group. */
export interface GroupButton {
  label: string;
  value: Text;
  icon: string;
  disabled: boolean;
  variant: string;
  tooltip: string;
}

/** How a button group selects: one button, several, or none (the buttons only act). */
export type SelectionMode = 'single' | 'multiple' | 'actions';

export const groupButtons = (buttons: unknown): GroupButton[] => {
  const seen = new Set<string>();
  const out: GroupButton[] = [];
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
export const initialSelection = (defaultValue: unknown, mode: unknown, buttons: readonly GroupButton[]): string[] => {
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
export const toggleSelection = (
  selected: string[],
  key: string,
  mode: unknown,
  allowDeselect: unknown = false
): string[] => {
  const has = selected.includes(key);
  if (mode === 'single') return has ? (allowDeselect ? [] : selected) : [key];
  if (mode === 'multiple') return has ? selected.filter((k) => k !== key) : [...selected, key];
  return selected;
};

/** The exposed values for a selection: value (single: the value or ''; multiple: the list) and the native
 *  ButtonGroup's selected (always a list). */
export const selectionExposed = (
  selected: readonly string[],
  mode: unknown,
  buttons: readonly GroupButton[]
): { value: Text | Text[]; selected: Text[] } => {
  const byKey = new Map(buttons.map((b) => [String(b.value), b.value]));
  const values = selected.map((k) => byKey.get(k)).filter((v): v is Text => v !== undefined);
  return { value: mode === 'multiple' ? values : values[0] ?? '', selected: values };
};

// ---- Navigation ------------------------------------------------------------------------------------------------

/** An item of a navigation (top-level or a child), or a separator row. */
export interface NavItem {
  label: string;
  value: Text;
  key: string;
  icon: string;
  disabled: boolean;
  badge: string;
  group: string;
  separator: boolean;
  children: NavItem[];
}

/** A separator between navigation items. */
export interface NavSeparator {
  separator: true;
  key?: undefined;
}

export type NavRow = NavItem | NavSeparator;

const navEntry = (o: unknown, seen: Set<string>): Omit<NavItem, 'children'> | NavSeparator | null => {
  const entry = menuEntry(isObject(o) && o.value === undefined && isText(o.id) ? { ...o, value: o.id } : o);
  if (!entry || entry.separatorOnly) return entry?.separatorOnly ? { separator: true } : null;
  if (!entry.visible) return null;
  const key = String(entry.value);
  if (seen.has(key)) return null;
  seen.add(key);
  const badge = unwrap(isObject(o) ? o.badge : undefined);
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
export const navItems = (items: unknown): NavRow[] => {
  const seen = new Set<string>();
  const out: NavRow[] = [];
  for (const raw of arr(items).slice(0, MAX_ITEMS)) {
    const entry = navEntry(raw, seen);
    if (!entry) continue;
    if (entry.separator && !entry.key) {
      if (out.length && !out[out.length - 1].separator) out.push({ separator: true });
      continue;
    }
    const children: NavItem[] = [];
    const walk = (list: unknown, depth: number) => {
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
/** A navigation item and its parent (null for a top-level item). */
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

/** The exposed activeItem: `{ label, value, parentLabel, parentValue }`, or null when nothing is active. */
export const activeItemExposed = (
  found: NavFound | null
): { label: string; value: Text; parentLabel: string | null; parentValue: Text | null } | null =>
  found
    ? {
        label: found.item.label,
        value: found.item.value,
        parentLabel: found.parent?.label ?? null,
        parentValue: found.parent?.value ?? null,
      }
    : null;

// ---- Carousel --------------------------------------------------------------------------------------------------

/** Slides as `{ image, title, description, link }`: from objects (image, src or url) or plain image URLs. Slides
 *  with neither an image nor a title are dropped. */
/** A carousel slide. */
export interface Slide {
  image: string;
  title: string;
  description: string;
  link: string;
}

export const carouselSlides = (slides: unknown): Slide[] => {
  const out: Slide[] = [];
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
export const carouselPositions = (count: number, perView = 1): number => Math.max(1, count - Math.max(1, perView) + 1);

/** The index after a move: wrapped round when looping, else clamped. */
export const moveIndex = (index: unknown, positions: number, loop: unknown): number => {
  if (positions <= 1) return 0;
  const i = Math.floor(Number(index));
  if (!Number.isFinite(i)) return 0;
  if (loop) return ((i % positions) + positions) % positions;
  return Math.max(0, Math.min(positions - 1, i));
};

const RATIOS: Record<string, number> = {
  '16/9': 16 / 9,
  '4/3': 4 / 3,
  '3/2': 3 / 2,
  '1/1': 1,
  '21/9': 21 / 9,
  '3/4': 3 / 4,
  '9/16': 9 / 16,
};

/** The CSS aspect ratio for a setting, or null for 'fill' (the slides fill the widget's height). Accepts '16/9',
 *  '16:9' or a number. */
export const aspectRatio = (v: unknown): number | null => {
  const raw = text(v).trim().replace(':', '/');
  if (raw === 'fill' || raw === '') return null;
  if (RATIOS[raw]) return RATIOS[raw];
  const [w, h] = raw.split('/').map(Number);
  if (Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0) return Math.min(10, Math.max(0.1, w / h));
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(10, Math.max(0.1, n)) : 16 / 9;
};
