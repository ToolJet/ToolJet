/**
 * UI 2.0 Calendar: an inline month calendar for one date, several dates or a range, with day markers.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Calendar itself does. Titles carry [ShadCalendar-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'cal1';
const widget = createWidgetHarness({
  componentType: 'ShadCalendar',
  handle: 'calendar1',
  id: ID,
  widgetHeight: 320,
  widgetWidth: 400,
  // October 2026 starts on a Thursday: the 10th and 11th are a Saturday and a Sunday.
  defaultProperties: { defaultValue: binding('2026-10-09'), markers: binding('{{[]}}') },
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const grid = () => screen.getAllByRole('grid')[0];
/** The day button reading `n` in the first month shown (outside days excluded: they carry the outside class). */
const day = (n) =>
  within(grid())
    .getAllByText(String(n))
    .map((el) => el.closest('button'))
    .find((b) => b && !b.closest('td').className.includes('outside'));
const clickDay = async (n) => {
  await act(async () => fireEvent.click(day(n)));
};
const range = (start, end) => ({ mode: binding('range'), defaultValue: binding(`{{['${start}', '${end}']}}`) });

describe('UI 2.0 Calendar', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadCalendar-DEF-001] shows the month of defaultValue with that day selected, and exposes the date and month', async () => {
    render();

    expect(await screen.findByText('October 2026')).toBeInTheDocument();
    expect(day(9).closest('td')).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(exposed().value).toBe('2026-10-09'));
    expect(exposed()).toMatchObject({
      selectedDate: '2026-10-09',
      selectedDates: ['2026-10-09'],
      startDate: '',
      endDate: '',
      visibleMonth: '2026-10',
      visibleStart: '2026-10-01',
      visibleEnd: '2026-10-31',
    });
  });

  // The widget's own day button replaced the pack's chevrons with react-day-picker's, filled black: the month arrows
  // vanished on a dark theme.
  test('[ShadCalendar-DEF-002] the month arrows draw the pack chevrons, beside its own day buttons', async () => {
    const { container } = render();

    await screen.findByText('October 2026');
    const arrows = [...container.querySelectorAll('nav button svg')];
    expect(arrows).toHaveLength(2);
    expect(arrows.every((svg) => svg.classList.contains('lucide'))).toBe(true);
    expect(container.querySelector('.rdp-chevron')).toBeNull();
  });

  test('[ShadCalendar-EVT-001] picking a day fires onSelect, and its handler reads the new value', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onSelect', { value: '{{components.calendar1.value}}' }));

    await clickDay(12);

    await waitFor(() => expect(widget.variables().seen).toBe('2026-10-12'));
    expect(day(12).closest('td')).toHaveAttribute('aria-selected', 'true');
  });

  test('[ShadCalendar-PROP-001] markers put their label on the day, and the marked day can be picked', async () => {
    render({ properties: { markers: binding("{{[{ date: '2026-10-12', label: 'Release', color: '#16a34a' }]}}") } });

    const marked = await screen.findByTitle('Release');
    expect(marked).toHaveAccessibleName(expect.stringContaining('Release'));
    await act(async () => fireEvent.click(marked));

    await waitFor(() => expect(exposed().value).toBe('2026-10-12'));
  });

  test('[ShadCalendar-PROP-002] mode multiple adds each picked day to the selection', async () => {
    render({ properties: { mode: binding('multiple') } });

    await clickDay(14);
    await clickDay(12);

    await waitFor(() => expect(exposed().value).toEqual(['2026-10-09', '2026-10-12', '2026-10-14']));
    expect(exposed().selectedDates).toEqual(['2026-10-09', '2026-10-12', '2026-10-14']);
    expect(exposed().selectedDate).toBe('2026-10-09');
  });

  test('[ShadCalendar-PROP-003] mode range exposes both ends, and two picks make a new range', async () => {
    render({ properties: { ...range('2026-10-05', '2026-10-07'), defaultMonth: binding('2026-10-01') } });
    await waitFor(() => expect(exposed()).toMatchObject({ startDate: '2026-10-05', endDate: '2026-10-07' }));
    expect(exposed().selectedDates).toEqual(['2026-10-05', '2026-10-07']);

    await widget.act('clear');
    await clickDay(12);
    await clickDay(15);

    await waitFor(() => expect(exposed().value).toEqual(['2026-10-12', '2026-10-15']));
  });

  test('[ShadCalendar-PROP-004] defaultMonth opens the calendar on that month', async () => {
    render({ properties: { defaultMonth: binding('2027-03-15') } });

    expect(await screen.findByText('March 2027')).toBeInTheDocument();
    await waitFor(() => expect(exposed().visibleMonth).toBe('2027-03'));
  });

  test('[ShadCalendar-EVT-002] the next-month arrow fires onMonthChanged, its handler reading the new visibleMonth', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onMonthChanged', { value: '{{components.calendar1.visibleMonth}}' }));

    await act(async () => fireEvent.click(screen.getByRole('button', { name: /next month/i })));

    await waitFor(() => expect(widget.variables().seen).toBe('2026-11'));
    expect(screen.getByText('November 2026')).toBeInTheDocument();
  });

  test('[ShadCalendar-PROP-005] minDate, maxDate, disabledDates and disabledDays block those days', async () => {
    render({
      properties: {
        minDate: binding('2026-10-05'),
        maxDate: binding('2026-10-25'),
        disabledDates: binding("{{['2026-10-14']}}"),
        disabledDays: binding('{{[0, 6]}}'),
      },
    });

    await screen.findByText('October 2026');
    expect(day(2)).toBeDisabled();
    expect(day(27)).toBeDisabled();
    expect(day(14)).toBeDisabled();
    expect(day(10)).toBeDisabled();
    expect(day(11)).toBeDisabled();
    expect(day(13)).not.toBeDisabled();
    // The month bounds stop the arrows too.
    expect(screen.getByRole('button', { name: /previous month/i })).toHaveAttribute('aria-disabled', 'true');
  });

  test('[ShadCalendar-PROP-006] weekStartsOn monday puts Monday in the first column', async () => {
    const firstWeekday = () => grid().querySelector('thead th');
    render();
    expect(firstWeekday()).toHaveAttribute('aria-label', 'Sunday');

    render({ properties: { weekStartsOn: binding('monday') } });
    await waitFor(() => expect(firstWeekday()).toHaveAttribute('aria-label', 'Monday'));
  });

  test('[ShadCalendar-PROP-007] numberOfMonths shows that many months side by side and widens the visible period', async () => {
    render({ properties: { numberOfMonths: binding('{{2}}') } });

    await waitFor(() => expect(screen.getAllByRole('grid')).toHaveLength(2));
    expect(screen.getByText('November 2026')).toBeInTheDocument();
    expect(exposed()).toMatchObject({ visibleStart: '2026-10-01', visibleEnd: '2026-11-30' });
  });

  test('[ShadCalendar-PROP-008] showOutsideDays off hides the neighbouring months days; fixedWeeks always shows six weeks', async () => {
    render();
    // 28 September and 28 October.
    expect(within(grid()).getAllByText('28')).toHaveLength(2);
    expect(grid().querySelectorAll('tbody tr')).toHaveLength(5);

    render({ properties: { showOutsideDays: binding('{{false}}') } });
    await waitFor(() => expect(within(grid()).getAllByText('28')).toHaveLength(1));

    render({ properties: { fixedWeeks: binding('{{true}}') } });
    await waitFor(() => expect(grid().querySelectorAll('tbody tr')).toHaveLength(6));
  });

  test('[ShadCalendar-PROP-009] fullWidth stretches the calendar across the widget; showBorder off drops its border', async () => {
    const { container } = render();
    const calendar = () => container.querySelector('.tj-shadcn [data-mode]') || grid().closest('div.tw-p-3');
    expect(calendar()).toHaveClass('tw-w-fit', 'tw-border');

    render({ properties: { fullWidth: binding('{{true}}'), showBorder: binding('{{false}}') } });
    await waitFor(() => expect(calendar()).toHaveClass('tw-w-full'));
    expect(calendar()).not.toHaveClass('tw-border');
  });

  test('[ShadCalendar-ACT-001] selectDate picks a date and shows its month; in range mode it takes both ends', async () => {
    render();

    await widget.act('selectDate', '2026-03-02');
    await waitFor(() => expect(exposed()).toMatchObject({ value: '2026-03-02', visibleMonth: '2026-03' }));
    expect(screen.getByText('March 2026')).toBeInTheDocument();

    render({ properties: range('', '') });
    await widget.act('selectDate', '2026-03-02', '2026-03-05');
    await waitFor(() => expect(exposed()).toMatchObject({ startDate: '2026-03-02', endDate: '2026-03-05' }));
  });

  test('[ShadCalendar-ACT-002] setMonth shows a month without picking, and clear empties the selection', async () => {
    render();

    await widget.act('setMonth', '2027-01-15');
    await waitFor(() => expect(exposed().visibleStart).toBe('2027-01-01'));
    expect(screen.getByText('January 2027')).toBeInTheDocument();
    expect(exposed().value).toBe('2026-10-09');

    await widget.act('clear');
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(exposed().selectedDates).toEqual([]);
  });

  test('[ShadCalendar-STY-001] colour and size styles reach the calendar as CSS variables', async () => {
    const { container } = render({ styles: { accentColor: binding('#e11d48'), cellSize: binding('{{40}}') } });

    await screen.findByText('October 2026');
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-primary')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-cell')).toBe('40px');
  });

  // Audit 76: the calendar once kept only the first 2,000 disabled dates, so the 2,001st stayed pickable.
  test('[ShadCalendar-PROP-010] a disabled date after the first two thousand entries cannot be picked', async () => {
    const earlier = Array.from({ length: 2000 }, (_, i) => {
      const d = new Date(2020, 0, 1 + i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    render({ properties: { disabledDates: binding(`{{${JSON.stringify([...earlier, '2026-10-17'])}}}`) } });
    widget.setEvents(setVariableOn(ID, 'onSelect', { key: 'picked', value: '{{components.calendar1.value}}' }));

    expect(day(17)).toBeDisabled();
    await clickDay(17);
    expect(exposed().value).toBe('2026-10-09');
    expect(widget.variables().picked).toBeUndefined();
  });

  // Audit 57: with minDate and maxDate the calendar drew the nearest allowed month, but visibleMonth, visibleStart and
  // visibleEnd still described the month asked for, so a query on them loaded another period than the one shown.
  describe('months limited by minDate and maxDate', () => {
    const LIMITS = {
      defaultMonth: binding('2026-10-01'),
      minDate: binding('2026-10-01'),
      maxDate: binding('2026-12-31'),
    };
    const draw = async (properties = {}) => {
      render({ properties: { ...LIMITS, ...properties } });
      await screen.findAllByRole('grid');
    };

    test('[ShadCalendar-PROP-011] a month before minDate or after maxDate shows and exposes the nearest allowed one', async () => {
      await draw({ defaultMonth: binding('2025-01-01') });
      expect(screen.getByText('October 2026')).toBeInTheDocument();
      expect(exposed().visibleMonth).toBe('2026-10');

      await widget.act('setMonth', '2027-02-01');
      expect(screen.getByText('December 2026')).toBeInTheDocument();
      expect(exposed()).toMatchObject({
        visibleMonth: '2026-12',
        visibleStart: '2026-12-01',
        visibleEnd: '2026-12-31',
      });
    });

    test('[ShadCalendar-PROP-012] two months at maxDate start a month earlier, and say so', async () => {
      await draw({ numberOfMonths: binding('{{2}}') });
      await widget.act('setMonth', '2026-12-01');

      expect(screen.getByText('November 2026')).toBeInTheDocument();
      expect(screen.getByText('December 2026')).toBeInTheDocument();
      expect(exposed()).toMatchObject({
        visibleMonth: '2026-11',
        visibleStart: '2026-11-01',
        visibleEnd: '2026-12-31',
      });
    });

    test('[ShadCalendar-PROP-013] a maxDate moved before the month shown moves both the view and the period', async () => {
      await draw();
      await widget.act('setMonth', '2026-11-01');
      expect(exposed().visibleMonth).toBe('2026-11');

      act(() => widget.setComponentProperty(ID, 'maxDate', '2026-10-31', 'properties'));
      await screen.findByText('October 2026');
      await waitFor(() => expect(exposed().visibleMonth).toBe('2026-10'));
    });
  });

  // Audit round 2: switching mode from single or range to multiple drew the old selection (a Date, or { from, to })
  // in multiple mode, and DayPicker threw 'selected?.some is not a function'; the selection was put in the new shape
  // only by a later effect. It is now in the mode's shape from the first render in that mode.
  describe('changing mode', () => {
    test.each([
      ['single', {}, '2026-10-09'],
      ['range', range('2026-10-09', '2026-10-12'), ['2026-10-09', '2026-10-12']],
    ])('[ShadCalendar-PROP-014] %s to multiple draws and exposes a list of dates', async (from, properties, value) => {
      render({ properties: { mode: binding(from), ...properties } });
      await waitFor(() => expect(exposed().value).toEqual(value));

      act(() => widget.setComponentProperty(ID, 'mode', 'multiple', 'properties'));
      await waitFor(() => expect(Array.isArray(exposed().value)).toBe(true));
      expect(exposed().selectedDates).toEqual(exposed().value);
      await clickDay(20);
      await waitFor(() => expect(exposed().value).toContain('2026-10-20'));
    });

    test('[ShadCalendar-PROP-015] multiple back to single draws one date', async () => {
      render({ properties: { mode: binding('multiple'), defaultValue: binding("{{['2026-10-09', '2026-10-12']}}") } });
      await waitFor(() => expect(exposed().value).toEqual(['2026-10-09', '2026-10-12']));

      act(() => widget.setComponentProperty(ID, 'mode', 'single', 'properties'));
      await waitFor(() => expect(typeof exposed().value).toBe('string'));
      await clickDay(21);
      await waitFor(() => expect(exposed().value).toBe('2026-10-21'));
    });
  });

  // Audit round 2: with 2 or 3 months asked for and minDate and maxDate allowing fewer, only the allowed months were
  // drawn but visibleEnd ran on into months not drawn (October drawn, visibleEnd 31 December).
  test.each([
    [2, '2026-10-31', 1, '2026-10-31'],
    [3, '2026-10-31', 1, '2026-10-31'],
    [3, '2026-11-30', 2, '2026-11-30'],
  ])(
    '[ShadCalendar-PROP-016] %i months asked, maxDate %s: %i drawn, visibleEnd %s',
    async (asked, maxDate, drawn, visibleEnd) => {
      render({
        properties: {
          numberOfMonths: binding(`{{${asked}}}`),
          defaultMonth: binding('2026-10-01'),
          minDate: binding('2026-10-01'),
          maxDate: binding(maxDate),
        },
      });

      await waitFor(() => expect(screen.getAllByRole('grid')).toHaveLength(drawn));
      expect(exposed()).toMatchObject({ visibleMonth: '2026-10', visibleStart: '2026-10-01', visibleEnd });
    }
  );
});
