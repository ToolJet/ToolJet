import React from 'react';
import { render, screen, userEvent, waitFor } from '@/test/test-utils';
import { TooljetDatabaseProvider, type TooljetDatabaseContextValue } from '@/TooljetDatabase/TooljetDatabaseContext';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { CreateRowForm } from '../CreateRowForm';
import { EditRowForm } from '../EditRowForm';

jest.mock('@/_services/tooljetDatabase.service', () => ({
  tooljetDatabaseService: { createRow: jest.fn(), updateRows: jest.fn() },
}));
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn(), dismiss: jest.fn() } }));

const createRow = tooljetDatabaseService.createRow as jest.Mock;
const updateRows = tooljetDatabaseService.updateRows as jest.Mock;

const column = (accessor: string, dataType: string, extra: Record<string, unknown> = {}) => ({
  Header: accessor,
  accessor,
  dataType,
  column_default: null,
  constraints_type: { is_primary_key: false, is_not_null: false },
  ...extra,
});

const columns = [
  column('id', 'serial', { constraints_type: { is_primary_key: true, is_not_null: true } }),
  column('title', 'character varying'),
  column('tag', 'character varying', { constraints_type: { is_primary_key: false, is_not_null: true } }),
];

const page = {
  organizationId: 'org-1',
  selectedTable: { id: 'orders-id', table_name: 'orders' },
  columns,
  foreignKeys: [],
  configurations: {},
  getConfigurationProperty: (_header: string, _property: string, fallback: unknown) => fallback,
  handleRefetchQuery: jest.fn(),
};

const withPage = (ui: React.ReactElement) => (
  <TooljetDatabaseProvider value={page as unknown as TooljetDatabaseContextValue}>{ui}</TooljetDatabaseProvider>
);
const field = (name: string) => document.querySelector(`[data-cy="${name}-input-field"]`) as HTMLInputElement;

beforeEach(() => {
  createRow.mockReset().mockResolvedValue({ error: null });
  updateRows.mockReset().mockResolvedValue({ error: null });
});

describe('CreateRowForm', () => {
  const setup = () => {
    const onCreate = jest.fn();
    render(withPage(<CreateRowForm onCreate={onCreate} onClose={jest.fn()} />));
    return onCreate;
  };

  it('shows the key as auto-generated and disables NULL for a NOT NULL column', () => {
    setup();
    expect(field('id')).toBeDisabled();
    expect(field('id')).toHaveValue('Auto-generated');
    expect(document.querySelector('[data-cy="tag-null-tab"]')).toBeDisabled();
    expect(document.querySelector('[data-cy="title-null-tab"]')).not.toBeDisabled();
  });

  it('Enter creates the row and closes; the serial column is not sent', async () => {
    const onCreate = setup();
    await userEvent.type(field('title'), 'Hello{Enter}');

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith(false));
    expect(createRow).toHaveBeenCalledWith('orders-id', { title: 'Hello', tag: '' });
  });

  it('Shift + Enter creates the row, keeps the drawer, clears the fields and counts the rows added', async () => {
    const onCreate = setup();
    await userEvent.type(field('title'), 'Hello{Shift>}{Enter}{/Shift}');

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith(true));
    expect(await screen.findByText('1 row added')).toBeInTheDocument();
    expect(field('title')).toHaveValue('');
    await waitFor(() => expect(field('title')).toHaveFocus());

    await userEvent.type(field('title'), 'Again{Shift>}{Enter}{/Shift}');
    expect(await screen.findByText('2 rows added')).toBeInTheDocument();
    expect(createRow).toHaveBeenCalledTimes(2);
  });

  it('sends an explicit null for a column switched to Null', async () => {
    const onCreate = setup();
    await userEvent.click(document.querySelector('[data-cy="title-null-tab"]') as HTMLElement);
    expect(field('title')).toHaveValue('NULL');
    await userEvent.type(field('tag'), 'x');
    await userEvent.click(screen.getByRole('button', { name: /Create row/ }));

    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(createRow).toHaveBeenCalledWith('orders-id', { title: null, tag: 'x' });
  });

  it('keeps the values and marks the column the server names when the row is refused', async () => {
    createRow.mockResolvedValue({ error: { code: '23505', message: 'orders.title' } });
    const onCreate = setup();
    await userEvent.type(field('title'), 'Hello{Enter}');

    expect(await screen.findByText('Value already exists')).toBeInTheDocument();
    expect(field('title')).toHaveValue('Hello');
    expect(onCreate).not.toHaveBeenCalled();
  });
});

describe('EditRowForm', () => {
  const row = { id: 10, title: 'Hello', tag: 'a' };
  const setup = () => {
    const onEdit = jest.fn();
    render(withPage(<EditRowForm row={row} onEdit={onEdit} onClose={jest.fn()} />));
    return onEdit;
  };

  it('shows the key value read-only and keeps Save off until something changes', () => {
    setup();
    expect(field('id')).toBeDisabled();
    expect(field('id')).toHaveValue('10');
    expect(screen.getByRole('button', { name: /Save changes/ })).toBeDisabled();
  });

  it('sends only the changed column, filtered by the key', async () => {
    const onEdit = setup();
    await userEvent.type(field('title'), '!{Enter}');

    await waitFor(() => expect(onEdit).toHaveBeenCalled());
    expect(updateRows).toHaveBeenCalledWith('orders-id', { title: 'Hello!' }, 'id=eq.10');
  });
});
