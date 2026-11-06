import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RowActionsMenu from '../RowActionsMenu';

const item = { id: 'c1', name: 'API_URL', type: 'Global', source: 'workspace' };

const setup = (props = {}) => {
  const onTogglePin = jest.fn();
  const onDelete = jest.fn();
  render(
    <RowActionsMenu
      item={item}
      variant="Global"
      isPinned={false}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      {...props}
    />
  );
  return { onTogglePin, onDelete };
};

const openMenu = () => userEvent.click(screen.getByRole('button', { name: 'More actions for API_URL' }));
const labels = async () => (await screen.findAllByRole('menuitem')).map((entry) => entry.textContent);

describe('RowActionsMenu', () => {
  it('offers Pin and Delete constant on the Globals tab', async () => {
    setup();
    await openMenu();
    expect(await labels()).toEqual(['Pin', 'Delete constant']);
  });

  it('offers Delete secret on the Secrets tab', async () => {
    setup({ variant: 'Secret' });
    await openMenu();
    expect(await labels()).toEqual(['Pin', 'Delete secret']);
  });

  it('offers Unpin for a pinned row', async () => {
    setup({ isPinned: true });
    await openMenu();
    expect(await labels()).toEqual(['Unpin', 'Delete constant']);
  });

  it('separates Delete from Pin and styles it as dangerous', async () => {
    setup();
    await openMenu();
    expect(await screen.findByRole('separator')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete constant' }).className).toMatch(/tw-text-text-danger/);
  });

  it('uses the lucide trash icon for Delete, as the delete dialog does', async () => {
    setup();
    await openMenu();
    const delete_ = await screen.findByRole('menuitem', { name: 'Delete constant' });
    expect(delete_.querySelector('svg.lucide-trash')).toBeInTheDocument();
    expect(delete_.querySelector('svg.lucide-trash-2')).toBeNull();
  });

  it('runs the matching callback for each item', async () => {
    const { onTogglePin, onDelete } = setup();
    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Pin' }));
    expect(onTogglePin).toHaveBeenCalledTimes(1);

    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete constant' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders no menu for an .env constant, which can be neither pinned nor deleted', () => {
    setup({ item: { ...item, source: 'env' } });
    expect(screen.queryByRole('button')).toBeNull();
  });
});
