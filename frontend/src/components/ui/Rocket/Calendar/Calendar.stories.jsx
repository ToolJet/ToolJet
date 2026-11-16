import React, { useState } from 'react';
import { Calendar } from './Calendar';

export default {
  title: 'Rocket/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

const today = new Date();
const daysAgo = (n) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);

// ── Single date ──────────────────────────────────────────────────────────────

export const Single = {
  render: () => {
    const [date, setDate] = useState(today);
    return <Calendar mode="single" selected={date} onSelect={setDate} />;
  },
};

// ── Range, two months, no future days ────────────────────────────────────────

export const Range = {
  render: () => {
    const [range, setRange] = useState({ from: daysAgo(20), to: today });
    return (
      <Calendar
        mode="range"
        resetOnSelect
        numberOfMonths={2}
        defaultMonth={daysAgo(31)}
        endMonth={today}
        disabled={{ after: today }}
        selected={range}
        onSelect={setRange}
      />
    );
  },
};
