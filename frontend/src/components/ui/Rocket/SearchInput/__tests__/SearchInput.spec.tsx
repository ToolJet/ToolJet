import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput, type SearchInputProps } from '../SearchInput';

type ControlledProps = Partial<SearchInputProps> & { initial?: string };

const Controlled = ({ initial = '', onValueChange = () => {}, ...props }: ControlledProps) => {
  const [value, setValue] = useState(initial);
  return (
    <SearchInput
      aria-label="Search tables"
      placeholder="Search tables"
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange(next);
      }}
    />
  );
};

describe('SearchInput', () => {
  it('is a textbox with the given name and placeholder', () => {
    render(<Controlled />);
    expect(screen.getByRole('textbox', { name: 'Search tables' })).toHaveAttribute('placeholder', 'Search tables');
  });

  it('reports what the user types, as typed (no trimming or lowercasing)', async () => {
    const onValueChange = jest.fn();
    render(<Controlled onValueChange={onValueChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'Or');
    expect(onValueChange).toHaveBeenLastCalledWith('Or');
    expect(screen.getByRole('textbox')).toHaveValue('Or');
  });

  it('is controlled by value', () => {
    const { rerender } = render(<SearchInput aria-label="s" value="abc" onValueChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('abc');
    rerender(<SearchInput aria-label="s" value="" onValueChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('shows no clear button while empty', () => {
    render(<Controlled />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('clears the value and keeps focus in the field when the clear button is used', async () => {
    const onValueChange = jest.fn();
    render(<Controlled initial="users" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onValueChange).toHaveBeenLastCalledWith('');
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('lets the caller name the clear button', () => {
    render(<Controlled initial="x" clearLabel="Reset" />);
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('passes extra props (data-cy) to the input', () => {
    render(<Controlled data-cy="tables-search" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('data-cy', 'tables-search');
  });
});
