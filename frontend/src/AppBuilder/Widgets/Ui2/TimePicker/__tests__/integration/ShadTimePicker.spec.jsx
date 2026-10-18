/**
 * UI 2.0 Time picker: a time field opening hour, minute and AM/PM columns, or a list of times.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Time picker itself does. Titles carry [ShadTimePicker-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'time1';
const widget = createWidgetHarness({
  componentType: 'ShadTimePicker',
  handle: 'timepicker1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 320,
  defaultProperties: { label: binding('Time'), placeholder: binding('Pick a time') },
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const trigger = () => screen.getByRole('button', { name: 'Time' });
const open = async () => {
  await act(async () => fireEvent.click(trigger()));
  await screen.findAllByRole('listbox');
};
const column = (name) => screen.getByRole('listbox', { name });
const choose = async (columnName, label) => {
  await act(async () => fireEvent.click(within(column(columnName)).getByRole('option', { name: label })));
};
const labels = (name) =>
  within(column(name))
    .getAllByRole('option')
    .map((o) => o.textContent);

describe('UI 2.0 Time picker', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadTimePicker-DEF-001] shows the label, help text and placeholder, and exposes an empty time', async () => {
    render({ properties: { description: binding('When the shift starts') } });

    expect(trigger()).toHaveTextContent('Pick a time');
    expect(screen.getByText('When the shift starts')).toBeInTheDocument();
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(exposed()).toMatchObject({
      formattedValue: '',
      label: 'Time',
      timeFormat: '12h',
      minTime: '00:00',
      maxTime: '23:59',
    });
  });

  test('[ShadTimePicker-PROP-001] defaultValue is shown in 12-hour time; timeFormat 24h shows and offers 24 hours', async () => {
    render({ properties: { defaultValue: binding('14:30') } });
    await waitFor(() => expect(trigger()).toHaveTextContent('2:30 PM'));
    expect(exposed()).toMatchObject({ value: '14:30', formattedValue: '2:30 PM' });

    render({ properties: { defaultValue: binding('14:30'), timeFormat: binding('24h') } });
    await waitFor(() => expect(trigger()).toHaveTextContent('14:30'));
    expect(exposed().timeFormat).toBe('24h');
    await open();
    expect(labels('Hours')).toHaveLength(24);
    expect(screen.queryByRole('listbox', { name: 'AM or PM' })).toBeNull();
  });

  test('[ShadTimePicker-EVT-001] picking from the columns fires onSelect each time, its handler reading the new value', async () => {
    render();
    widget.setEvents([
      ...setVariableOn(ID, 'onSelect', { value: '{{components.timepicker1.formattedValue}}' }),
      ...countInvocationsOn(ID, 'onSelect', { key: 'picks' }),
    ]);
    await open();

    await choose('Hours', '09');
    await waitFor(() => expect(exposed()).toMatchObject({ value: '09:00', formattedValue: '9:00 AM' }));
    await choose('AM or PM', 'PM');
    await choose('Minutes', '30');

    await waitFor(() => expect(exposed()).toMatchObject({ value: '21:30', formattedValue: '9:30 PM' }));
    expect(widget.variables().picks).toBe(3);
  });

  test('[ShadTimePicker-PROP-002] minuteStep sets the minutes offered', async () => {
    render({ properties: { minuteStep: binding('{{20}}') } });
    await open();

    expect(labels('Minutes')).toEqual(['00', '20', '40']);
  });

  test('[ShadTimePicker-PROP-003] pickerStyle list offers the times within minTime and maxTime, and a pick closes it', async () => {
    render({
      properties: {
        pickerStyle: binding('list'),
        minTime: binding('09:00'),
        maxTime: binding('10:00'),
        timeFormat: binding('24h'),
      },
    });
    await open();

    expect(labels('Times')).toEqual(['09:00', '09:15', '09:30', '09:45', '10:00']);
    await choose('Times', '09:45');

    await waitFor(() => expect(exposed().value).toBe('09:45'));
    expect(exposed()).toMatchObject({ minTime: '09:00', maxTime: '10:00' });
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  });

  test('[ShadTimePicker-PROP-004] in the columns, hours outside minTime and maxTime cannot be picked', async () => {
    render({ properties: { minTime: binding('09:00'), maxTime: binding('17:00'), timeFormat: binding('24h') } });
    await open();

    expect(within(column('Hours')).getByRole('option', { name: '08' })).toBeDisabled();
    expect(within(column('Hours')).getByRole('option', { name: '12' })).not.toBeDisabled();
    expect(within(column('Hours')).getByRole('option', { name: '18' })).toBeDisabled();
  });

  test('[ShadTimePicker-KBD-001] each column has one tab stop, its selected hour, and arrows, Home and End move between enabled options', async () => {
    render({
      properties: {
        defaultValue: binding('14:30'),
        minTime: binding('09:00'),
        maxTime: binding('17:00'),
        timeFormat: binding('24h'),
      },
    });
    await open();
    const hours = column('Hours');
    const hour = (label) => within(hours).getByRole('option', { name: label });
    const tabStops = within(hours)
      .getAllByRole('option')
      .filter((o) => o.tabIndex === 0);
    expect(tabStops).toEqual([hour('14')]);

    act(() => hour('14').focus());
    fireEvent.keyDown(hour('14'), { key: 'ArrowDown' });
    expect(hour('15')).toHaveFocus();
    fireEvent.keyDown(hour('15'), { key: 'ArrowUp' });
    fireEvent.keyDown(hour('14'), { key: 'ArrowUp' });
    expect(hour('13')).toHaveFocus();
    fireEvent.keyDown(hour('13'), { key: 'End' });
    expect(hour('17')).toHaveFocus();
    fireEvent.keyDown(hour('17'), { key: 'Home' });
    expect(hour('09')).toHaveFocus();
  });

  test('[ShadTimePicker-VAL-001] a default outside the bounds is invalid and says which times are allowed', async () => {
    render({ properties: { defaultValue: binding('08:00'), minTime: binding('09:00'), maxTime: binding('10:00') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
    await open();
    await act(async () => fireEvent.keyDown(document.activeElement, { key: 'Escape' }));
    expect(await screen.findByText('Pick a time between 9:00 AM and 10:00 AM')).toBeInTheDocument();
  });

  test('[ShadTimePicker-ACT-001] setValue reads the format given and clearValue empties the time', async () => {
    render();

    await widget.act('setValue', '02:45 PM', 'hh:mm A');
    await waitFor(() => expect(exposed().value).toBe('14:45'));
    expect(trigger()).toHaveTextContent('2:45 PM');
    await widget.act('setValue', 'not a time');
    expect(exposed().value).toBe('14:45');
    await widget.act('clearValue');
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(trigger()).toHaveTextContent('Pick a time');
  });

  test('[ShadTimePicker-ACT-002] setMinTime and setMaxTime change the bounds and what is valid', async () => {
    render({ properties: { defaultValue: binding('10:30') } });
    await waitFor(() => expect(exposed().isValid).toBe(true));

    await widget.act('setMinTime', '11:00');
    await waitFor(() => expect(exposed().minTime).toBe('11:00'));
    expect(exposed().isValid).toBe(false);
    await widget.act('setMinTime', '');
    await widget.act('setMaxTime', '10:00');
    await waitFor(() => expect(exposed().maxTime).toBe('10:00'));
    expect(exposed().minTime).toBe('00:00');
    expect(exposed().isValid).toBe(false);
  });

  test('[ShadTimePicker-EVT-002] focusing and leaving the field fire onFocus and onBlur', async () => {
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

  // A pick from the list once closed the popover around its own close handler, so leaving the field never fired
  // onBlur and the field was never marked touched.
  test('[ShadTimePicker-EVT-003] leaving the field after a pick from the list fires onBlur', async () => {
    render({ properties: { pickerStyle: binding('list') } });
    widget.setEvents(setVariableOn(ID, 'onBlur', { key: 'blurred' }));
    await act(async () => trigger().focus());
    await open();

    await choose('Times', '9:00 AM');
    // The closing popup hands focus back to the field a moment later; leaving means leaving from there.
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
    await act(async () => trigger().blur());

    await waitFor(() => expect(widget.variables().blurred).toBe('YES'), { timeout: 300 });
  });

  test('[ShadTimePicker-ACT-003] setFocus and setBlur move focus to and from the field', async () => {
    render();

    await widget.act('setFocus');
    expect(document.activeElement).toBe(trigger());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(trigger());
  });

  test('[ShadTimePicker-VAL-002] a mandatory time picker is invalid until a time is set', async () => {
    render({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(exposed().isMandatory).toBe(true);
    await widget.act('setValue', '09:00');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadTimePicker-VAL-003] a customRule message makes the time invalid and is shown once the picker closes', async () => {
    render({
      validation: {
        customRule: binding("{{components.timepicker1.value === '12:00' ? 'Lunch is not bookable' : ''}}"),
      },
    });
    await open();

    await choose('Hours', '12');
    await choose('AM or PM', 'PM');
    await act(async () => fireEvent.keyDown(document.activeElement, { key: 'Escape' }));

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('Lunch is not bookable')).toBeInTheDocument();
  });

  test('[ShadTimePicker-STY-001] field and popover styles reach the field and its popover as CSS variables', async () => {
    const { container } = render({
      styles: { iconColor: binding('#e11d48'), popoverBackgroundColor: binding('#fef3c7') },
    });

    expect(container.querySelector('.tj-shadcn').style.getPropertyValue('--lk-icon')).toBe('#e11d48');
    await open();
    const panel = column('Hours').closest('[data-radix-popper-content-wrapper] > *');
    expect(panel.style.getPropertyValue('--sc-popover')).toBe('#fef3c7');
  });

  // A minute step means a time every that many minutes from midnight, in the list and in the columns alike. With a
  // step of 45 between 09:00 and 11:30 the list offered 09:00, 09:45, 10:30, 11:15 while the columns offered 09:00,
  // 09:45, 10:00, 10:45, 11:00 (their minutes restarted every hour). Steps that divide an hour are unchanged.
  describe('a minute step that does not divide an hour', () => {
    const STEP = { minuteStep: binding('{{45}}'), minTime: binding('09:00'), maxTime: binding('11:30') };

    test('[ShadTimePicker-PROP-005] the list offers a time every 45 minutes', async () => {
      render({ properties: { ...STEP, pickerStyle: binding('list'), timeFormat: binding('24h') } });
      await open();

      expect(labels('Times')).toEqual(['09:00', '09:45', '10:30', '11:15']);
    });

    test('[ShadTimePicker-PROP-006] the columns offer the same times, each hour its own minutes', async () => {
      render({ properties: { ...STEP, defaultValue: binding('09:45'), timeFormat: binding('24h') } });
      await open();
      expect(labels('Minutes')).toEqual(['00', '45']);

      await choose('Hours', '10');
      await waitFor(() => expect(exposed().value).toBe('10:30'));
      expect(labels('Minutes')).toEqual(['30']);
      await choose('Hours', '11');
      await waitFor(() => expect(exposed().value).toBe('11:15'));
      expect(labels('Minutes')).toEqual(['15']);
    });
  });
});
