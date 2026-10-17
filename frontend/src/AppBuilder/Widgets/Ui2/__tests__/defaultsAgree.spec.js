// A choice property's default (what the inspector resets to and shows as the default) and the value a new widget is
// created with must agree. They disagreed on the Line and Combo charts (yAxisFormat "number" in the inspector, created
// as "currency"), so a line chart of job counts read "$0 $1 $2" on its axis; and on the Line chart's legend and the
// Record list's trailing value format.
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { shadcnConfigs } from '../../../WidgetManager/widgets/shadcn';

const choiceCases = shadcnConfigs.flatMap((config) =>
  Object.entries(config.properties || {})
    .filter(
      ([key, def]) => key !== 'tooltipFormat' && (def.options || ['select', 'switch', 'toggle'].includes(def.type))
    )
    .map(([key, def]) => [config.name, key, def])
    .filter(([, key, def]) => (def.validation?.defaultValue ?? def.defaultValue) !== undefined)
    .filter(
      ([name, key]) => shadcnConfigs.find((c) => c.name === name).definition?.properties?.[key]?.value !== undefined
    )
);
const unwrap = (v) => String(v).replace(/^\{\{(.*)\}\}$/, '$1');

describe('pack choice defaults agree with what a new widget is created with', () => {
  it.each(choiceCases)('%s.%s', (name, key, def) => {
    const created = shadcnConfigs.find((c) => c.name === name).definition.properties[key].value;
    expect(unwrap(created)).toBe(unwrap(def.validation?.defaultValue ?? def.defaultValue));
  });
});

// A form submits what its inputs hold. Free-entry inputs start empty, as their native counterparts do: a new Tags
// input held two sample tags and a Currency input $1,250.00, and an AI-built intake form submitted both (2026-10-17).
// Choice controls (radio, toggle and button groups, multiselect, slider, rating) keep a preselection, as native ones do.
const FREE_ENTRY = [
  'ShadInput',
  'ShadTextarea',
  'ShadPasswordInput',
  'ShadPhoneInput',
  'ShadOtpInput',
  'ShadCurrencyInput',
  'ShadTagsInput',
  'ShadDatePicker',
  'ShadTimePicker',
  'ShadDateTimePicker',
  'ShadSelect',
  'ShadCombobox',
];
const EMPTY = ['', '{{[]}}', '[]', '{{null}}', '{{""}}', "{{''}}"];

describe('free-entry inputs start empty', () => {
  it.each(FREE_ENTRY)('%s', (name) => {
    const config = shadcnConfigs.find((c) => c.name === name);
    expect(config).toBeDefined();
    const created = config.definition.properties.defaultValue?.value ?? '';
    expect(EMPTY).toContain(typeof created === 'string' ? created.trim() : JSON.stringify(created));
  });
});

// Default children are placed in grid columns (43 across the parent). A child with no layout width gets its widget's
// default width scaled by the canvas rule in appCanvasUtils (defaultSize.width * 100 / 43), which on a Button is 14
// columns, not 6: the Dialog's two footer buttons, 8 columns apart, overlapped and the second ran past the dialog's
// edge (2026-10-17). Every default child fits the 43 columns, and no two in one slot and row overlap.
const NO_OF_GRIDS = 43;
const parentCases = shadcnConfigs.filter((config) => Array.isArray(config.defaultChildren));

describe('default children fit their parent', () => {
  it.each(parentCases.map((config) => [config.name, config]))('%s', (name, config) => {
    const placed = config.defaultChildren.map((child) => {
      const meta = shadcnConfigs.find((c) => c.component === child.componentName);
      const width = child.layout.width ?? (meta.defaultSize.width * 100) / NO_OF_GRIDS;
      const left = child.layout.left ?? 0;
      const top = child.layout.top ?? 0;
      const height = child.layout.height ?? meta.defaultSize.height;
      return { label: child.displayName ?? child.componentName, slot: child.slotName ?? '', left, width, top, height };
    });
    for (const child of placed)
      expect(`${child.label} ends at ${child.left + child.width}`).toBe(
        `${child.label} ends at ${Math.min(child.left + child.width, NO_OF_GRIDS)}`
      );
    for (const a of placed)
      for (const b of placed) {
        if (a === b || a.slot !== b.slot) continue;
        const rows = a.top < b.top + b.height && b.top < a.top + a.height;
        const cols = a.left < b.left + b.width && b.left < a.left + a.width;
        expect(`${a.label} and ${b.label} overlap: ${rows && cols}`).toBe(`${a.label} and ${b.label} overlap: false`);
      }
  });
});
