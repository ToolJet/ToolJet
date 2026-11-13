import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppliedFilters, FilterMenu, SortMenu } from '..';

const OPTIONS = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
];

const GROUPS = [
  {
    id: 'size',
    label: 'Size',
    options: [
      { value: 'small', label: 'Smallest' },
      { value: 'large', label: 'Largest' },
    ],
  },
  { id: 'age', label: 'Age', options: [{ value: 'new', label: 'Newest' }] },
];

describe('FilterMenu', () => {
  const setup = (value = ['red', 'green', 'blue']) => {
    const onChange = jest.fn();
    render(<FilterMenu label="Colour" options={OPTIONS} value={value} onChange={onChange} />);
    return onChange;
  };

  it('lists the options under the given heading and marks the checked ones', async () => {
    setup(['green']);
    await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
    expect(await screen.findByText('Colour')).toBeInTheDocument();
    const checked = screen.getAllByRole('menuitemcheckbox').map((item) => item.getAttribute('aria-checked'));
    expect(checked).toEqual(['false', 'true', 'false']);
  });

  it('reports a selection in the order of the options, not the order of clicks', async () => {
    const onChange = setup(['blue']);
    await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Red' }));
    expect(onChange).toHaveBeenCalledWith(['red', 'blue']);
  });

  it('keeps the last checked option', async () => {
    const onChange = setup(['green']);
    await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Green' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Clear all checks every option, and does nothing when all are checked', async () => {
    const onChange = setup(['red']);
    await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Clear all' }));
    expect(onChange).toHaveBeenCalledWith(['red', 'green', 'blue']);
  });

  it('narrows the options as the user types', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
    await userEvent.type(await screen.findByRole('textbox', { name: 'Filter by' }), 'gre');
    expect(screen.getAllByRole('menuitemcheckbox').map((item) => item.textContent)).toEqual(['Green']);
  });
});

describe('AppliedFilters', () => {
  it('shows nothing while every option is checked', () => {
    render(<AppliedFilters options={OPTIONS} value={['red', 'green', 'blue']} onChange={jest.fn()} />);
    expect(screen.queryByTestId('applied-filters')).not.toBeInTheDocument();
  });

  it('shows a chip per checked option; removing one keeps the others', async () => {
    const onChange = jest.fn();
    render(<AppliedFilters options={OPTIONS} value={['red', 'blue']} onChange={onChange} />);
    expect(within(screen.getByTestId('applied-filters')).getByText('Blue')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove Red filter' }));
    expect(onChange).toHaveBeenCalledWith(['blue']);
  });

  it('removing the last chip checks every option again', async () => {
    const onChange = jest.fn();
    render(<AppliedFilters options={OPTIONS} value={['green']} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Green filter' }));
    expect(onChange).toHaveBeenCalledWith(['red', 'green', 'blue']);
  });
});

describe('SortMenu', () => {
  const setup = (value = 'new') => {
    const onChange = jest.fn();
    render(<SortMenu groups={GROUPS} value={value} defaultValue="new" onChange={onChange} />);
    return onChange;
  };
  const open = () => userEvent.click(screen.getByRole('button', { name: 'Sort' }));

  it('lists every group and marks the current option', async () => {
    setup('large');
    await open();
    const options = await screen.findAllByRole('menuitemcheckbox');
    expect(options.map((item) => item.textContent)).toEqual(['Smallest', 'Largest', 'Newest']);
    expect(options.map((item) => item.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
  });

  it('reports the chosen option and ignores a click on the current one', async () => {
    const onChange = setup('small');
    await open();
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Smallest' }));
    expect(onChange).not.toHaveBeenCalled();
    // Choosing an option closes the menu.
    await open();
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Largest' }));
    expect(onChange).toHaveBeenCalledWith('large');
  });

  it('Reset goes back to the given default', async () => {
    const onChange = setup('large');
    await open();
    await userEvent.click(await screen.findByRole('button', { name: 'Reset' }));
    expect(onChange).toHaveBeenCalledWith('new');
  });

  it('keeps every option of a group whose name matches', async () => {
    setup();
    await open();
    await userEvent.type(await screen.findByRole('textbox', { name: 'Sort by' }), 'size');
    expect(screen.getAllByRole('menuitemcheckbox').map((item) => item.textContent)).toEqual(['Smallest', 'Largest']);
  });
});
