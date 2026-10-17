// What the pack-wide suites share about the widgets themselves, with no store: every UI 2.0 widget's config, resolved
// defaults and box, and how to open a widget's overlay. Used by the fuzz and leak suites and by packPage.js.
import { act, fireEvent } from '@testing-library/react';
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';

export const CONFIGS = Object.fromEntries(shadcnConfigs.map((c) => [c.name, c]));
export const TYPES = Object.keys(CONFIGS);

/** A definition value as the app resolves it: '{{...}}' evaluated, plain strings kept. */
export const resolveDefinitionValue = (value) => {
  if (typeof value !== 'string') return value;
  const m = value.match(/^\{\{([\s\S]*)\}\}$/);
  if (!m) return value;
  try {
    return new Function(`return (${m[1]});`)(); // eslint-disable-line no-new-func
  } catch {
    return value;
  }
};
const valuesOf = (section) =>
  Object.fromEntries(Object.entries(section || {}).map(([k, v]) => [k, resolveDefinitionValue(v?.value)]));
/** A widget's registered default properties and styles, resolved. */
export const defaultsOf = (name) => valuesOf(CONFIGS[name].definition.properties);
export const styleDefaultsOf = (name) => valuesOf(CONFIGS[name].definition.styles);

// A grid column is about 30 px on a 1290 px canvas.
const COLUMN_PX = 30;

/** The widget's default box in pixels, at least 240 px wide. */
export const boxOf = (name) => {
  const size = CONFIGS[name]?.defaultSize || {};
  return { width: Math.max(240, (Number(size.width) || 10) * COLUMN_PX), height: Number(size.height) || 300 };
};

// Widgets with an overlay, opened by their `open` action or a press on their trigger.
export const OPENS = new Set([
  'ShadSelect',
  'ShadCombobox',
  'ShadMultiselect',
  'ShadDatePicker',
  'ShadDateTimePicker',
  'ShadTimePicker',
  'ShadColorPicker',
  'ShadDropdownMenu',
  'ShadDialog',
]);
export const OVERLAY = '[data-radix-popper-content-wrapper], [role="dialog"], [role="listbox"], [role="menu"], .modal';

/** A mouse press as a user makes it (Radix triggers open on pointerdown, others on click). */
export const press = (node) => {
  fireEvent.pointerDown(node, { button: 0, pointerType: 'mouse' });
  fireEvent.mouseDown(node, { button: 0 });
  fireEvent.pointerUp(node, { button: 0, pointerType: 'mouse' });
  fireEvent.click(node);
};

/** Opens a mounted widget's overlay (its `open` action, else a press on its trigger inside `scope`). */
export const openOverlay = async (exposed, scope = document) => {
  const open = exposed?.open;
  const trigger = scope.querySelector('[aria-haspopup], [role="combobox"], button.tj-shad-trigger');
  await act(async () => {
    if (typeof open === 'function') await open();
    else if (trigger) press(trigger);
  });
};
