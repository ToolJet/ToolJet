import React from 'react';
import { render, screen, userEvent, within } from '@/test/test-utils';
import { DatePickerCalendar, type DatePickerCalendarProps } from '../DatePickerCalendar';

const TODAY = new Date(2026, 10, 10);
const VALUE = new Date(2026, 10, 18, 15, 30);

const setup = (props: Partial<DatePickerCalendarProps> = {}) => {
  const onSelect = jest.fn();
  render(<DatePickerCalendar value={VALUE} today={TODAY} onSelect={onSelect} {...props} />);
  return { onSelect, grid: screen.getByRole('grid') };
};

const day = (label: string) => screen.getByRole('button', { name: label });

describe('DatePickerCalendar | layout', () => {
  it('shows the month of the value in the header', () => {
    setup();
    expect(screen.getByText('November 2026')).toBeInTheDocument();
  });

  it('falls back to the month of today when there is no value', () => {
    setup({ value: null, today: new Date(2026, 2, 3) });
    expect(screen.getByText('March 2026')).toBeInTheDocument();
  });

  it('always renders six weeks, even for a month that fits in four', () => {
    setup({ value: new Date(2026, 1, 14), today: new Date(2026, 1, 1) });
    const grid = screen.getByRole('grid');
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(42);
    // header row + six weeks
    expect(within(grid).getAllByRole('row')).toHaveLength(7);
  });

  it('starts the grid on Sunday by default and fills the edges with the neighbouring months', () => {
    const { grid } = setup();
    const cells = within(grid).getAllByRole('gridcell');
    expect(within(cells[0]).getByRole('button')).toHaveAccessibleName('November 1, 2026');
    expect(within(cells[41]).getByRole('button')).toHaveAccessibleName('December 12, 2026');
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Su',
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa',
    ]);
  });

  it('honours weekStartsOn', () => {
    const { grid } = setup({ weekStartsOn: 1 });
    const first = within(within(grid).getAllByRole('gridcell')[0]).getByRole('button');
    expect(first).toHaveAccessibleName('October 26, 2026');
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('Mo');
  });

  it('marks today, the selected day and days of other months', () => {
    setup();
    expect(day('November 10, 2026')).toHaveAttribute('aria-current', 'date');
    expect(day('November 10, 2026')).toHaveAttribute('data-variant', 'today');
    expect(day('November 18, 2026').closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
    expect(day('November 19, 2026').closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'false');
    expect(day('December 1, 2026')).toHaveAttribute('data-variant', 'outside');
    expect(day('November 12, 2026')).toHaveAttribute('data-variant', 'default');
  });
});

describe('DatePickerCalendar | selecting', () => {
  it('calls onSelect with the picked day at local midnight', async () => {
    const { onSelect } = setup();
    await userEvent.click(day('November 20, 2026'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(new Date(2026, 10, 20));
  });

  it('lets the user pick a day of the neighbouring month and moves the view there', async () => {
    const { onSelect } = setup();
    await userEvent.click(day('December 2, 2026'));
    expect(onSelect).toHaveBeenCalledWith(new Date(2026, 11, 2));
    expect(screen.getByText('December 2026')).toBeInTheDocument();
  });

  it('disables days before minDate and after maxDate, bounds included', async () => {
    const { onSelect } = setup({ minDate: new Date(2026, 10, 5, 10, 0), maxDate: new Date(2026, 10, 25) });
    expect(day('November 4, 2026')).toHaveAttribute('aria-disabled', 'true');
    expect(day('November 26, 2026')).toHaveAttribute('aria-disabled', 'true');
    expect(day('November 5, 2026')).not.toHaveAttribute('aria-disabled', 'true');
    expect(day('November 25, 2026')).not.toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(day('November 4, 2026'));
    await userEvent.click(day('November 26, 2026'));
    expect(onSelect).not.toHaveBeenCalled();
    await userEvent.click(day('November 5, 2026'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe('DatePickerCalendar | month navigation', () => {
  it('moves a month with the header buttons', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('December 2026')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('October 2026')).toBeInTheDocument();
  });
});

describe('DatePickerCalendar | keyboard', () => {
  it('makes only the focused day tabbable, starting on the selected day', () => {
    setup();
    expect(day('November 18, 2026')).toHaveAttribute('tabindex', '0');
    expect(day('November 19, 2026')).toHaveAttribute('tabindex', '-1');
  });

  it('moves the focused day with the arrow keys', async () => {
    setup();
    day('November 18, 2026').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(day('November 19, 2026')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(day('November 26, 2026')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(day('November 25, 2026')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(day('November 18, 2026')).toHaveFocus();
  });

  it('changes month when an arrow key crosses the month edge', async () => {
    setup({ value: new Date(2026, 10, 30) });
    day('November 30, 2026').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByText('December 2026')).toBeInTheDocument();
    expect(day('December 1, 2026')).toHaveFocus();
  });

  it('changes month with PageDown and PageUp, clamping the day', async () => {
    setup({ value: new Date(2026, 0, 31) });
    day('January 31, 2026').focus();
    await userEvent.keyboard('{PageDown}');
    expect(screen.getByText('February 2026')).toBeInTheDocument();
    expect(day('February 28, 2026')).toHaveFocus();
    await userEvent.keyboard('{PageUp}{PageUp}');
    expect(screen.getByText('December 2025')).toBeInTheDocument();
  });

  it('selects the focused day with Enter', async () => {
    const { onSelect } = setup();
    day('November 18, 2026').focus();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(onSelect).toHaveBeenCalledWith(new Date(2026, 10, 19));
  });

  it('can focus a disabled day but not select it', async () => {
    const { onSelect } = setup({ maxDate: new Date(2026, 10, 18) });
    day('November 18, 2026').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(day('November 19, 2026')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).not.toHaveBeenCalled();
  });
});
