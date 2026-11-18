// Closing the create row drawer: asked about only after the form was touched, and not again after "Create & add another".
import '@/test/setupMsw';
import React from 'react';
import { act, render, screen, userEvent } from '@/test/test-utils';
import { TooljetDatabaseProvider, type TooljetDatabaseContextValue } from '@/TooljetDatabase/TooljetDatabaseContext';
import { UnsavedChangesGuard } from '@/TooljetDatabase/_components/UnsavedChangesGuard';
import { hasUnsavedChanges } from '@/TooljetDatabase/_stores/unsavedChanges';
import CreateRowDrawer from '..';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
);

const column = (accessor: string, dataType: string) => ({
  Header: accessor,
  accessor,
  dataType,
  column_default: null,
  constraints_type: { is_primary_key: false, is_not_null: false },
});

const page = {
  organizationId: 'org-1',
  selectedTable: { id: 'orders-id', table_name: 'orders' },
  columns: [column('title', 'character varying')],
  foreignKeys: [],
  configurations: {},
  getConfigurationProperty: (_header: string, _property: string, fallback: unknown) => fallback,
  handleRefetchQuery: jest.fn(),
};

describe('CreateRowDrawer | closing', () => {
  const close = jest.fn();

  beforeEach(() => {
    close.mockClear();
    render(
      <TooljetDatabaseProvider value={page as unknown as TooljetDatabaseContextValue}>
        <CreateRowDrawer
          isCreateRowDrawerOpen
          setIsCreateRowDrawerOpen={close}
          referencedColumnDetails={[]}
          setReferencedColumnDetails={() => {}}
        />
        <UnsavedChangesGuard />
      </TooljetDatabaseProvider>
    );
  });

  const cancel = () => screen.getByRole('button', { name: 'Cancel' });

  it('closes on Cancel without asking while the form is untouched', async () => {
    expect(hasUnsavedChanges('createRow')).toBe(false);

    await userEvent.click(cancel());

    expect(close).toHaveBeenCalledWith(false);
    expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
  });

  it('asks once a value is typed, stays open on Keep editing and closes on Discard', async () => {
    await userEvent.type(document.querySelector('[data-cy="title-input-field"]') as HTMLElement, 'hello');
    expect(hasUnsavedChanges('createRow')).toBe(true);

    await userEvent.click(cancel());
    expect(await screen.findByText('Unsaved input in the new row will be lost.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(close).not.toHaveBeenCalled();

    await userEvent.click(cancel());
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    await act(async () => {});

    expect(close).toHaveBeenCalledWith(false);
  });
});
