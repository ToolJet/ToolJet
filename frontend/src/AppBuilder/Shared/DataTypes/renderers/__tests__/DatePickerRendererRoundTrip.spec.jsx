import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { DatePickerRenderer } from '../DatePickerRenderer';

const getInput = () => document.querySelector('input.table-column-datepicker-input');

const pickDay = (day) => {
  fireEvent.focus(getInput());
  fireEvent.click(getInput());
  fireEvent.click(
    document.querySelector(
      `.react-datepicker__day--${String(day).padStart(3, '0')}:not(.react-datepicker__day--outside-month)`
    )
  );
};

// Feeds whatever the renderer emits back in as `value`, like the widget's changeSet does.
const Harness = ({ initialValue, onEmit, ...props }) => {
  const [value, setValue] = useState(initialValue);
  return (
    <DatePickerRenderer
      value={value}
      onChange={(next) => {
        onEmit(next);
        setValue(next);
      }}
      isEditable
      isInputFocused={false}
      setIsInputFocused={() => {}}
      widgetType="KeyValuePair"
      {...props}
    />
  );
};

test('[KeyValuePair-BUG-DATE-004] picking a day keeps the field readable when Date format differs from Parse format', () => {
  // Break this catches: the emitted display-format value being re-parsed with Parse format and shown as "Invalid date".
  const onEmit = jest.fn();
  render(
    <Harness initialValue="2026-05-15" onEmit={onEmit} dateDisplayFormat="DD MMM YYYY" parseDateFormat="YYYY-MM-DD" />
  );
  expect(getInput().value).toBe('15 May 2026');

  pickDay(20);

  expect(onEmit).toHaveBeenCalledTimes(1);
  expect(onEmit).toHaveBeenCalledWith('20 May 2026');
  expect(getInput().value).toBe('20 May 2026');
});

test.each([
  ['seconds', 1],
  ['milliseconds', 1000],
])('[KeyValuePair-BUG-DATE-005] picking a day in unix %s mode emits an epoch in that unit', (unit, perSecond) => {
  // Break this catches: the milliseconds unit being converted to seconds, emitting the value divided by 1000.
  const onEmit = jest.fn();
  render(
    <Harness
      initialValue={(new Date(2026, 4, 15).getTime() / 1000) * perSecond}
      onEmit={onEmit}
      dateDisplayFormat="DD/MM/YYYY"
      parseInUnixTimestamp
      unixTimestamp={unit}
    />
  );

  pickDay(21);

  expect(onEmit).toHaveBeenCalledTimes(1);
  expect(onEmit).toHaveBeenCalledWith((new Date(2026, 4, 21).getTime() / 1000) * perSecond);
});

test.each([
  ['unix seconds', { parseInUnixTimestamp: true, unixTimestamp: 'seconds' }, 1779215400],
  ['display format', { parseDateFormat: 'DD/MM/YYYY' }, '15/05/2026'],
])('[KeyValuePair-BUG-DATE-006] clearing the field emits null (%s)', (_mode, props, initialValue) => {
  // Break this catches: a cleared input emitting NaN (unix) or the string "Invalid date", which a timestamptz column rejects.
  const onChange = jest.fn();
  render(
    <DatePickerRenderer
      value={initialValue}
      onChange={onChange}
      isEditable
      isInputFocused
      setIsInputFocused={() => {}}
      dateDisplayFormat="DD/MM/YYYY"
      widgetType="KeyValuePair"
      {...props}
    />
  );

  fireEvent.focus(getInput());
  fireEvent.click(getInput());
  fireEvent.change(getInput(), { target: { value: '' } });
  fireEvent.mouseDown(document.body);

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(null);
});
