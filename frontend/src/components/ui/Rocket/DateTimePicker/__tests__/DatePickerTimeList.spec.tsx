import React from 'react';
import { render, screen, userEvent, within } from '@/test/test-utils';
import { DatePickerTimeList } from '../DatePickerTimeList';

const VALUE = new Date(2026, 10, 18, 15, 30); // 03:30 PM

const setup = (value: Date | null = VALUE) => {
  const onChange = jest.fn();
  render(<DatePickerTimeList value={value} onChange={onChange} />);
  return { onChange };
};

const column = (name: 'Hour' | 'Minute' | 'Period') => screen.getByRole('listbox', { name });
const option = (name: 'Hour' | 'Minute' | 'Period', label: string) =>
  within(column(name)).getByRole('option', { name: label });

describe('DatePickerTimeList | options', () => {
  it('lists hours 01-12, minutes in steps of five and AM/PM', () => {
    setup();
    expect(
      within(column('Hour'))
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']);
    expect(
      within(column('Minute'))
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual(['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);
    expect(
      within(column('Period'))
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual(['AM', 'PM']);
  });

  it('adds a minute the value already has when it is off the five-minute grid', () => {
    setup(new Date(2026, 10, 18, 10, 7));
    const minutes = within(column('Minute')).getAllByRole('option');
    expect(minutes.map((o) => o.textContent)).toEqual([
      '00',
      '05',
      '07',
      '10',
      '15',
      '20',
      '25',
      '30',
      '35',
      '40',
      '45',
      '50',
      '55',
    ]);
    expect(option('Minute', '07')).toHaveAttribute('aria-selected', 'true');
  });

  it('marks the hour, minute and period of the value as selected', () => {
    setup();
    expect(option('Hour', '03')).toHaveAttribute('aria-selected', 'true');
    expect(option('Hour', '04')).toHaveAttribute('aria-selected', 'false');
    expect(option('Minute', '30')).toHaveAttribute('aria-selected', 'true');
    expect(option('Period', 'PM')).toHaveAttribute('aria-selected', 'true');
    expect(option('Period', 'AM')).toHaveAttribute('aria-selected', 'false');
  });

  it('shows midnight as 12 AM and noon as 12 PM', () => {
    const { unmount } = render(<DatePickerTimeList value={new Date(2026, 10, 18, 0, 0)} onChange={jest.fn()} />);
    expect(option('Hour', '12')).toHaveAttribute('aria-selected', 'true');
    expect(option('Period', 'AM')).toHaveAttribute('aria-selected', 'true');
    unmount();
    render(<DatePickerTimeList value={new Date(2026, 10, 18, 12, 0)} onChange={jest.fn()} />);
    expect(option('Hour', '12')).toHaveAttribute('aria-selected', 'true');
    expect(option('Period', 'PM')).toHaveAttribute('aria-selected', 'true');
  });

  it('selects nothing without a value', () => {
    setup(null);
    expect(screen.queryAllByRole('option', { selected: true })).toHaveLength(0);
  });
});

describe('DatePickerTimeList | picking builds a 24h Date', () => {
  it('keeps the date, minute and period when the hour changes', async () => {
    const { onChange } = setup();
    await userEvent.click(option('Hour', '05'));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 18, 17, 30));
  });

  it('keeps the date, hour and period when the minute changes', async () => {
    const { onChange } = setup();
    await userEvent.click(option('Minute', '45'));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 18, 15, 45));
  });

  it('moves the same 12h time to the other half of the day when the period changes', async () => {
    const { onChange } = setup();
    await userEvent.click(option('Period', 'AM'));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 18, 3, 30));
  });

  it('handles the 12 o clock edges', async () => {
    const noon = jest.fn();
    const { unmount } = render(<DatePickerTimeList value={new Date(2026, 10, 18, 12, 0)} onChange={noon} />);
    await userEvent.click(option('Period', 'AM'));
    expect(noon).toHaveBeenCalledWith(new Date(2026, 10, 18, 0, 0)); // 12 PM -> 12 AM is hour 0
    unmount();

    const midnight = jest.fn();
    render(<DatePickerTimeList value={new Date(2026, 10, 18, 0, 15)} onChange={midnight} />);
    await userEvent.click(option('Period', 'PM'));
    expect(midnight).toHaveBeenCalledWith(new Date(2026, 10, 18, 12, 15)); // 12 AM -> 12 PM is hour 12
  });

  it('starts from 12:00 AM today when nothing is selected yet', async () => {
    const { onChange } = setup(null);
    await userEvent.click(option('Hour', '07'));
    const now = new Date();
    expect(onChange).toHaveBeenCalledWith(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0));
  });
});

describe('DatePickerTimeList | keyboard', () => {
  it('makes the selected option of each column the tab stop', () => {
    setup();
    expect(option('Hour', '03')).toHaveAttribute('tabindex', '0');
    expect(option('Hour', '04')).toHaveAttribute('tabindex', '-1');
    expect(option('Minute', '30')).toHaveAttribute('tabindex', '0');
    expect(option('Period', 'PM')).toHaveAttribute('tabindex', '0');
  });

  it('falls back to the first option as tab stop when nothing is selected', () => {
    setup(null);
    expect(option('Hour', '01')).toHaveAttribute('tabindex', '0');
  });

  it('moves focus within a column with the arrow keys, and selects with Enter', async () => {
    const { onChange } = setup();
    option('Hour', '03').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(option('Hour', '04')).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(option('Hour', '02')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 18, 14, 30));
  });

  it('jumps to the first and last option with Home and End', async () => {
    setup();
    option('Minute', '30').focus();
    await userEvent.keyboard('{End}');
    expect(option('Minute', '55')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(option('Minute', '00')).toHaveFocus();
  });

  it('reaches every column with Tab', async () => {
    setup();
    option('Hour', '03').focus();
    await userEvent.tab();
    expect(option('Minute', '30')).toHaveFocus();
    await userEvent.tab();
    expect(option('Period', 'PM')).toHaveFocus();
  });
});

describe('DatePickerTimeList | scrolling', () => {
  afterEach(() => jest.restoreAllMocks());

  it('scrolls the selected option into view when it mounts', () => {
    jest.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
      return this.getAttribute('aria-selected') === 'true' ? 300 : 0;
    });
    jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(224);
    jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(28);
    setup();
    // centred: 300 - (224 - 28) / 2
    expect(column('Hour').scrollTop).toBe(202);
  });
});
