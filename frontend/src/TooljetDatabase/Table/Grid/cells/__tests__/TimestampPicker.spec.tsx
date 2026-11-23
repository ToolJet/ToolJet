import React from 'react';
import { render, screen, userEvent } from '@/test/test-utils';
import { TimestampPicker } from '../TimestampPicker';

// Wall-clock dates: Tue 17 Nov 2026, 08:56 AM.
const VALUE = new Date(2026, 10, 17, 8, 56);

const setup = (value: Date | null = VALUE) => {
  const onChange = jest.fn();
  render(<TimestampPicker value={value} onChange={onChange} utcOffset="UTC +5:30" />);
  return onChange;
};
const lastChange = (onChange: jest.Mock): Date => onChange.mock.calls[onChange.mock.calls.length - 1][0];

describe('TimestampPicker', () => {
  it('shows the time as two digits, the period and the zone offset', () => {
    setup();
    expect(screen.getByRole('textbox', { name: 'Hour' })).toHaveValue('08');
    expect(screen.getByRole('textbox', { name: 'Minute' })).toHaveValue('56');
    expect(screen.getByRole('radio', { name: 'AM' })).toBeChecked();
    expect(screen.getByText('UTC +5:30')).toBeInTheDocument();
  });

  it('steps the hour and wraps from 12 to 1 without touching the period', async () => {
    const onChange = setup(new Date(2026, 10, 17, 12, 0));
    await userEvent.click(screen.getByRole('button', { name: 'Increase hour' }));
    // 12:00 PM -> 1:00 PM
    expect(lastChange(onChange).getHours()).toBe(13);
  });

  it('steps the minute and wraps from 59 to 0 without carrying into the hour', async () => {
    const onChange = setup(new Date(2026, 10, 17, 8, 59));
    await userEvent.click(screen.getByRole('button', { name: 'Increase minute' }));
    const next = lastChange(onChange);
    expect([next.getHours(), next.getMinutes()]).toEqual([8, 0]);
  });

  it('steps with the arrow keys', async () => {
    const onChange = setup();
    await userEvent.type(screen.getByRole('textbox', { name: 'Minute' }), '{ArrowDown}');
    expect(lastChange(onChange).getMinutes()).toBe(55);
  });

  it('commits a typed minute when the field is left, clamped to 59', async () => {
    const onChange = setup();
    const minute = screen.getByRole('textbox', { name: 'Minute' });
    await userEvent.clear(minute);
    await userEvent.type(minute, '99');
    await userEvent.tab();
    expect(lastChange(onChange).getMinutes()).toBe(59);
  });

  it('switches to PM by adding twelve hours', async () => {
    const onChange = setup();
    await userEvent.click(screen.getByRole('radio', { name: 'PM' }));
    expect(lastChange(onChange).getHours()).toBe(20);
  });

  it('keeps the time when another day is picked', async () => {
    const onChange = setup();
    await userEvent.click(screen.getByRole('button', { name: /24/ }));
    const next = lastChange(onChange);
    expect([next.getDate(), next.getHours(), next.getMinutes()]).toEqual([24, 8, 56]);
  });

  it('starts from the current time when nothing is chosen, and the first change makes it a value', async () => {
    const onChange = setup(null);
    await userEvent.click(screen.getByRole('button', { name: 'Increase minute' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
