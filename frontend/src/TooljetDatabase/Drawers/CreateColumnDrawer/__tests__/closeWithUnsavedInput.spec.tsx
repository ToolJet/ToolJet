// Closing the create column drawer: asked about only after the form was touched.
import '@/test/setupMsw';
import React from 'react';
import { act, render, screen, userEvent } from '@/test/test-utils';
import { TooljetDatabaseProvider, type TooljetDatabaseContextValue } from '@/TooljetDatabase/TooljetDatabaseContext';
import { UnsavedChangesGuard } from '@/TooljetDatabase/_components/UnsavedChangesGuard';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { hasUnsavedChanges } from '@/TooljetDatabase/_stores/unsavedChanges';
import CreateColumnDrawer from '..';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
);

const page = {
  organizationId: 'org-1',
  selectedTable: { id: 'users-id', table_name: 'users' },
  foreignKeys: [],
  tables: [],
  setColumns: jest.fn(),
  setForeignKeys: jest.fn(),
  setConfigurations: jest.fn(),
  handleRefetchQuery: jest.fn(),
};

describe('CreateColumnDrawer | closing', () => {
  const close = jest.fn();

  beforeEach(() => {
    close.mockClear();
    act(() => useTjdbStore.getState().actions.resetStore());
    render(
      <TooljetDatabaseProvider value={page as unknown as TooljetDatabaseContextValue}>
        <CreateColumnDrawer
          isCreateColumnDrawerOpen
          setIsCreateColumnDrawerOpen={close}
          rows={[]}
          referencedColumnDetails={[]}
          setReferencedColumnDetails={() => {}}
        />
        <UnsavedChangesGuard />
      </TooljetDatabaseProvider>
    );
  });

  const cancel = () => screen.getByRole('button', { name: 'Cancel' });

  it('closes on Cancel without asking while the form is untouched', async () => {
    await userEvent.click(cancel());

    expect(close).toHaveBeenCalledWith(false);
    expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
  });

  it('asks once a column name is typed, stays open on Keep editing and closes on Discard', async () => {
    await userEvent.type(document.querySelector('[data-cy="column-name-input-field"]') as HTMLElement, 'age');
    expect(hasUnsavedChanges('createColumn')).toBe(true);

    await userEvent.click(cancel());
    expect(await screen.findByText('Unsaved input in the new column will be lost.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(close).not.toHaveBeenCalled();

    await userEvent.click(cancel());
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    await act(async () => {});

    expect(close).toHaveBeenCalledWith(false);
  });
});
