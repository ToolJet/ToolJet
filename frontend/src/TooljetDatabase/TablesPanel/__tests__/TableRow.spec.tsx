// One row of the tables panel. The sync dot sits at the end of the row, after the name and before the hover menu.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TableRow } from '../TableRow';
import type { TjdbTable } from '../../TooljetDatabaseContext';

const renderRow = (table: Partial<TjdbTable> = {}) =>
  render(
    <TableRow
      table={{ id: 't1', table_name: 'orders', ...table }}
      onSelect={() => {}}
      onAction={() => {}}
      canEditTjdb
      canEditSchema
    />
  );

describe('TableRow sync dot', () => {
  test('should show an orange dot for a table with changes pending from development', () => {
    renderRow({ migration_sync: 'pending_in_development' });

    expect(screen.getByRole('img', { name: 'Pending in dev' })).toHaveAttribute('data-cy', 'sync-dot-warning');
  });

  test('should show a green dot for a table with changes pending from staging', () => {
    renderRow({ migration_sync: 'pending_in_staging' });

    expect(screen.getByRole('img', { name: 'Pending in staging' })).toHaveAttribute('data-cy', 'sync-dot-success');
  });

  test('should show no dot for a table that is fully migrated', () => {
    renderRow({ migration_sync: null });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('should show no dot for a table whose status the server did not send', () => {
    renderRow();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('should put the dot after the table name and before the actions menu', () => {
    renderRow({ migration_sync: 'pending_in_development' });

    const name = screen.getByRole('button', { name: 'orders' });
    const dot = screen.getByRole('img', { name: 'Pending in dev' });
    const actions = screen.getByRole('button', { name: 'orders actions' });
    expect(name.compareDocumentPosition(dot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(dot.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
