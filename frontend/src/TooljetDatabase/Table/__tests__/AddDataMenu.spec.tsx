import React from 'react';
import { render, screen, userEvent } from '@/test/test-utils';
import { AddDataMenu } from '../AddDataMenu';

function setup(hideSeedDataOption = false) {
  const handlers = { onAddRow: jest.fn(), onBulkUpload: jest.fn(), onSeedData: jest.fn() };
  render(<AddDataMenu hideSeedDataOption={hideSeedDataOption} {...handlers} />);
  return handlers;
}

describe('AddDataMenu', () => {
  it('opens a menu of add row, bulk upload and seed data from the Add data button', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Add data' }));

    expect(await screen.findByRole('menuitem', { name: 'Add new row' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Bulk upload data' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Seed data with SQL' })).toBeInTheDocument();
  });

  it.each([
    ['Add new row', 'onAddRow'],
    ['Bulk upload data', 'onBulkUpload'],
    ['Seed data with SQL', 'onSeedData'],
  ] as const)('%s calls %s', async (name, handler) => {
    const handlers = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Add data' }));
    await userEvent.click(await screen.findByRole('menuitem', { name }));

    expect(handlers[handler]).toHaveBeenCalledTimes(1);
  });

  it('leaves out seed data when SQL mode is off', async () => {
    setup(true);

    await userEvent.click(screen.getByRole('button', { name: 'Add data' }));

    expect(await screen.findByRole('menuitem', { name: 'Add new row' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Seed data with SQL' })).not.toBeInTheDocument();
  });
});
