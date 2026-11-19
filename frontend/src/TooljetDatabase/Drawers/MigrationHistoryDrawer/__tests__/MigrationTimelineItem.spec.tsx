// One row of the migration history timeline (Figma Migration history item): rest, latest, here, unapplied, expanded.
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MigrationTimelineItem, type MigrationTimelineItemProps } from '../MigrationTimelineItem';

const BASE: MigrationTimelineItemProps = {
  number: '0005',
  title: 'Added the published_date column',
  description: null,
  date: 'Aug 12, 2026 · 4:48 PM',
  sql: 'ALTER TABLE releases ADD COLUMN published_date date;',
  applied: true,
  latest: false,
  hereLabel: null,
  expanded: false,
  onToggleSql: () => {},
};

const setup = (props: Partial<MigrationTimelineItemProps> = {}) => {
  const onToggleSql = jest.fn();
  const view = render(<MigrationTimelineItem {...BASE} onToggleSql={onToggleSql} {...props} />);
  return { onToggleSql, ...view };
};

const row = () => screen.getByTestId('migration-timeline-item');

describe('MigrationTimelineItem', () => {
  test('should show the number, title and date', () => {
    setup();

    expect(screen.getByText('0005')).toBeInTheDocument();
    expect(screen.getByText('Added the published_date column')).toBeInTheDocument();
    expect(screen.getByText('Aug 12, 2026 · 4:48 PM')).toBeInTheDocument();
  });

  test('should show the description under the title when the migration has one', () => {
    setup({ description: 'Recorded from the existing table. No SQL was run.' });

    expect(screen.getByText('Recorded from the existing table. No SQL was run.')).toBeInTheDocument();
  });

  test('should show no description line when the migration has none', () => {
    setup();

    expect(screen.queryByTestId('migration-timeline-item-description')).not.toBeInTheDocument();
  });

  test('should be in the rest state with no tag by default', () => {
    setup();

    expect(row()).toHaveAttribute('data-state', 'rest');
    expect(screen.queryByText('Latest')).not.toBeInTheDocument();
  });

  test('should tag the latest migration', () => {
    setup({ latest: true });

    expect(row()).toHaveAttribute('data-state', 'latest');
    expect(screen.getByText('Latest')).toBeInTheDocument();
  });

  test('should name the environment that is at this migration', () => {
    setup({ hereLabel: 'Staging is here' });

    expect(row()).toHaveAttribute('data-state', 'here');
    expect(screen.getByText('Staging is here')).toBeInTheDocument();
  });

  test('should keep the latest tag on a migration the environment has not applied, in the unapplied state', () => {
    setup({ applied: false, latest: true });

    expect(row()).toHaveAttribute('data-state', 'unapplied');
    expect(screen.getByText('Latest')).toBeInTheDocument();
  });

  test('should show both tags when the environment is at the latest migration of a shorter chain', () => {
    setup({ latest: true, hereLabel: 'Staging is here' });

    expect(screen.getByText('Latest')).toBeInTheDocument();
    expect(screen.getByText('Staging is here')).toBeInTheDocument();
  });

  describe('View SQL', () => {
    test('should hide the SQL until it is opened', () => {
      setup();

      expect(screen.getByRole('button', { name: 'View SQL' })).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText(/ALTER TABLE releases/)).not.toBeInTheDocument();
    });

    test('should ask to toggle when the button is pressed', async () => {
      const { onToggleSql } = setup();

      await userEvent.click(screen.getByRole('button', { name: 'View SQL' }));

      expect(onToggleSql).toHaveBeenCalledTimes(1);
    });

    test('should show the SQL, and press the button, when expanded', () => {
      setup({ expanded: true });

      expect(screen.getByRole('button', { name: 'View SQL' })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText(/ALTER TABLE releases/)).toBeInTheDocument();
      expect(row()).toHaveAttribute('data-expanded', 'true');
    });

    test('should say so when an opened migration has no SQL', () => {
      setup({ sql: null, expanded: true });

      expect(screen.getByText('No SQL available for this migration')).toBeInTheDocument();
    });
  });
});
