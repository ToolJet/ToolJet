import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RowActionsMenu from '../RowActionsMenu';

const item = { id: 'c1', name: 'API_URL', type: 'Global', source: 'workspace' };

const setup = (props = {}) => {
  const onDelete = jest.fn();
  render(<RowActionsMenu item={item} variant="Global" onDelete={onDelete} {...props} />);
  return { onDelete };
};

const openMenu = () => userEvent.click(screen.getByRole('button', { name: 'More actions for API_URL' }));
const labels = async () => (await screen.findAllByRole('menuitem')).map((entry) => entry.textContent);

describe('RowActionsMenu', () => {
  it('offers only Delete constant on the Globals tab', async () => {
    setup();
    await openMenu();
    expect(await labels()).toEqual(['Delete constant']);
  });

  it('offers only Delete secret on the Secrets tab', async () => {
    setup({ variant: 'Secret' });
    await openMenu();
    expect(await labels()).toEqual(['Delete secret']);
  });

  it('runs the delete callback', async () => {
    const { onDelete } = setup();
    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete constant' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows Delete disabled for an .env constant', async () => {
    const { onDelete } = setup({ item: { ...item, source: 'env' } });
    await openMenu();
    const del = await screen.findByRole('menuitem', { name: 'Delete constant' });
    expect(del).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(del);
    expect(onDelete).not.toHaveBeenCalled();
  });
});
