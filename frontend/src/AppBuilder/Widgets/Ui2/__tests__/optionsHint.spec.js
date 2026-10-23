import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A Toggle group's labels could differ from its values only through [{ label, value }], and the inspector never said
 * so: the Options field starts filled with a plain list, so its placeholder example never shows. Each UI 2.0 options
 * field now carries a note under it (Code.jsx draws a config's `note`) with the object form.
 */
import { CONFIGS } from './packWidgets';

const OPTION_WIDGETS = ['ShadToggleGroup', 'ShadSelect', 'ShadRadioGroup', 'ShadMultiselect', 'ShadCombobox'];

test.each(OPTION_WIDGETS)('%s says under its options how labels differ from values', (type) => {
  const note = CONFIGS[type].properties.options.note;
  expect(note).toMatch(/label: '[^']+', value: '[^']+'/);
  expect(note).toMatch(/^Labels that differ from values: \{\{\[.*\]\}\}$/);
});
