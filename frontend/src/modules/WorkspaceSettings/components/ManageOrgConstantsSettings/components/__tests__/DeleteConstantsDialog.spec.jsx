import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteConstantsDialog from '../DeleteConstantsDialog';

const setup = (props = {}) => {
  const onOpenChange = jest.fn();
  const onConfirm = jest.fn().mockResolvedValue(undefined);
  render(
    <DeleteConstantsDialog
      open
      constants={['STRIPE_SECRET_KEY']}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      {...props}
    />
  );
  return { onOpenChange, onConfirm };
};

describe('DeleteConstantsDialog', () => {
  it('uses the lucide trash icon, as in the design', () => {
    setup();
    const icon = screen.getByRole('dialog').querySelector('svg.lucide-trash');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('width', '40');
  });

  it('names the constant for a single delete', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Delete workspace constant?' })).toBeInTheDocument();
    expect(screen.getByText(/STRIPE_SECRET_KEY/)).toBeInTheDocument();
    expect(
      screen.getByText(/permanently deleted from every environment, do you want to continue\?/)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete constant' })).toBeInTheDocument();
  });

  it('shows the count for a bulk delete', () => {
    setup({ constants: ['A', 'B', 'C'] });
    expect(screen.getByRole('dialog', { name: 'Delete 3 constants?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete constants' })).toBeInTheDocument();
  });

  it('treats exactly two constants as a bulk delete', () => {
    setup({ constants: ['A', 'B'] });
    expect(screen.getByRole('dialog', { name: 'Delete 2 constants?' })).toBeInTheDocument();
  });

  it('closes after a successful confirm', async () => {
    const { onConfirm, onOpenChange } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Delete constant' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('disables both buttons while the delete is pending', async () => {
    let resolve;
    const onConfirm = jest.fn(() => new Promise((r) => (resolve = r)));
    setup({ onConfirm });
    await userEvent.click(screen.getByRole('button', { name: 'Delete constant' }));
    expect(screen.getByRole('button', { name: 'Delete constant' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    resolve();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled());
  });

  it('stays open and shows the error when the delete fails', async () => {
    const onConfirm = jest.fn().mockRejectedValue({ error: 'Delete failed on the server' });
    const { onOpenChange } = setup({ onConfirm });
    await userEvent.click(screen.getByRole('button', { name: 'Delete constant' }));
    expect(await screen.findByText('Delete failed on the server')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole('button', { name: 'Delete constant' })).not.toBeDisabled();
  });

  it('falls back to a generic message when the failure carries none', async () => {
    const onConfirm = jest.fn().mockRejectedValue({});
    setup({ onConfirm });
    await userEvent.click(screen.getByRole('button', { name: 'Delete constant' }));
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('closes on Cancel without confirming', async () => {
    const { onConfirm, onOpenChange } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
