import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectionBar from '../SelectionBar';

const setup = (props = {}) => {
  const handlers = {
    onClear: jest.fn(),
    onPin: jest.fn(),
    onUnpin: jest.fn(),
    onDelete: jest.fn().mockResolvedValue(undefined),
  };
  render(
    <SelectionBar
      variant="Global"
      selectedIds={['a', 'b']}
      selectedNames={['ALPHA', 'BRAVO']}
      allPinned={false}
      {...handlers}
      {...props}
    />
  );
  return handlers;
};

describe('SelectionBar', () => {
  it.each([
    ['Global', ['a'], '1 global selected'],
    ['Global', ['a', 'b', 'c'], '3 globals selected'],
    ['Secret', ['a'], '1 secret selected'],
    ['Secret', ['a', 'b'], '2 secrets selected'],
  ])('on the %s tab with %j selected it reads "%s"', (variant, selectedIds, text) => {
    setup({ variant, selectedIds, selectedNames: selectedIds.map((id) => id.toUpperCase()) });
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('offers Pin while any selected row is unpinned', async () => {
    const { onPin } = setup({ allPinned: false });
    expect(screen.queryByRole('button', { name: 'Unpin' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Pin' }));
    expect(onPin).toHaveBeenCalledTimes(1);
  });

  it('offers Unpin when every selected row is pinned', async () => {
    const { onUnpin } = setup({ allPinned: true });
    expect(screen.queryByRole('button', { name: 'Pin' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Unpin' }));
    expect(onUnpin).toHaveBeenCalledTimes(1);
  });

  it('clears the selection', async () => {
    const { onClear } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('confirms in the delete dialog, then deletes every selected id', async () => {
    const { onDelete } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('dialog', { name: 'Delete 2 constants?' })).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Delete constants' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(['a', 'b']));
  });

  it('names the constant when one is selected', async () => {
    setup({ selectedIds: ['a'], selectedNames: ['ALPHA'] });
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('dialog', { name: 'Delete workspace constant?' })).toBeInTheDocument();
  });
});
