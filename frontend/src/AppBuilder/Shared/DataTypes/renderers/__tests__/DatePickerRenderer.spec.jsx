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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import moment from 'moment-timezone';
import { DatePickerRenderer } from '../DatePickerRenderer';

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
