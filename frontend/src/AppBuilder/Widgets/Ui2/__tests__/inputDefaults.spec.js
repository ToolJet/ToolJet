import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A new UI 2.0 Input, Textarea, Select or Date picker was dropped with no label and no placeholder (the native ones
 * have both), so it looked unfinished beside them and its box held a blank band where the label goes. Every UI 2.0
 * input starts with a label, and a placeholder where it has one, set in its config.
 */
import { CONFIGS } from './packWidgets';

const INPUTS = [
  'ShadInput',
  'ShadTextarea',
  'ShadNumberInput',
  'ShadCurrencyInput',
  'ShadPhoneInput',
  'ShadPasswordInput',
  'ShadSelect',
  'ShadCombobox',
  'ShadMultiselect',
  'ShadDatePicker',
  'ShadDateTimePicker',
  'ShadTimePicker',
  'ShadTagsInput',
  'ShadColorPicker',
];
// The one-time code fills its own slots; a placeholder would sit in each slot.
const NO_PLACEHOLDER = ['ShadOtpInput'];

test.each(INPUTS)('a new %s has a label and a placeholder', (type) => {
  const initial = CONFIGS[type].definition.properties;
  expect(String(initial.label?.value ?? '').trim()).not.toBe('');
  if (CONFIGS[type].properties.placeholder && !NO_PLACEHOLDER.includes(type)) {
    expect(String(initial.placeholder?.value ?? '').trim()).not.toBe('');
  }
});
