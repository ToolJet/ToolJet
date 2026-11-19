import React from 'react';
import { render, screen, userEvent, within } from '@/test/test-utils';
import { DatePickerPanel, type DatePickerPanelProps } from '../DatePickerPanel';

const TODAY = new Date(2026, 10, 10);
const VALUE = new Date(2026, 10, 18, 15, 30);

const setup = (props: Partial<DatePickerPanelProps> = {}) => {
  const onChange = jest.fn();
  const onCancel = jest.fn();
  render(
    <DatePickerPanel type="date" value={VALUE} today={TODAY} onChange={onChange} onCancel={onCancel} {...props} />
  );
  return { onChange, onCancel };
};

const day = (label: string) => screen.getByRole('button', { name: label });
const option = (name: 'Hour' | 'Minute' | 'Period', label: string) =>
  within(screen.getByRole('listbox', { name })).getByRole('option', { name: label });

describe('DatePickerPanel | date', () => {
  it('shows the calendar only, with no footer', () => {
    setup();
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
  });

  it('applies on pick and keeps the time of the current value', async () => {
    const { onChange } = setup();
    await userEvent.click(day('November 20, 2026'));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 20, 15, 30));
  });

  it('picks at midnight when there is no value yet', async () => {
    const { onChange } = setup({ value: null });
    await userEvent.click(day('November 20, 2026'));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 20, 0, 0));
  });

  it('does not clamp a picked day to the time of minDate', async () => {
    const { onChange } = setup({ value: null, minDate: new Date(2026, 10, 20, 10, 0) });
    await userEvent.click(day('November 20, 2026'));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 20, 0, 0));
  });
});

describe('DatePickerPanel | time', () => {
  it('shows the time list only, with no footer', () => {
    setup({ type: 'time' });
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listbox')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
  });

  it('applies on every pick', async () => {
    const { onChange } = setup({ type: 'time' });
    await userEvent.click(option('Hour', '05'));
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 10, 18, 17, 30));
  });
});

describe('DatePickerPanel | date-time', () => {
  it('shows the calendar, the time list and the footer', () => {
    setup({ type: 'date-time' });
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getAllByRole('listbox')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
  });

  it('holds picks back until Apply', async () => {
    const { onChange } = setup({ type: 'date-time' });
    await userEvent.click(day('November 20, 2026'));
    await userEvent.click(option('Minute', '45'));
    expect(onChange).not.toHaveBeenCalled();
    expect(day('November 20, 2026').closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 20, 15, 45));
  });

  it('builds a 24h date from a day, hour, minute and period', async () => {
    const { onChange } = setup({ type: 'date-time', value: null });
    await userEvent.click(day('November 20, 2026'));
    await userEvent.click(option('Hour', '02'));
    await userEvent.click(option('Minute', '15'));
    await userEvent.click(option('Period', 'PM'));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 20, 14, 15));
  });

  it('cannot apply before anything is picked', () => {
    setup({ type: 'date-time', value: null });
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('Cancel reports onCancel and never onChange', async () => {
    const { onChange, onCancel } = setup({ type: 'date-time' });
    await userEvent.click(day('November 20, 2026'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clamps the applied instant into minDate and maxDate', async () => {
    const { onChange } = setup({
      type: 'date-time',
      value: null,
      minDate: new Date(2026, 10, 20, 10, 0),
      maxDate: new Date(2026, 10, 25, 10, 0),
    });
    await userEvent.click(day('November 20, 2026')); // 12:00 AM, before the 10:00 minimum
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 10, 20, 10, 0));
  });
});
