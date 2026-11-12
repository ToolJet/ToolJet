import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import toast from 'react-hot-toast';
import { DatePickerRenderer } from '../DatePickerRenderer';

jest.mock('react-hot-toast', () => ({ __esModule: true, default: { error: jest.fn() } }));

/**
 * [KeyValuePair-BUG-DATE-005] A typed date-time must be read in the field's display timezone, so it
 * keeps the typed day and time and the disabled-date check judges the day the user actually sees.
 *
 * The typed text was parsed in the browser's timezone and without its time, then displayed in
 * `timeZoneDisplay`. With the browser at +05:30 and the display at UTC, typing 11/10/2026 19:15
 * was committed as 10/10/2026 18:30, a disabled day.
 */
describe('[KeyValuePair-BUG-DATE-005] typed date-time in a display timezone other than the browser', () => {
  const originalTZ = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = 'Asia/Kolkata';
  });

  afterAll(() => {
    if (originalTZ === undefined) delete process.env.TZ;
    else process.env.TZ = originalTZ;
  });

  beforeEach(() => toast.error.mockClear());

  const typeAndBlur = (typed, props = {}) => {
    const onChange = jest.fn();
    render(
      <DatePickerRenderer
        value="08/10/2026 19:15"
        onChange={onChange}
        isEditable
        isInputFocused
        setIsInputFocused={() => {}}
        dateDisplayFormat="DD/MM/YYYY"
        parseDateFormat="DD/MM/YYYY"
        isTimeChecked
        isTwentyFourHrFormatEnabled
        timeZoneValue="UTC"
        timeZoneDisplay="UTC"
        disabledDates={['10/10/2026']}
        widgetType="KeyValuePair"
        {...props}
      />
    );
    const input = document.querySelector('input.table-column-datepicker-input');
    fireEvent.focus(input);
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: typed } });
    fireEvent.mouseDown(document.body);
    return onChange;
  };

  test('commits the typed day and time unchanged when the typed day is allowed', () => {
    const onChange = typeAndBlur('11/10/2026 19:15');

    expect(toast.error).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith('11/10/2026 19:15');
  });

  test('alerts and does not commit when the typed day is disabled', () => {
    const onChange = typeAndBlur('10/10/2026 19:15');

    expect(toast.error).toHaveBeenCalledWith('10/10/2026 is a disabled date. Please enter a valid date');
    expect(onChange).not.toHaveBeenCalled();
  });
});
