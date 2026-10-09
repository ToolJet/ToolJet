/**
 * Regression for handleDateChange's unix-timestamp unit handling: picking a
 * date via the calendar used to always convert to SECONDS before/after
 * parseDate, regardless of the configured `unixTimestamp` unit. With
 * unixTimestamp="milliseconds" this fed a seconds-scale number into a
 * milliseconds-scale parser, producing a value ~1000x too small.
 *
 * No store involved — DatePickerRenderer is a pure presentational component,
 * so this is a unit spec despite rendering with RTL.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import toast from 'react-hot-toast';
import userEvent from '@testing-library/user-event';
import moment from 'moment-timezone';
import { DatePickerRenderer } from '../DatePickerRenderer';

jest.mock('react-hot-toast', () => ({ __esModule: true, default: { error: jest.fn() } }));

const baseProps = {
  isEditable: true,
  dateDisplayFormat: 'MM/DD/YYYY',
  parseDateFormat: 'MM/DD/YYYY',
  timeZoneValue: null,
  timeZoneDisplay: null,
  disabledDates: [],
  textColor: 'black',
  containerWidth: 100,
  validationError: '',
  setIsInputFocused: () => {},
  isInputFocused: false,
  widgetType: 'Table',
  id: 'date1',
};

async function pickDay(dayLabel) {
  const input = document.querySelector('.table-column-datepicker-input');
  await userEvent.click(input);

  const day = await screen.findByText(dayLabel, {
    selector: '.react-datepicker__day:not(.react-datepicker__day--outside-month)',
  });
  await userEvent.click(day);
}

describe('DatePickerRenderer: unix timestamp unit on date pick', () => {
  test('emits a millisecond epoch, not a seconds value, when unixTimestamp is "milliseconds"', async () => {
    const handleChange = jest.fn();
    // Anchors the calendar's open month/year; the picked day (15) stays within it.
    const initialValue = moment('2026-08-12T00:00:00Z').valueOf();

    render(
      <DatePickerRenderer
        {...baseProps}
        value={initialValue}
        onChange={handleChange}
        parseInUnixTimestamp={true}
        unixTimestamp="milliseconds"
      />
    );

    await pickDay('15');

    expect(handleChange).toHaveBeenCalledTimes(1);
    const emitted = handleChange.mock.calls[0][0];

    // The bug emitted floor(correctSeconds / 1000) — a 6-7 digit number.
    // A correct millisecond epoch for any date in this range is >= 1e12 (13 digits).
    expect(emitted).toBeGreaterThan(1e12);
    expect(moment(emitted).format('YYYY-MM-DD')).toBe('2026-08-15');
  });

  test('still emits a seconds epoch, unchanged, when unixTimestamp is "seconds"', async () => {
    const handleChange = jest.fn();
    const initialValue = moment('2026-08-12T00:00:00Z').unix();

    render(
      <DatePickerRenderer
        {...baseProps}
        value={initialValue}
        onChange={handleChange}
        parseInUnixTimestamp={true}
        unixTimestamp="seconds"
      />
    );

    await pickDay('15');

    expect(handleChange).toHaveBeenCalledTimes(1);
    const emitted = handleChange.mock.calls[0][0];

    // A seconds epoch in this date range is 10 digits — well under 1e12.
    expect(emitted).toBeLessThan(1e12);
    expect(moment.unix(emitted).format('YYYY-MM-DD')).toBe('2026-08-15');
  });
});

describe('[Table-BUG-012] disabledDates clearing', () => {
  test('a date excluded by disabledDates becomes selectable again once disabledDates is cleared, without remounting', async () => {
    // Break this catches: the excludedDates-sync effect only calling setExcludedDates inside
    // `if (disabledDates.length > 0)`, so a prop change to `[]` (or a non-array) never clears
    // the previously-set exclusion list and the stale disabled day stays disabled forever.
    const value = moment('01/01/2026', 'MM/DD/YYYY').toDate();

    const { rerender } = render(<DatePickerRenderer {...baseProps} value={value} disabledDates={['01/01/2026']} />);

    const input = document.querySelector('.table-column-datepicker-input');
    await userEvent.click(input);
    let day = await screen.findByText('1', {
      selector: '.react-datepicker__day:not(.react-datepicker__day--outside-month)',
    });
    expect(day).toHaveAttribute('aria-disabled', 'true');

    rerender(<DatePickerRenderer {...baseProps} value={value} disabledDates={[]} />);

    // Same component instance (no remount) — the popper may have closed on rerender; reopen it.
    await userEvent.click(input);
    day = await screen.findByText('1', {
      selector: '.react-datepicker__day:not(.react-datepicker__day--outside-month)',
    });
    expect(day).toHaveAttribute('aria-disabled', 'false');
  });
});

describe('"Invalid date" after edit when Date format and Parse format differ', () => {
  test('[Table-BUG-016] rerendering with the just-committed value (now in Date format, not Parse format) keeps the correct date instead of showing "Invalid date"', async () => {
    // Mirrors the changeSet round-trip: generateColumnsData.js feeds back the
    // edited row's changeSet value as the next `value` prop, once a cell has
    // been edited. That value is expressed in dateDisplayFormat (what
    // handleDateChange/computeDateString emit), not parseDateFormat (what
    // raw, unedited source data is in) — the two formats are configured
    // independently and are not expected to match.
    const rawValue = '2026-05-15'; // raw source data, in Parse format
    const handleChange = jest.fn();

    const { rerender } = render(
      <DatePickerRenderer
        {...baseProps}
        dateDisplayFormat="DD MMM YYYY"
        parseDateFormat="YYYY-MM-DD"
        value={rawValue}
        onChange={handleChange}
      />
    );

    const input = document.querySelector('.table-column-datepicker-input');
    expect(input).toHaveValue('15 May 2026');

    await pickDay('20');

    expect(handleChange).toHaveBeenCalledTimes(1);
    const committedValue = handleChange.mock.calls[0][0];
    expect(committedValue).toBe('20 May 2026');

    // Parent re-renders the cell with the changeSet's now-committed value.
    rerender(
      <DatePickerRenderer
        {...baseProps}
        dateDisplayFormat="DD MMM YYYY"
        parseDateFormat="YYYY-MM-DD"
        value={committedValue}
        onChange={handleChange}
      />
    );

    expect(input).toHaveValue('20 May 2026');
    expect(input).not.toHaveValue('Invalid date');
  });
});

describe('[Table-BUG] DatePickerRenderer: truncated validation error tooltip', () => {
  let scrollWidthSpy;
  let clientWidthSpy;

  beforeEach(() => {
    scrollWidthSpy = jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(300);
    clientWidthSpy = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(50);
  });

  afterEach(() => {
    scrollWidthSpy.mockRestore();
    clientWidthSpy.mockRestore();
  });

  it('shows the full validation error in a tooltip on hover when the error text is truncated', async () => {
    const validationError = 'Date must fall between the configured minimum and maximum allowed dates';

    render(<DatePickerRenderer {...baseProps} isValid={false} validationError={validationError} />);

    const errorEl = document.querySelector('.invalid-feedback-date');
    expect(errorEl).toBeInTheDocument();

    await userEvent.hover(errorEl);

    const tooltip = await screen.findByText(validationError, { selector: '.overlay-cell-table' });
    expect(tooltip).toBeInTheDocument();
  });
});

/**
 * [Table-COLTYPE-DATEPICKER-005] Typing a disabled date and blurring must be rejected with an alert,
 * matching the calendar UI, which refuses to select disabled dates.
 */
describe('[Table-COLTYPE-DATEPICKER-005] typed disabled date', () => {
  const setup = (typed) => {
    const onChange = jest.fn();
    render(
      <DatePickerRenderer
        {...baseProps}
        value="01/10/2024"
        onChange={onChange}
        isInputFocused
        disabledDates={['01/15/2024']}
      />
    );
    const input = document.querySelector('input.table-column-datepicker-input');
    fireEvent.focus(input);
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: typed } });
    fireEvent.mouseDown(document.body);
    return onChange;
  };

  beforeEach(() => toast.error.mockClear());

  test('alerts and does not commit when the typed date is disabled', () => {
    const onChange = setup('01/15/2024');

    expect(toast.error).toHaveBeenCalledWith('01/15/2024 is a disabled date. Please enter a valid date');
    expect(onChange).not.toHaveBeenCalled();
  });

  test('commits without alert when the typed date is not disabled', () => {
    const onChange = setup('01/16/2024');

    expect(toast.error).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith('01/16/2024');
  });
});
