import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConstantsPageHeader from '../ConstantsPageHeader';

describe('ConstantsPageHeader', () => {
  it('shows the page title as the heading', () => {
    render(<ConstantsPageHeader />);
    expect(screen.getByRole('heading', { level: 1, name: 'Workspace constants' })).toBeInTheDocument();
  });

  it('links "Learn more" to the constants docs in a new tab', () => {
    render(<ConstantsPageHeader />);
    const link = screen.getByRole('link', { name: 'Learn more' });
    expect(link).toHaveAttribute('href', 'https://docs.tooljet.com/docs/security/constants/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('explains the difference between secrets and global constants', () => {
    render(<ConstantsPageHeader />);
    expect(screen.getByText('Secrets')).toBeInTheDocument();
    expect(screen.getByText('Masked. Data sources and queries only')).toBeInTheDocument();
    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.getByText('Plain. Use anywhere')).toBeInTheDocument();
  });

  it('calls onCreate when "Create constant" is clicked', async () => {
    const onCreate = jest.fn();
    render(<ConstantsPageHeader onCreate={onCreate} />);
    await userEvent.click(screen.getByRole('button', { name: 'Create constant' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('omits the create button when the user cannot create', () => {
    render(<ConstantsPageHeader />);
    expect(screen.queryByRole('button', { name: 'Create constant' })).not.toBeInTheDocument();
  });
});
