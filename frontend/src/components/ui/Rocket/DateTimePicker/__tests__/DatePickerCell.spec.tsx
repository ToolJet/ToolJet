import React from 'react';
import { render, screen, userEvent } from '@/test/test-utils';
import { DatePickerCell } from '../DatePickerCell';

describe('DatePickerCell', () => {
  it('calls onClick', async () => {
    const onClick = jest.fn();
    render(<DatePickerCell onClick={onClick}>18</DatePickerCell>);
    await userEvent.click(screen.getByRole('button', { name: '18' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled, and stays focusable', async () => {
    const onClick = jest.fn();
    render(
      <DatePickerCell disabled onClick={onClick}>
        18
      </DatePickerCell>
    );
    const cell = screen.getByRole('button', { name: '18' });
    await userEvent.click(cell);
    expect(onClick).not.toHaveBeenCalled();
    expect(cell).toHaveAttribute('aria-disabled', 'true');
    expect(cell).not.toBeDisabled();
  });

  it('exposes its variant and selected state', () => {
    const { rerender } = render(<DatePickerCell>18</DatePickerCell>);
    const cell = screen.getByRole('button');
    expect(cell).toHaveAttribute('data-variant', 'default');
    expect(cell).not.toHaveAttribute('data-selected');
    rerender(
      <DatePickerCell variant="outside" selected>
        18
      </DatePickerCell>
    );
    expect(cell).toHaveAttribute('data-variant', 'outside');
    expect(cell).toHaveAttribute('data-selected', 'true');
  });

  it('is a non-submitting button', () => {
    render(<DatePickerCell>18</DatePickerCell>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
