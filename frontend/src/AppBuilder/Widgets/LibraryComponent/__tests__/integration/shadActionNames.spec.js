import fs from 'fs';
import path from 'path';

// The shadcn pack has one name per action and per exposed value (team UI 2.0 review R5, 2026-10-24): the pack's
// earlier second names are gone, and the name UI 2.0's own widget uses is the one kept. Read from the built manifest,
// what the host registers.
const MANIFEST = path.resolve(__dirname, '../../../../../../../packs/shadcn/dist/manifest.json');
const { components } = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

const actionNames = (component) => (components[component].actions || []).map((a) => a.name);

// component: [dropped names, kept names]
const ACTIONS = {
  Input: [['setValue', 'focus'], ['setText', 'setFocus']],
  NumberInput: [['setValue', 'focus'], ['setText', 'setFocus']],
  Textarea: [['setValue'], ['setText']],
  OtpInput: [['setValue'], ['setText']],
  PasswordInput: [['focus'], ['setFocus']],
  PhoneInput: [['focus'], ['setFocus', 'setValue']],
  CurrencyInput: [['focus'], ['setFocus', 'setValue']],
  TagsInput: [['focus'], ['setFocus']],
  Select: [['setValue'], ['selectOption']],
  Combobox: [['setValue'], ['selectOption']],
  RadioGroup: [['setValue'], ['selectOption']],
  Checkbox: [['setChecked'], ['setValue']],
  Switch: [['setChecked'], ['setValue']],
  DatePicker: [['clear'], ['clearValue', 'setValue', 'setDate']],
  DataTable: [['clearSelection'], ['deselectRow', 'deselectAllRows']],
  Stepper: [['next', 'back', 'goToStep'], ['nextTab', 'previousTab', 'setTab']],
};

describe('shadcn pack: one name per action', () => {
  test.each(Object.entries(ACTIONS))('%s keeps only the UI 2.0 names', (component, [dropped, kept]) => {
    const names = actionNames(component);
    for (const name of dropped) expect(names).not.toContain(name);
    for (const name of kept) expect(names).toContain(name);
  });

  test('no component registers an action name twice', () => {
    for (const component of Object.keys(components)) {
      const names = actionNames(component);
      expect([component, names.length]).toEqual([component, new Set(names).size]);
    }
  });

  test('Dialog exposes show, as UI 2.0 Modal does, and no isOpen', () => {
    const props = components.Dialog.props.map((p) => p.name);
    expect(props).toContain('show');
    expect(props).not.toContain('isOpen');
  });
});
