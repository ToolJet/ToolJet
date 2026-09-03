/**
 * Layer 1 unit tests — pure config object assertions. No store, no DOM.
 *
 * Validates that widget config key ordering is consistent across widgets:
 *   - `mandatory` is the FIRST key in the `validation` block
 *   - `tooltipFormat` and `tooltip` are the LAST keys in the
 *     `additionalActions` section of `properties`
 *
 * These are the key-order invariants the inspector relies on (it iterates
 * `Object.keys()` over the config), so a reorder in a config file silently
 * breaks the UI. Catching it here is cheaper than a Cypress test.
 */
import { datePickerV2Config } from '../datepickerV2';
import { timePickerConfig } from '../timepicker';
import { datetimePickerV2Config } from '../datetimepickerV2';
import { circularProgressbarConfig } from '../circularProgressbar';
import { progressbarConfig } from '../progressbar';

/** Returns only the property keys whose config has `section: 'additionalActions'`. */
function additionalActionKeys(config) {
  return Object.entries(config.properties)
    .filter(([, v]) => v.section === 'additionalActions')
    .map(([k]) => k);
}

describe('widget config ordering', () => {
  describe('mandatory is the first validation key', () => {
    test.each([
      ['DatePickerV2', datePickerV2Config],
      ['TimePicker', timePickerConfig],
      ['DateTimePickerV2', datetimePickerV2Config],
    ])('%s has mandatory as the first validation key', (_name, config) => {
      const keys = Object.keys(config.validation);
      expect(keys[0]).toBe('mandatory');
    });
  });

  describe('tooltip fields are the last additionalActions entries', () => {
    test.each([
      ['CircularProgressbar', circularProgressbarConfig],
      ['Progressbar', progressbarConfig],
    ])('%s has tooltipFormat and tooltip as the last two additionalActions keys', (_name, config) => {
      const keys = additionalActionKeys(config);
      expect(keys.at(-2)).toBe('tooltipFormat');
      expect(keys.at(-1)).toBe('tooltip');
    });
  });
});
