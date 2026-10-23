import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A new UI 2.0 Input, Textarea, Select or Date picker was dropped with no label and no placeholder (the native ones
 * have both), so it looked unfinished beside them and its box held a blank band where the label goes. Every UI 2.0
 * input starts with a label, and a placeholder where it has one, and every choice widget with options to choose from.
 *
 * The lists come from the configs, so a new widget is covered when it is added: an input is a widget with a `label`
 * property that exposes what the user enters (value, values or file) and fires an event when it changes; a choice
 * widget is one with an options-like list property.
 */
import { CONFIGS, INPUT_TYPES, TYPES, defaultsOf } from './packWidgets';

const INPUTS = INPUT_TYPES;

// The one-time code fills its own slots; a placeholder would sit in each slot.
const NO_PLACEHOLDER = ['ShadOtpInput'];
// The lists a user chooses from (the rest of a widget's arrays are data, markers or filters, empty by design).
const CHOICE_LISTS = ['options', 'buttons', 'items', 'tabs', 'suggestions', 'steps', 'slides'];
const CHOICES = TYPES.flatMap((type) =>
  CHOICE_LISTS.filter((key) => CONFIGS[type].properties?.[key]).map((key) => [type, key])
);

test('finds the inputs and choice widgets', () => {
  expect(INPUTS).toEqual(
    expect.arrayContaining(['ShadInput', 'ShadSelect', 'ShadSlider', 'ShadRadioGroup', 'ShadRating', 'ShadSwitch'])
  );
  expect(INPUTS).not.toContain('ShadProgress');
  expect(CHOICES.map(([type]) => type)).toEqual(
    expect.arrayContaining(['ShadSelect', 'ShadToggleGroup', 'ShadButtonGroup', 'ShadTabs', 'ShadTagsInput'])
  );
});

test.each(INPUTS)('a new %s has a label and a placeholder', (type) => {
  const initial = defaultsOf(type);
  expect(String(initial.label ?? '').trim()).not.toBe('');
  if (CONFIGS[type].properties.placeholder && !NO_PLACEHOLDER.includes(type)) {
    expect(String(initial.placeholder ?? '').trim()).not.toBe('');
  }
});

test.each(CHOICES)('a new %s has %s to choose from', (type, key) => {
  const list = defaultsOf(type)[key];
  expect(Array.isArray(list)).toBe(true);
  expect(list.length).toBeGreaterThan(0);
});
