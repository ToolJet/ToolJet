/**
 * A UI 2.0 date or time picker's onSelect handlers read isValid for the value just picked.
 *
 * Release audit round 3 (18 Oct), Codex fixtures reviewDatePickerEventValidity and reviewTimePickerEventValidity,
 * trimmed: picking a day or time in a required, empty picker fired onSelect before isValid was published, so the
 * handler read isValid=false for a valid pick. The text inputs already publish first (runNow).
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';

const history = (id) =>
  setVariableOn(id, 'onSelect', {
    key: 'history',
    value: `{{[...(variables.history||[]),{value:components.${id}.value,valid:components.${id}.isValid}]}}`,
  });

describe.each(['ShadDatePicker', 'ShadDateTimePicker'])('%s picked day', (componentType) => {
  const w = createWidgetHarness({ componentType, id: 'date1', handle: 'date1', preload: ['Form'] });
  beforeEach(() => w.setup());
  afterEach(() => w.teardown());

  test.each([
    [false, true],
    [false, false],
    [true, true],
  ])('Form=%s required=%s: onSelect reads the new isValid', async (form, required) => {
    const options = {
      properties: { label: binding('Audit date'), defaultValue: binding(''), mode: binding('single') },
      validation: { mandatory: binding('{{' + required + '}}') },
    };
    if (form) w.renderInsideForm(options);
    else w.render({ currentMode: 'view', ...options });
    await waitFor(() => expect(w.exposed().isValid).toBe(!required));
    await act(async () => w.setEvents(history('date1')));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /Audit date/ })));
    const day = within(screen.getAllByRole('grid')[0]).getByText('15').closest('button');
    await act(async () => fireEvent.click(day));
    await waitFor(() => expect(w.exposed().isValid).toBe(true));
    expect(w.exposed().value).toBeTruthy();
    expect(w.variables().history).toEqual([{ value: w.exposed().value, valid: true }]);
  });
});

describe('ShadTimePicker picked time', () => {
  const w = createWidgetHarness({ componentType: 'ShadTimePicker', id: 'time1', handle: 'time1', preload: ['Form'] });
  beforeEach(() => w.setup());
  afterEach(() => w.teardown());

  test.each([
    ['list', false, true],
    ['columns', false, true],
    ['list', true, true],
    ['list', false, false],
  ])('%s, Form=%s required=%s: onSelect reads the new isValid', async (style, form, required) => {
    const options = {
      properties: {
        label: binding('Audit time'),
        defaultValue: binding(''),
        pickerStyle: binding(style),
        timeFormat: binding('24h'),
        minTime: binding('09:00'),
        maxTime: binding('10:00'),
        minuteStep: binding('{{30}}'),
      },
      validation: { mandatory: binding('{{' + required + '}}') },
    };
    if (form) w.renderInsideForm(options);
    else w.render({ currentMode: 'view', ...options });
    await waitFor(() => expect(w.exposed().isValid).toBe(!required));
    await act(async () => w.setEvents(history('time1')));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /Audit time/ })));
    const list = screen.getByRole('listbox', { name: style === 'list' ? 'Times' : 'Hours' });
    await act(async () =>
      fireEvent.click(within(list).getByRole('option', { name: style === 'list' ? '09:00' : '09' }))
    );
    await waitFor(() => expect(w.exposed()).toMatchObject({ value: '09:00', isValid: true }));
    expect(w.variables().history).toEqual([{ value: '09:00', valid: true }]);
  });
});
