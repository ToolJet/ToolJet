/**
 * Show clear button (the native inputs' and pickers' showClearBtn), on every UI 2.0 field that offers it: one x
 * (FieldClear), off by default so saved apps do not change. While on, the x shows only while the field holds a value
 * and takes input; it is a tab stop named Clear; pressing it empties the field to its empty value, fires the field's
 * change event once, and leaves isValid right (a required field reads invalid).
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { CONFIGS } from '@/AppBuilder/Widgets/Ui2/__tests__/packWidgets';

const ID = 'w1';
// [componentType, properties with a value, the exposed value once cleared, the change event, validates]
const ROWS = [
  ['ShadInput', { defaultValue: 'Ada' }, '', 'onChange', true],
  ['ShadInput', { inputType: 'number', defaultValue: '42' }, null, 'onChange', true],
  ['ShadNumberInput', { defaultValue: '{{5}}' }, null, 'onChange', true],
  ['ShadCurrencyInput', { defaultValue: '{{12.5}}' }, null, 'onChange', true],
  ['ShadPhoneInput', { defaultValue: '+14155550123' }, '', 'onChange', true],
  ['ShadDatePicker', { defaultValue: '2026-10-17' }, '', 'onSelect', true],
  ['ShadDateTimePicker', { defaultValue: '2026-10-17 09:30' }, '', 'onSelect', true],
];

const harnesses = Object.fromEntries(
  [...new Set(ROWS.map(([type]) => type))].map((type) => [
    type,
    createWidgetHarness({ componentType: type, handle: 'field1', id: ID, widgetHeight: 120, widgetWidth: 400 }),
  ])
);
const bind = (properties) => Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, binding(v)]));
const x = () => screen.queryByRole('button', { name: 'Clear' });

describe.each(ROWS)('%s Show clear button', (type, properties, empty, event, validates) => {
  const widget = harnesses[type];
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());
  const mount = (extra = {}, validation = {}) => {
    widget.render({ currentMode: 'view', properties: bind({ ...properties, ...extra }), validation });
    widget.setEvents(countInvocationsOn(ID, event));
  };

  test('is a toggle, off by default', () => {
    const field = CONFIGS[type].properties.showClearBtn;
    expect(field).toMatchObject({ type: 'toggle', displayName: 'Show clear button' });
    expect(field.validation.defaultValue).toBe(false);
    expect(CONFIGS[type].definition.properties.showClearBtn.value).toBe('{{false}}');
    mount();
    expect(x()).toBeNull();
  });

  test('its x empties the field, fires the change event once, and a required field reads invalid', async () => {
    mount({ showClearBtn: '{{true}}' }, validates ? { mandatory: '{{true}}' } : {});
    const button = await waitFor(() => {
      expect(x()).not.toBeNull();
      return x();
    });
    // A tab stop with a name.
    expect(button.tabIndex).toBe(0);
    expect(button).toHaveAttribute('type', 'button');
    await act(async () => fireEvent.click(button));
    await waitFor(() => expect(widget.exposed().value).toEqual(empty));
    expect(widget.variables().calls).toBe(1);
    if (validates) expect(widget.exposed().isValid).toBe(false);
    // Nothing left to clear: no x.
    expect(x()).toBeNull();
  });

  test('no x while the field is disabled or loading', async () => {
    mount({ showClearBtn: '{{true}}', disabledState: '{{true}}' });
    expect(x()).toBeNull();
    mount({ showClearBtn: '{{true}}', loadingState: '{{true}}' });
    expect(x()).toBeNull();
  });
});
