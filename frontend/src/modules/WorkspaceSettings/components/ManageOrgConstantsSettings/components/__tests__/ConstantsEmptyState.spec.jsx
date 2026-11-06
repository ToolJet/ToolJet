import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConstantsEmptyState from '../ConstantsEmptyState';

describe('ConstantsEmptyState', () => {
  it('explains the Secrets tab and offers to create a secret', async () => {
    const onCreate = jest.fn();
    render(<ConstantsEmptyState variant="secret" onCreate={onCreate} />);
    expect(screen.getByText('No secrets yet')).toBeInTheDocument();
    expect(
      screen.getByText('Secrets are encrypted and hidden. Use them in data sources with {{secrets.name}}.')
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /create secret/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('explains the Globals tab and offers to create a global constant', async () => {
    const onCreate = jest.fn();
    render(<ConstantsEmptyState variant="global" onCreate={onCreate} />);
    expect(screen.getByText('No global constants yet')).toBeInTheDocument();
    expect(
      screen.getByText('Global constants hold plain values you can reuse in any app with {{constants.name}}.')
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /create global constant/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('omits the create button when the user cannot create', () => {
    render(<ConstantsEmptyState variant="global" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the search query and no create button for the search variant', () => {
    render(<ConstantsEmptyState variant="search" query="stripe" onCreate={jest.fn()} />);
    expect(screen.getByText('No constants found')).toBeInTheDocument();
    expect(screen.getByText(/stripe/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
