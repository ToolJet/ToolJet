/**
 * UI 2.0 Date and time picker: a field opening a calendar with hour, minute and AM/PM controls under it.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Date and time picker itself does. Titles carry [ShadDateTimePicker-<AREA>-<NNN>] ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'dt1';
const widget = createWidgetHarness({
  componentType: 'ShadDateTimePicker',
  handle: 'datetimepicker1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 320,
  defaultProperties: { label: binding('Date and time'), placeholder: binding('Pick a date and time') },
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const trigger = () => screen.getByRole('button', { name: 'Date and time' });
const open = async () => {
  await act(async () => fireEvent.click(trigger()));
  await screen.findByRole('grid');
};
const day = (n) => within(screen.getByRole('grid')).getByText(String(n)).closest('button');
const clickDay = async (n) => {
  await act(async () => fireEvent.click(day(n)));
};
/** Opens the Hour or Minute select (a Radix select: pointerdown) and lists its options. */
const openSelect = async (name) => {
  await act(async () => {
    fireEvent.pointerDown(screen.getByRole('combobox', { name }), { button: 0, pointerType: 'mouse', ctrlKey: false });
  });
  return screen.findAllByRole('option');
};
const DEFAULT = { defaultValue: binding('2026-10-15 09:30') };

describe('UI 2.0 Date and time picker', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadDateTimePicker-DEF-001] shows the label, help text and placeholder, and exposes an empty value', async () => {
    render({ properties: { description: binding('When the courier arrives') } });

    expect(trigger()).toHaveTextContent('Pick a date and time');
    expect(screen.getByText('When the courier arrives')).toBeInTheDocument();
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(exposed()).toMatchObject({
      selectedDate: '',
      selectedTime: '',
      unixTimestamp: null,
      displayValue: '',
      label: 'Date and time',
      dateFormat: 'DD MMM YYYY',
      timeFormat: '12h',
      minDate: '',
      maxDate: '',
    });
  });

  test('[ShadDateTimePicker-PROP-001] defaultValue is shown and exposed as a date, a time and a timestamp', async () => {
    render({ properties: DEFAULT });

    await waitFor(() => expect(trigger()).toHaveTextContent('15 Oct 2026 9:30 AM'));
    expect(exposed()).toMatchObject({
      value: '2026-10-15T09:30',
      selectedDate: '2026-10-15',
      selectedTime: '09:30',
      displayValue: '15 Oct 2026 9:30 AM',
      unixTimestamp: new Date(2026, 9, 15, 9, 30).getTime(),
    });
  });

  test('[ShadDateTimePicker-PROP-002] dateFormat and timeFormat 24h change how the value is shown', async () => {
    render({ properties: { ...DEFAULT, dateFormat: binding('DD/MM/YYYY'), timeFormat: binding('24h') } });

    await waitFor(() => expect(trigger()).toHaveTextContent('15/10/2026 09:30'));
    expect(exposed()).toMatchObject({ dateFormat: 'DD/MM/YYYY', timeFormat: '24h', value: '2026-10-15T09:30' });
    await open();
    expect(screen.queryByRole('group', { name: 'AM or PM' })).toBeNull();
  });

  test('[ShadDateTimePicker-EVT-001] picking a day keeps the time and fires onSelect, its handler reading the new date', async () => {
    render({ properties: DEFAULT });
    widget.setEvents(setVariableOn(ID, 'onSelect', { value: '{{components.datetimepicker1.selectedDate}}' }));
    await open();

    await clickDay(20);

    await waitFor(() => expect(widget.variables().seen).toBe('2026-10-20'));
    expect(exposed()).toMatchObject({ value: '2026-10-20T09:30', displayValue: '20 Oct 2026 9:30 AM' });
    expect(exposed().unixTimestamp).toBe(new Date(2026, 9, 20, 9, 30).getTime());
  });

  test('[ShadDateTimePicker-PROP-003] the AM/PM switch and the hour select set the time of day', async () => {
    render({ properties: DEFAULT });
    await open();

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'PM' })));
    await waitFor(() => expect(exposed().selectedTime).toBe('21:30'));
    const hours = await openSelect('Hour');
    await act(async () =>
      fireEvent.keyDown(
        hours.find((o) => o.textContent === '04'),
        { key: 'Enter' }
      )
    );

    await waitFor(() => expect(exposed().selectedTime).toBe('16:30'));
  });

  test('[ShadDateTimePicker-PROP-004] minuteStep sets the minutes offered', async () => {
    render({ properties: { defaultValue: binding('2026-10-15 10:30'), minuteStep: binding('{{30}}') } });
    await open();

    const minutes = await openSelect('Minute');

    expect(minutes.map((o) => o.textContent)).toEqual(['00', '30']);
  });

  test('[ShadDateTimePicker-PROP-005] minDate, maxDate and disabledDates block those days and are exposed', async () => {
    render({
      properties: {
        defaultValue: binding('2026-10-15 10:00'),
        minDate: binding('2026-10-10'),
        maxDate: binding('2026-10-18'),
        disabledDates: binding("{{['2026-10-12']}}"),
      },
    });
    await open();

    expect(day(16)).not.toBeDisabled();
    expect(day(20)).toBeDisabled();
    expect(day(8)).toBeDisabled();
    expect(day(12)).toBeDisabled();
    expect(exposed()).toMatchObject({ minDate: '2026-10-10', maxDate: '2026-10-18' });
  });

  test('[ShadDateTimePicker-VAL-001] a default outside the bounds is invalid until an allowed day is picked', async () => {
    render({ properties: { defaultValue: binding('2026-10-25 10:00'), maxDate: binding('2026-10-18') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
    await open();
    await clickDay(16);

    await waitFor(() => expect(exposed()).toMatchObject({ value: '2026-10-16T10:00', isValid: true }));
  });

  test('[ShadDateTimePicker-ACT-001] setValue reads the format given, setValueInTimestamp a timestamp, setTime the time', async () => {
    render();

    await widget.act('setValue', '21/10/2026 09:30', 'DD/MM/YYYY HH:mm');
    await waitFor(() => expect(exposed().value).toBe('2026-10-21T09:30'));
    await widget.act('setTime', '14:45');
    await waitFor(() => expect(exposed().value).toBe('2026-10-21T14:45'));
    expect(trigger()).toHaveTextContent('21 Oct 2026 2:45 PM');
    await widget.act('setValueInTimestamp', new Date(2027, 0, 2, 8, 0).getTime());
    await waitFor(() => expect(exposed().value).toBe('2027-01-02T08:00'));
    await widget.act('setValue', 'not a date');
    expect(exposed().value).toBe('2027-01-02T08:00');
  });

  test('[ShadDateTimePicker-ACT-002] clearValue empties the value', async () => {
    render({ properties: DEFAULT });

    await widget.act('clearValue');

    await waitFor(() => expect(exposed().value).toBe(''));
    expect(trigger()).toHaveTextContent('Pick a date and time');
  });

  test('[ShadDateTimePicker-ACT-003] setMinDate, setMaxDate, setDisabledDates and clearDisabledDates change what is valid', async () => {
    render({ properties: { defaultValue: binding('2026-10-21 09:30') } });
    await waitFor(() => expect(exposed().isValid).toBe(true));

    await widget.act('setMinDate', '2026-11-01');
    await waitFor(() => expect(exposed().minDate).toBe('2026-11-01'));
    expect(exposed().isValid).toBe(false);
    await widget.act('setMinDate', '');
    await widget.act('setMaxDate', '2026-10-01');
    await waitFor(() => expect(exposed().maxDate).toBe('2026-10-01'));
    expect(exposed().isValid).toBe(false);
    await widget.act('setMaxDate', '');
    await widget.act('setDisabledDates', ['2026-10-21']);
    await waitFor(() => expect(exposed().maxDate).toBe(''));
    expect(exposed().isValid).toBe(false);
    await widget.act('clearDisabledDates');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadDateTimePicker-EVT-002] focusing and leaving the field fire onFocus and onBlur', async () => {
    render();
    widget.setEvents([
      ...setVariableOn(ID, 'onFocus', { key: 'focused' }),
      ...setVariableOn(ID, 'onBlur', { key: 'blurred' }),
    ]);

    await act(async () => trigger().focus());
    await waitFor(() => expect(widget.variables().focused).toBe('YES'));
    await act(async () => trigger().blur());
    await waitFor(() => expect(widget.variables().blurred).toBe('YES'));
  });

  test('[ShadDateTimePicker-ACT-004] setFocus and setBlur move focus to and from the field', async () => {
    render();

    await widget.act('setFocus');
    expect(document.activeElement).toBe(trigger());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(trigger());
  });

  test('[ShadDateTimePicker-VAL-002] a mandatory date and time picker is invalid until a value is set', async () => {
    render({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(exposed().isMandatory).toBe(true);
    await widget.act('setValue', '2026-10-21 09:30');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadDateTimePicker-VAL-003] a customRule message makes the value invalid and is shown once the picker closes', async () => {
    render({
      properties: DEFAULT,
      validation: {
        customRule: binding("{{components.datetimepicker1.selectedDate === '2026-10-20' ? 'Depot closed' : ''}}"),
      },
    });
    await open();

    await clickDay(20);
    await act(async () => fireEvent.keyDown(document.activeElement, { key: 'Escape' }));

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('Depot closed')).toBeInTheDocument();
  });

  test('[ShadDateTimePicker-STY-001] field and popover styles reach the field and its popover as CSS variables', async () => {
    const { container } = render({
      styles: { accentColor: binding('#e11d48'), popoverBackgroundColor: binding('#fef3c7') },
    });

    expect(container.querySelector('.tj-shadcn').style.getPropertyValue('--sc-primary')).toBe('#e11d48');
    await open();
    const panel = screen.getByRole('grid').closest('[data-radix-popper-content-wrapper] > *');
    expect(panel.style.getPropertyValue('--sc-popover')).toBe('#fef3c7');
  });
});
