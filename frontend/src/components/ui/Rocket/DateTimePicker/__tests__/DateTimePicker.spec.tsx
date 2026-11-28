import React, { useState } from 'react';
import { render, screen, userEvent, waitFor, within } from '@/test/test-utils';
import { DateTimePicker, type DateTimePickerProps } from '../DateTimePicker';

const VALUE = new Date(2026, 10, 18, 15, 30); // Wed 18 Nov 2026, 03:30 PM

const Controlled = ({
  initial = VALUE,
  onChange = () => undefined,
  ...props
}: Partial<Omit<DateTimePickerProps, 'value'>> & { initial?: Date | null }) => {
  const [value, setValue] = useState<Date | null>(initial);
  return (
    <DateTimePicker
      aria-label="Due"
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
};

const trigger = () => screen.getByRole('button', { name: 'Due' });
const openPicker = async () => {
  await userEvent.click(trigger());
  return screen.findByRole('dialog');
};
const day = (label: string) => screen.getByRole('button', { name: label });
const option = (name: 'Hour' | 'Minute' | 'Period', label: string) =>
  within(screen.getByRole('listbox', { name })).getByRole('option', { name: label });

describe('DateTimePicker | trigger', () => {
  it('shows a placeholder per type when empty, or the one given', () => {
    const { unmount } = render(<Controlled initial={null} type="date" />);
    expect(trigger()).toHaveTextContent('Select date');
    unmount();
    render(<Controlled initial={null} type="date" placeholder="Pick a day" />);
    expect(trigger()).toHaveTextContent('Pick a day');
  });

  it.each([
    ['date', '18/11/2026'],
    ['time', '03:30 PM'],
    ['date-time', '18/11/2026 03:30 PM'],
  ] as const)('formats a %s value', (type, text) => {
    render(<Controlled type={type} />);
    expect(trigger()).toHaveTextContent(text);
  });

  it('uses formatDisplay when given', () => {
    render(<Controlled type="date" formatDisplay={(d) => `day ${d.getDate()}`} />);
    expect(trigger()).toHaveTextContent('day 18');
  });

  it('forwards data-cy and invalid to the trigger', () => {
    render(<Controlled data-cy="due-picker" invalid />);
    expect(trigger()).toHaveAttribute('data-cy', 'due-picker');
    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not open when disabled', async () => {
    render(<Controlled disabled />);
    expect(trigger()).toBeDisabled();
    await userEvent.click(trigger());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('focuses itself on autoFocus', () => {
    render(<Controlled autoFocus />);
    expect(trigger()).toHaveFocus();
  });
});

describe('DateTimePicker | date', () => {
  it('opens on the month of the value, picks a day, reports it and closes', async () => {
    const onChange = jest.fn();
    render(<Controlled type="date" onChange={onChange} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await openPicker();
    expect(screen.getByText('November 2026')).toBeInTheDocument();
    await userEvent.click(day('November 20, 2026'));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 20, 15, 30));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger()).toHaveTextContent('20/11/2026');
  });

  it('does not let a disabled day be picked', async () => {
    const onChange = jest.fn();
    render(<Controlled type="date" onChange={onChange} maxDate={new Date(2026, 10, 19)} />);
    await openPicker();
    await userEvent.click(day('November 20, 2026'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('DateTimePicker | time', () => {
  it('stays open while the user picks hour, minute and period', async () => {
    const onChange = jest.fn();
    render(<Controlled type="time" onChange={onChange} />);
    await openPicker();
    await userEvent.click(option('Hour', '05'));
    await userEvent.click(option('Minute', '45'));
    await userEvent.click(option('Period', 'AM'));
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 10, 18, 5, 45));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(trigger()).toHaveTextContent('05:45 AM');
  });
});

describe('DateTimePicker | date-time', () => {
  it('reports on Apply and closes', async () => {
    const onChange = jest.fn();
    render(<Controlled type="date-time" onChange={onChange} />);
    await openPicker();
    await userEvent.click(day('November 20, 2026'));
    await userEvent.click(option('Minute', '45'));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 20, 15, 45));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes on Cancel without reporting', async () => {
    const onChange = jest.fn();
    render(<Controlled type="date-time" onChange={onChange} />);
    await openPicker();
    await userEvent.click(day('November 20, 2026'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent('18/11/2026 03:30 PM');
  });

  it('starts from the current value again after a cancelled edit', async () => {
    render(<Controlled type="date-time" />);
    await openPicker();
    await userEvent.click(day('November 20, 2026'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await openPicker();
    expect(day('November 18, 2026').closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
  });
});

describe('DateTimePicker | clear', () => {
  it('has no clear button unless isClearable and there is a value', () => {
    const { unmount } = render(<Controlled />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    unmount();
    render(<Controlled isClearable initial={null} />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('clears the value without opening the popover', async () => {
    const onChange = jest.fn();
    render(<Controlled isClearable onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent('Select date');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('has no clear button when disabled', () => {
    render(<Controlled isClearable disabled />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });
});

describe('DateTimePicker | keyboard and focus', () => {
  it('opens with Enter and puts focus on the selected day', async () => {
    render(<Controlled type="date" />);
    trigger().focus();
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('dialog');
    await waitFor(() => expect(day('November 18, 2026')).toHaveFocus());
  });

  it('picks a day with the arrow keys and Enter', async () => {
    const onChange = jest.fn();
    render(<Controlled type="date" onChange={onChange} />);
    trigger().focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(day('November 18, 2026')).toHaveFocus());
    await userEvent.keyboard('{ArrowRight}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 26, 15, 30));
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const onChange = jest.fn();
    render(<Controlled type="date" onChange={onChange} />);
    await openPicker();
    await waitFor(() => expect(day('November 18, 2026')).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger()).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('puts focus on the hour list when opened as a time picker', async () => {
    render(<Controlled type="time" />);
    await openPicker();
    await waitFor(() => expect(option('Hour', '03')).toHaveFocus());
  });

  it('stays open when focus moves outside, as a drawer focus trap would cause', async () => {
    render(
      <>
        <Controlled type="date" />
        <input aria-label="elsewhere" />
      </>
    );
    await openPicker();
    screen.getByLabelText('elsewhere').focus();
    // give Radix a tick to react to the focus move
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('still closes on a pointer press outside', async () => {
    render(
      <>
        <Controlled type="date" />
        <button type="button">elsewhere</button>
      </>
    );
    await openPicker();
    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('puts popoverClassName on the popover content, replacing the default z-index', async () => {
    render(<Controlled popoverClassName="tw-z-[1100]" />);
    const dialog = await openPicker();
    expect(dialog).toHaveClass('tw-z-[1100]');
    expect(dialog).not.toHaveClass('tw-z-50');
  });
});
