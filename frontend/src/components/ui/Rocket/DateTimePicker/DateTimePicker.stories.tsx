import React, { useState } from 'react';
import { DateTimePicker, type DateTimePickerProps } from './DateTimePicker';
import { DatePickerPanel } from './DatePickerPanel';

function Controlled(props: Partial<DateTimePickerProps>) {
  const [value, setValue] = useState<Date | null>(new Date(2026, 10, 18, 15, 30));
  return (
    <div className="tw-w-60">
      <DateTimePicker aria-label="Date" {...props} value={value} onChange={setValue} />
    </div>
  );
}

export default {
  title: 'Rocket/DateTimePicker',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  component: DateTimePicker,
};

export const Date_ = { name: 'date', render: () => <Controlled type="date" isClearable /> };

export const Time = { render: () => <Controlled type="time" /> };

export const DateTime = { name: 'date-time', render: () => <Controlled type="date-time" isClearable /> };

export const MinMax = {
  render: () => <Controlled type="date" minDate={new Date(2026, 10, 5)} maxDate={new Date(2026, 10, 25)} />,
};

export const States = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <Controlled invalid />
      <Controlled disabled />
      <Controlled size="small" />
      <Controlled size="large" />
    </div>
  ),
};

// The three panel types as in the design, open and static.
export const Panels = {
  render: () => (
    <div className="tw-flex tw-items-start tw-gap-6">
      {(['date', 'time', 'date-time'] as const).map((type) => (
        <DatePickerPanel
          key={type}
          type={type}
          value={new Date(2026, 10, 18, 15, 30)}
          today={new Date(2026, 10, 10)}
          onChange={() => undefined}
        />
      ))}
    </div>
  ),
};
