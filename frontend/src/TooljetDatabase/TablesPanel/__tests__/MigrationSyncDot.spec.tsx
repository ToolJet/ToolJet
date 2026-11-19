// The dot at the end of a table row (Figma list item, trailing dot): orange when development is ahead of staging,
// green when development and staging are ahead of production, nothing when the table is fully migrated.
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MigrationSyncDot } from '../MigrationSyncDot';

describe('MigrationSyncDot', () => {
  test('should show nothing for a table that is fully migrated', () => {
    const { container } = render(<MigrationSyncDot sync={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  test('should show nothing when the status is unknown', () => {
    const { container } = render(<MigrationSyncDot sync={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  test('should show an orange dot for changes pending from development', () => {
    render(<MigrationSyncDot sync="pending_in_development" />);

    const dot = screen.getByRole('img', { name: 'Pending in dev' });
    expect(dot).toHaveAttribute('data-cy', 'sync-dot-warning');
    expect(dot.querySelector('.tw-bg-background-warning-strong')).toBeInTheDocument();
  });

  test('should show a green dot for changes pending from staging', () => {
    render(<MigrationSyncDot sync="pending_in_staging" />);

    const dot = screen.getByRole('img', { name: 'Pending in staging' });
    expect(dot).toHaveAttribute('data-cy', 'sync-dot-success');
    expect(dot.querySelector('.tw-bg-background-success-strong')).toBeInTheDocument();
  });

  test.each([
    [
      'pending_in_development',
      'Pending in dev',
      'Changes in Development are not yet applied to Staging or Production.',
    ],
    [
      'pending_in_staging',
      'Pending in staging',
      'Changes in Development and Staging are not yet applied to Production.',
    ],
  ] as const)('should explain a %s dot in a tooltip on hover', async (sync, title, body) => {
    render(<MigrationSyncDot sync={sync} />);

    await userEvent.hover(screen.getByRole('img', { name: title }));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent(title);
    expect(tooltip).toHaveTextContent(body);
  });

  test('should colour the tooltip icon with the accent blue', async () => {
    render(<MigrationSyncDot sync="pending_in_staging" />);

    await userEvent.hover(screen.getByRole('img', { name: 'Pending in staging' }));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.querySelector('svg.lucide-info')).toHaveClass('tw-text-icon-accent');
  });

  test('should give the tooltip a hover target much bigger than the 6px dot, the height of a row', () => {
    render(<MigrationSyncDot sync="pending_in_development" />);

    // The target grows with padding and cancels it with negative margins, so the dot does not move.
    const target = screen.getByRole('img', { name: 'Pending in dev' });
    expect(target).toHaveClass('tw-h-8', 'tw-w-6');
    expect(target).toHaveClass('-tw-mx-1', '-tw-my-[7px]');
  });

  test('should show no tooltip until the dot is hovered', () => {
    render(<MigrationSyncDot sync="pending_in_development" />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
