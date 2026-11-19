import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import toast from 'react-hot-toast';
import { DatePickerRenderer } from '../DatePickerRenderer';

jest.mock('react-hot-toast', () => ({ __esModule: true, default: { error: jest.fn() } }));

/**
 * [KeyValuePair-BUG-DATE-003] Focusing a date-time field and clicking away without typing must not
 * write a value back.
 *
 * On calendar close the renderer re-parses the focused input text with the date-only
 * `parseDateFormat`, dropping the time, and commits the result through onChange.
 */
test('[KeyValuePair-BUG-DATE-003] opening and closing the calendar without editing does not call onChange', () => {
  const onChange = jest.fn();
  render(
    <DatePickerRenderer
      value="15/05/2022 09:30 AM"
      onChange={onChange}
      isEditable
      isInputFocused
      setIsInputFocused={() => {}}
      dateDisplayFormat="DD/MM/YYYY"
      parseDateFormat="DD/MM/YYYY"
      isTimeChecked
      timeZoneValue="Pacific/Marquesas"
      timeZoneDisplay="Etc/UTC"
      widgetType="KeyValuePair"
    />
  );

  const input = document.querySelector('input.table-column-datepicker-input');
  fireEvent.focus(input);
  fireEvent.click(input);
  fireEvent.mouseDown(document.body);

  expect(onChange).not.toHaveBeenCalled();
});

/**
 * [KeyValuePair-BUG-DATE-004] Typing a disabled date and blurring must be rejected with an alert,
 * matching the calendar UI, which refuses to select disabled dates.
 */
describe('[KeyValuePair-BUG-DATE-004] typed disabled date', () => {
  const setup = (typed) => {
    const onChange = jest.fn();
    render(
      <DatePickerRenderer
        value="01/10/2024"
        onChange={onChange}
        isEditable
        isInputFocused
        setIsInputFocused={() => {}}
        dateDisplayFormat="MM/DD/YYYY"
        parseDateFormat="MM/DD/YYYY"
        disabledDates={['01/15/2024']}
        widgetType="KeyValuePair"
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
