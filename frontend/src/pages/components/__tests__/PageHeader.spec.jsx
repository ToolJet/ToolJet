import React from 'react';
import { render, screen } from '@testing-library/react';

import PageHeader from '../PageHeader';

describe('PageHeader', () => {
  test('renders the title as the page heading', () => {
    render(<PageHeader title="Applications" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Applications' })).toBeInTheDocument();
  });

  test('renders the description and actions only when given', () => {
    const { rerender } = render(<PageHeader title="Applications" />);
    expect(screen.queryByText('Build apps')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add new' })).not.toBeInTheDocument();

    rerender(
      <PageHeader title="Applications" description="Build apps" actions={<button type="button">Add new</button>} />
    );
    expect(screen.getByText('Build apps')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add new' })).toBeInTheDocument();
  });

  test('lets the page override the default side margin', () => {
    render(<PageHeader title="Applications" className="tw-mx-4" />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('tw-mx-4');
    expect(header).not.toHaveClass('tw-mx-[4.375rem]');
  });
});
