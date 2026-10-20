import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 016 (Codex fixtures currentDateTimePopupGapRequired016 and currentDateDiscontinuity016): in Los
// Angeles, 02:30 on 8 March 2026 does not exist (the clocks go from 02:00 to 03:00). Picking hour 02 from 01:30 that
// day, or picking that day while the time was 02:30, published 03:30 as a valid value, fired onSelect with it and the
// Form submitted it; setValue and setTime with that time, and a default of it, did the same. Now the popup's pick
// leaves the value as it was and makes the field invalid with a message until a time that exists is picked, and the
// actions and the default read it as no date. These hold in any zone: where 8 March has 02:30, every pick is taken as
// is (npm run test:ui2-dates-tz runs them in Los Angeles, as this spec does on a machine there).
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const at = new Date(2026, 2, 8, 2, 30);
const GAP = at.getDate() !== 8 || at.getHours() !== 2 || at.getMinutes() !== 30;

const w = createWidgetHarness({
  componentType: 'ShadDateTimePicker',
  id: 'date1',
  handle: 'date1',
  widgetWidth: 500,
  widgetHeight: 100,
  preload: ['Form'],
});
beforeEach(() => w.setup());
afterEach(() => w.teardown());

const properties = (value) => ({
  label: binding('Appointment'),
  defaultValue: binding(value),
  dateFormat: binding('YYYY-MM-DD'),
  timeFormat: binding('24h'),
  minuteStep: binding(30),
});

const mountInForm = async (initial) => {
  w.renderInsideForm({ properties: properties(initial), validation: { mandatory: binding(true) } });
  w.setComponentProperty('form1', 'resetOnSubmit', '{{false}}', 'properties');
  w.setComponentProperty('form1', 'validateOnSubmit', '{{true}}', 'properties');
  await waitFor(() => expect(w.exposed().value).toBe(initial));
  w.setEvents([
    ...setVariableOn('date1', 'onSelect', {
      key: 'picks',
      value: '{{[...(variables.picks||[]),components.date1.value]}}',
    }),
    ...setVariableOn('form1', 'onSubmit', { key: 'submitted', value: '{{components.form1.formData.date1}}' }),
    ...setVariableOn('form1', 'onInvalid', { key: 'invalid', value: 'YES' }),
  ]);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: /^Appointment/ })));
  return screen.findByRole('grid');
};

const pickHour = async (label) => {
  await act(async () =>
    fireEvent.pointerDown(screen.getByRole('combobox', { name: 'Hour' }), {
      button: 0,
      pointerType: 'mouse',
      ctrlKey: false,
    })
  );
  const option = (await screen.findAllByRole('option')).find((o) => o.textContent === label);
  await act(async () => fireEvent.keyDown(option, { key: 'Enter' }));
};

const submit = async () => {
  await act(async () => {
    await w.exposed('form1').submitForm();
  });
  return { submitted: w.variables().submitted, invalid: w.variables().invalid };
};

describe.each(['hour', 'calendar'])('a %s pick in the popup', (gesture) => {
  test.each([8, 9])(
    'of 02:30 on 8 or 9 March (%s): taken when it exists, refused when the clocks skip it',
    async (day) => {
      const date = `2026-03-0${day}`;
      const requested = `${date}T02:30`;
      const initial = gesture === 'hour' ? `${date}T01:30` : '2026-03-07T02:30';
      const grid = await mountInForm(initial);
      if (gesture === 'hour') await pickHour('02');
      else await act(async () => fireEvent.click(within(grid).getByText(String(day)).closest('button')));
      if (GAP && day === 8) {
        expect(w.exposed().value).toBe(initial);
        expect(w.exposed().isValid).toBe(false);
        expect(screen.getByRole('alert').textContent).toMatch(/2026-03-08 02:30/);
        expect(w.variables().picks).toBeUndefined();
        expect(await submit()).toEqual({ submitted: undefined, invalid: 'YES' });
      } else {
        expect(w.exposed().value).toBe(requested);
        expect(w.exposed().isValid).toBe(true);
        expect(w.variables().picks).toEqual([requested]);
        expect(await submit()).toEqual({ submitted: requested, invalid: undefined });
      }
    }
  );
});

test('after a skipped time, a time that exists on that day is taken and the field is valid again', async () => {
  await mountInForm('2026-03-07T02:30');
  await act(async () => fireEvent.click(within(screen.getByRole('grid')).getByText('8').closest('button')));
  await pickHour('03');
  expect(w.exposed().value).toBe('2026-03-08T03:30');
  expect(w.exposed().isValid).toBe(true);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(w.variables().picks).toEqual(GAP ? ['2026-03-08T03:30'] : ['2026-03-08T02:30', '2026-03-08T03:30']);
});

test('setValue and setTime with a skipped time keep the value', async () => {
  w.render({ currentMode: 'view', properties: properties('2026-03-08T01:30'), validation: {} });
  await waitFor(() => expect(w.exposed().value).toBe('2026-03-08T01:30'));
  await act(async () => w.exposed().setValue('2026-03-08T02:30'));
  expect(w.exposed().value).toBe(GAP ? '2026-03-08T01:30' : '2026-03-08T02:30');
  await act(async () => w.exposed().setValue('2026-03-08T01:30'));
  await act(async () => w.exposed().setTime('02:30'));
  expect(w.exposed().value).toBe(GAP ? '2026-03-08T01:30' : '2026-03-08T02:30');
  await act(async () => w.exposed().setTime('03:30'));
  expect(w.exposed().value).toBe('2026-03-08T03:30');
});

test('a required picker whose default is a skipped time is empty, and the Form refuses it', async () => {
  w.renderInsideForm({ properties: properties('2026-03-08T02:30'), validation: { mandatory: binding(true) } });
  w.setComponentProperty('form1', 'resetOnSubmit', '{{false}}', 'properties');
  w.setEvents([
    ...setVariableOn('form1', 'onSubmit', { key: 'submitted', value: '{{components.form1.formData.date1}}' }),
    ...setVariableOn('form1', 'onInvalid', { key: 'invalid', value: 'YES' }),
  ]);
  await waitFor(() => expect(w.exposed('form1').submitForm).toBeInstanceOf(Function));
  expect({ value: w.exposed().value, ...(await submit()) }).toEqual(
    GAP
      ? { value: '', submitted: undefined, invalid: 'YES' }
      : { value: '2026-03-08T02:30', submitted: '2026-03-08T02:30', invalid: undefined }
  );
});
