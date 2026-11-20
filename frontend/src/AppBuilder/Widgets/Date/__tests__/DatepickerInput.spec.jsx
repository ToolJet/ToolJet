import React, { createRef } from 'react';
import { render } from '@testing-library/react';
import { DatepickerInput } from '../DatepickerInput';

// react-datepicker returns focus to its custom input through the ref it passes in (for example after Escape).
test('[DatetimePickerV2-KEY-002] the ref react-datepicker passes reaches the input, alongside the widget ref', () => {
  // Break this catches: the custom input ignoring the forwarded ref, so closing the popup with Escape
  // drops focus to the page body instead of the date field.
  const pickerRef = createRef();
  const widgetRef = createRef();
  render(
    <DatepickerInput
      ref={pickerRef}
      dateInputRef={widgetRef}
      value="15/06/2026 10:30"
      setTextInputFocus={() => {}}
      setShowValidationError={() => {}}
      setDisplayTimestamp={() => {}}
      IconElement={() => null}
      isValid
      visibility
    />
  );

  const input = document.querySelector('input.table-column-datepicker-input');
  expect(pickerRef.current).toBe(input);
  expect(widgetRef.current).toBe(input);
});
