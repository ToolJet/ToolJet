// Guardrail: every UI 2.0 widget has one readable behaviour spec, Ui2/<Widget>/__tests__/integration/<Type>.spec.jsx,
// and that spec names everything the widget adds to the standard set: each of its own properties, validation rules,
// events, actions and exposed values (a key it never mentions is a key nothing checks). What every widget shares is
// covered once, in Ui2/__tests__/integration/controlState.spec.jsx. Titles carry [<Type>-<AREA>-<NNN>] ids.
import fs from 'fs';
import path from 'path';
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';

const UI2 = path.resolve(__dirname, '..');
const SHARED_PROPERTIES = new Set([
  'loadingState',
  'visibility',
  'disabledState',
  'collapseWhenHidden',
  'tooltip',
  'tooltipFormat',
  'loadingIndicator',
  'dynamicHeight',
]);
const SHARED_ACTIONS = new Set(['setVisibility', 'setDisable', 'setLoading']);
const SHARED_EXPOSED = new Set(['isVisible', 'isDisabled', 'isLoading']);

/** The folder a type's code and tests live in: ShadDatePicker -> Ui2/DatePicker. */
export const folderOf = (type) => type.replace(/^Shad/, '');
const specPath = (type) => path.join(UI2, folderOf(type), '__tests__', 'integration', `${type}.spec.jsx`);

/** Everything a widget adds to the standard set, as section.key. */
const ownKeys = (config) => [
  ...Object.keys(config.properties || {})
    .filter((k) => !SHARED_PROPERTIES.has(k))
    .map((k) => `properties.${k}`),
  ...Object.keys(config.validation || {}).map((k) => `validation.${k}`),
  ...Object.keys(config.events || {}).map((k) => `events.${k}`),
  ...(config.actions || [])
    .map((a) => a.handle)
    .filter((k) => !SHARED_ACTIONS.has(k))
    .map((k) => `actions.${k}`),
  ...Object.keys(config.exposedVariables || {})
    .filter((k) => !SHARED_EXPOSED.has(k))
    .map((k) => `exposed.${k}`),
];

describe.each(shadcnConfigs.map((c) => [c.name, c]))('%s behaviour spec', (type, config) => {
  const file = specPath(type);
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';

  it('exists', () => {
    expect(fs.existsSync(file) ? file : `missing ${path.relative(UI2, file)}`).toBe(file);
  });

  it('names every property, validation rule, event, action and exposed value the widget adds', () => {
    const unnamed = ownKeys(config).filter((entry) => !new RegExp(`\\b${entry.split('.')[1]}\\b`).test(text));
    expect(unnamed).toEqual([]);
  });

  it('titles every test with a scenario id, and has a style scenario when the widget has its own styles', () => {
    const titles = [...text.matchAll(/\btest(?:\.\w+)?\(\s*['"`]([^'"`]*)/g)].map((m) => m[1]);
    expect(titles.length).toBeGreaterThan(0);
    expect(titles.filter((t) => !t.startsWith(`[${type}-`))).toEqual([]);
    const ownStyles = Object.keys(config.styles || {}).filter((k) => k !== 'boxShadow');
    if (ownStyles.length) expect(text).toMatch(new RegExp(`\\[${type}-STY-\\d{3}\\]`));
  });
});
