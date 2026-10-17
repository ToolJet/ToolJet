/**
 * UI 2.0 Date picker: a date field opening a calendar, for one date or a range.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Date picker itself does. Titles carry [ShadDatePicker-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import dayjs from 'dayjs';
import { act, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'date1';
const widget = createWidgetHarness({
  componentType: 'ShadDatePicker',
  handle: 'datepicker1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 320,
  defaultProperties: { label: binding('Due date'), placeholder: binding('Pick a date') },
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const trigger = () => document.getElementById(`shad-${ID}`);
const open = async () => {
  await act(async () => fireEvent.click(trigger()));
  await screen.findAllByRole('grid');
};
/** The day button reading `n` in the first month shown. */
const day = (n) => within(screen.getAllByRole('grid')[0]).getByText(String(n)).closest('button');
const clickDay = async (n) => {
  await act(async () => fireEvent.click(day(n)));
};
const RANGE = { mode: binding('range'), defaultValue: binding("{{['2026-10-05', '2026-10-09']}}") };

describe('UI 2.0 Date picker', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadDatePicker-DEF-001] shows the label, help text and placeholder, and exposes an empty date', async () => {
    render({ properties: { description: binding('When the invoice is due') } });

    expect(await screen.findByText('Due date')).toBeInTheDocument();
    expect(screen.getByText('When the invoice is due')).toBeInTheDocument();
    expect(trigger()).toHaveTextContent('Pick a date');
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(exposed()).toMatchObject({
      unixTimestamp: null,
      displayValue: '',
      dateFormat: 'DD MMM YYYY',
      minDate: '',
      maxDate: '',
      label: 'Due date',
    });
  });

  test('[ShadDatePicker-PROP-001] defaultValue is shown in the format given and exposed in every shape', async () => {
    render({ properties: { defaultValue: binding('2026-10-15'), format: binding('DD/MM/YYYY') } });

    await waitFor(() => expect(trigger()).toHaveTextContent('15/10/2026'));
    expect(exposed()).toMatchObject({
      value: '2026-10-15',
      displayValue: '15/10/2026',
      dateFormat: 'DD/MM/YYYY',
      unixTimestamp: new Date(2026, 9, 15).getTime(),
    });
  });

  test('[ShadDatePicker-EVT-001] picking a day fires onSelect, and its handler reads the new value', async () => {
    render({ properties: { defaultValue: binding('2026-10-15') } });
    widget.setEvents(setVariableOn(ID, 'onSelect', { value: '{{components.datepicker1.value}}' }));
    await open();

    await clickDay(20);

    await waitFor(() => expect(widget.variables().seen).toBe('2026-10-20'));
    expect(trigger()).toHaveTextContent('20 Oct 2026');
    await waitFor(() => expect(screen.queryByRole('grid')).toBeNull());
  });

  test('[ShadDatePicker-PROP-002] minDate, maxDate and disabledDates block those days and are exposed', async () => {
    render({
      properties: {
        defaultValue: binding('2026-10-15'),
        minDate: binding('2026-10-10'),
        maxDate: binding('2026-10-25'),
        disabledDates: binding("{{['2026-10-12']}}"),
      },
    });
    await open();

    expect(day(20)).not.toBeDisabled();
    expect(day(26)).toBeDisabled();
    expect(day(8)).toBeDisabled();
    expect(day(12)).toBeDisabled();
    expect(exposed()).toMatchObject({ minDate: '2026-10-10', maxDate: '2026-10-25' });
  });

  test('[ShadDatePicker-KBD-001] opening the calendar focuses the selected day, so arrow keys move between days', async () => {
    render({ properties: { defaultValue: binding('2026-10-15') } });
    await open();

    await waitFor(() => expect(day(15)).toHaveFocus());
    await act(async () => fireEvent.keyDown(day(15), { key: 'ArrowRight' }));
    await waitFor(() => expect(day(16)).toHaveFocus());
  });

  test('[ShadDatePicker-VAL-001] a default outside the bounds is invalid and says why', async () => {
    render({ properties: { defaultValue: binding('2026-10-28'), maxDate: binding('2026-10-25') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
    await open();
    await act(async () => fireEvent.keyDown(document.activeElement, { key: 'Escape' }));
    expect(await screen.findByText('Pick a date on or before 25 Oct 2026')).toBeInTheDocument();
  });

  test('[ShadDatePicker-PROP-003] mode range shows and exposes both ends of the default range', async () => {
    render({ properties: RANGE });

    await waitFor(() => expect(trigger()).toHaveTextContent('05 Oct 2026 – 09 Oct 2026'));
    expect(exposed()).toMatchObject({
      value: ['2026-10-05', '2026-10-09'],
      startDate: '2026-10-05',
      endDate: '2026-10-09',
      startDateInUnix: new Date(2026, 9, 5).getTime(),
      endDateInUnix: new Date(2026, 9, 9).getTime(),
      selectedDateRange: '05 Oct 2026 – 09 Oct 2026',
    });
  });

  test('[ShadDatePicker-EVT-002] in range mode each pick fires onSelect and the second pick sets the end', async () => {
    render({ properties: { mode: binding('range') } });
    widget.setEvents(setVariableOn(ID, 'onSelect', { value: '{{components.datepicker1.endDate}}' }));
    const month = dayjs().format('YYYY-MM');
    await open();
    expect(screen.getAllByRole('grid')).toHaveLength(2);

    await clickDay(12);
    await waitFor(() => expect(widget.variables().seen).toBe(`${month}-12`));
    await clickDay(15);

    await waitFor(() => expect(widget.variables().seen).toBe(`${month}-15`));
    expect(exposed().startDate).toBe(`${month}-12`);
  });

  // react-day-picker's first range click selects a one-day range ({ from: d, to: d }); the calendar once closed on it,
  // so a user picking a range had to reopen it to pick the end.
  test('[ShadDatePicker-EVT-004] in range mode the calendar stays open after the first pick', async () => {
    render({ properties: { mode: binding('range') } });
    await open();

    await clickDay(12);

    expect(screen.getAllByRole('grid')).toHaveLength(2);
  });

  test('[ShadDatePicker-ACT-001] setValue reads the format given, setValueInTimestamp a timestamp, and clearValue empties', async () => {
    render();

    await widget.act('setValue', '21/10/2026', 'DD/MM/YYYY');
    await waitFor(() => expect(exposed().value).toBe('2026-10-21'));
    expect(trigger()).toHaveTextContent('21 Oct 2026');
    await widget.act('setValueInTimestamp', new Date(2026, 9, 22).getTime());
    await waitFor(() => expect(exposed().value).toBe('2026-10-22'));
    await widget.act('setValue', 'not a date');
    expect(exposed().value).toBe('2026-10-22');
    await widget.act('clearValue');
    await waitFor(() => expect(exposed().value).toBe(''));
  });

  test('[ShadDatePicker-ACT-002] the range setters set, swap and clear each end', async () => {
    render({ properties: { mode: binding('range') } });

    await widget.act('setStartDate', '2026-10-21');
    await widget.act('setEndDate', '25/10/2026', 'DD/MM/YYYY');
    await waitFor(() => expect(exposed().value).toEqual(['2026-10-21', '2026-10-25']));
    await widget.act('setDateRange', '2026-11-09', '2026-11-02');
    await waitFor(() => expect(exposed().value).toEqual(['2026-11-02', '2026-11-09']));
    await widget.act('clearStartDate');
    await waitFor(() => expect(exposed().startDate).toBe(''));
    expect(exposed().endDate).toBe('2026-11-09');
    await widget.act('clearEndDate');
    await waitFor(() => expect(exposed().endDate).toBe(''));
    await widget.act('setDateRange', '2026-11-02', '2026-11-09');
    await widget.act('clearDateRange');
    await waitFor(() => expect(exposed().value).toEqual(['', '']));
  });

  test('[ShadDatePicker-ACT-003] setMinDate, setMaxDate, setDisabledDates and clearDisabledDates change what is valid', async () => {
    render({ properties: { defaultValue: binding('2026-10-21') } });
    await waitFor(() => expect(exposed().isValid).toBe(true));

    await widget.act('setMinDate', '2026-11-01');
    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(exposed().minDate).toBe('2026-11-01');
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

  test('[ShadDatePicker-EVT-003] focusing and leaving the field fire onFocus and onBlur', async () => {
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

  test('[ShadDatePicker-ACT-004] setFocus and setBlur move focus to and from the field', async () => {
    render();

    await widget.act('setFocus');
    expect(document.activeElement).toBe(trigger());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(trigger());
  });

  test('[ShadDatePicker-VAL-002] a mandatory date picker is invalid until a date is set', async () => {
    render({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(exposed().isMandatory).toBe(true);
    await widget.act('setValue', '2026-10-21');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadDatePicker-VAL-003] a customRule message makes the date invalid and is shown once the calendar closes', async () => {
    render({
      properties: { defaultValue: binding('2026-10-20') },
      validation: {
        customRule: binding("{{components.datepicker1.value === '2026-10-20' ? 'We are closed then' : ''}}"),
      },
    });

    await waitFor(() => expect(exposed().isValid).toBe(false));
    await open();
    await act(async () => fireEvent.keyDown(document.activeElement, { key: 'Escape' }));
    expect(await screen.findByText('We are closed then')).toBeInTheDocument();
  });

  // A pick once closed the calendar around the popover's own close handler: the field was never marked touched (its
  // validation message stayed hidden) and the focus tracking still thought it open (onBlur never fired).
  test('[ShadDatePicker-VAL-004] after picking a day, its validation message shows and leaving fires onBlur', async () => {
    render({
      properties: { defaultValue: binding('2026-10-15') },
      validation: {
        customRule: binding("{{components.datepicker1.value === '2026-10-20' ? 'We are closed then' : ''}}"),
      },
    });
    widget.setEvents(setVariableOn(ID, 'onBlur', { key: 'blurred' }));
    await act(async () => trigger().focus());
    await open();

    await clickDay(20);
    await act(async () => trigger().blur());

    expect(await screen.findByText('We are closed then', {}, { timeout: 300 })).toBeInTheDocument();
    await waitFor(() => expect(widget.variables().blurred).toBe('YES'), { timeout: 300 });
  });

  test('[ShadDatePicker-STY-001] field styles reach the field as CSS variables', async () => {
    const { container } = render({ styles: { accentColor: binding('#e11d48'), borderRadius: binding('{{12}}') } });

    await waitFor(() => expect(trigger()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-primary')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('12px');
  });

  // Audit 76: the rules once kept only the first 1,000 disabled dates, so a blocked day later in a longer list
  // validated and submitted, and the same list in another order blocked it.
  describe('a long disabled-dates list', () => {
    const blocked = (target, count) => [
      ...Array.from({ length: count - 1 }, (_, i) => dayjs('2020-01-01').add(i, 'day').format('YYYY-MM-DD')),
      target,
    ];

    test('[ShadDatePicker-VAL-005] blocks a date that comes after the first thousand entries', async () => {
      render({
        properties: {
          defaultValue: binding('2026-10-17'),
          disabledDates: binding(`{{${JSON.stringify(blocked('2026-10-17', 1001))}}}`),
        },
      });

      await waitFor(() => expect(exposed().isValid).toBe(false));
      expect(exposed().value).toBe('2026-10-17');
      await open();
      expect(day(17)).toBeDisabled();
    });

    test('[ShadDatePicker-VAL-006] blocks it in a range and through setDisabledDates too', async () => {
      render({ properties: { mode: binding('range'), defaultValue: binding("{{['2026-10-17', '2026-10-19']}}") } });
      await waitFor(() => expect(exposed().isValid).toBe(true));

      await widget.act('setDisabledDates', blocked('2026-10-17', 1001));
      await waitFor(() => expect(exposed().isValid).toBe(false));
      await widget.act('setDisabledDates', blocked('2026-10-01', 1001));
      await waitFor(() => expect(exposed().isValid).toBe(true));
    });
  });
});
