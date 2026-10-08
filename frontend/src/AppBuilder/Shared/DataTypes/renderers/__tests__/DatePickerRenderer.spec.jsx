import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { DatePickerRenderer } from '../DatePickerRenderer';

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
