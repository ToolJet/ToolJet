import React from 'react';
import { render, screen, userEvent, within } from '@/test/test-utils';
import { TimestampField } from '../TimestampField';

const STORED = '2026-11-17T08:56:00.000Z';

const setup = (value: string | null = STORED) => {
  const onChange = jest.fn();
  render(<TimestampField value={value} onChange={onChange} timezone="UTC" data-cy="ts" />);
  return onChange;
};
const openPicker = () => userEvent.click(screen.getByRole('button', { name: 'Pick date and time' }));

describe('TimestampField', () => {
  it('shows the stored value in the column time zone, read-only', () => {
    setup();
    const input = screen.getByRole('textbox', { name: 'Timestamp' });
    expect(input).toHaveValue('17/11/2026, 08:56 AM');
    expect(input).toHaveAttribute('readonly');
  });

  it('shows the placeholder while empty', () => {
    setup(null);
    expect(screen.getByRole('textbox', { name: 'Timestamp' })).toHaveValue('');
  });

  it('opens the picker from the calendar button and from the field', async () => {
    setup();
    await openPicker();
    expect(screen.getByTestId('cell-editor-timestamp')).toBeInTheDocument();
  });

  it('sends nothing until Apply, then the picked day with the same time', async () => {
    const onChange = setup();
    await openPicker();

    await userEvent.click(screen.getByRole('button', { name: /24/ }));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(new Date(onChange.mock.calls[0][0]).toISOString()).toBe('2026-11-24T08:56:00.000Z');
    expect(screen.queryByTestId('cell-editor-timestamp')).not.toBeInTheDocument();
  });

  it('drops the draft on Cancel', async () => {
    const onChange = setup();
    await openPicker();
    await userEvent.click(screen.getByRole('button', { name: /24/ }));

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId('cell-editor-timestamp')).not.toBeInTheDocument();
  });

  it('clears the value with Clear, only when there is one', async () => {
    const onChange = setup();
    await openPicker();
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('offers no Clear for an empty field, and keeps Apply off until a day is picked', async () => {
    setup(null);
    await openPicker();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    const apply = screen.getByRole('button', { name: 'Apply' });
    expect(apply).toBeDisabled();

    await userEvent.click(within(screen.getByTestId('cell-editor-timestamp')).getByRole('button', { name: /17/ }));
    expect(apply).toBeEnabled();
  });
});
