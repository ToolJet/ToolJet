import '@/test/setupMsw';
import React from 'react';
import { act, render, screen, userEvent, waitFor, within } from '@/test/test-utils';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { TooljetDatabaseProvider, type TooljetDatabaseContextValue } from '@/TooljetDatabase/TooljetDatabaseContext';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { RelationList } from '../RelationList';
import { useTableDraft } from '../useTableDraft';

const page = {
  organizationId: 'org-1',
  tables: [
    { id: 'users-id', table_name: 'users' },
    { id: 'teams-id', table_name: 'teams' },
  ],
};

// A host that owns one draft, seeded the same way, so the list and the assertions see the same state.
function Harness({ seed }: { seed: boolean }) {
  const draft = useTableDraft();
  const [seeded, setSeeded] = React.useState(false);
  React.useEffect(() => {
    if (seeded) return;
    draft.addColumn();
    setSeeded(true);
  }, [seeded, draft]);
  React.useEffect(() => {
    if (!seeded || draft.columns.length < 2 || draft.columns[1].data_type === 'integer') return;
    draft.updateColumn(draft.columns[1].id, { column_name: 'owner' });
    draft.changeType(draft.columns[1].id, 'integer');
  }, [seeded, draft]);
  React.useEffect(() => {
    if (seed && draft.columns[1]?.data_type === 'integer' && draft.relations.length === 0) {
      draft.addRelation({
        column_names: ['owner'],
        referenced_table_name: 'users',
        referenced_table_id: 'users-id',
        referenced_column_names: ['id'],
        on_delete: 'CASCADE',
        on_update: 'RESTRICT',
      });
    }
    // Seed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, draft.columns]);
  return (
    <>
      <RelationList tableName="orders" draft={draft} />
      <output data-testid="relation-count">{draft.relations.length}</output>
    </>
  );
}

const renderList = (seed = false) => {
  jest.spyOn(tooljetDatabaseService, 'viewTable').mockResolvedValue({
    data: { result: { columns: [{ column_name: 'id', data_type: 'integer', column_default: null }] } },
  });
  return render(
    <TooljetDatabaseProvider value={page as unknown as TooljetDatabaseContextValue}>
      <Harness seed={seed} />
    </TooljetDatabaseProvider>
  );
};

// jsdom has no pointer capture or scrolling, which Radix Select calls when it opens. External adapter, not product logic.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

describe('RelationList', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    act(() => useTjdbStore.getState().actions.resetStore());
  });

  it('shows the empty state and an Add relation button', () => {
    renderList();
    expect(screen.getByText('No relations added yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add relation' })).toBeInTheDocument();
  });

  it('opens a form, hides the Add button while it is open, and discards it', async () => {
    renderList();
    await userEvent.click(screen.getByRole('button', { name: 'Add relation' }));

    expect(screen.getByText('New relation')).toBeInTheDocument();
    expect(screen.getByText('Single')).toBeInTheDocument();
    // Only the form's own submit is left: the header button is hidden while the form is open.
    expect(screen.getAllByRole('button', { name: 'Add relation' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Add relation' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Discard relation' }));
    expect(screen.queryByText('New relation')).not.toBeInTheDocument();
    expect(screen.getByTestId('relation-count')).toHaveTextContent('0');
  });

  it('adds a relation by choosing the source, target table, target column and keeping the default actions', async () => {
    renderList();
    await waitFor(() => expect(screen.queryByTestId('relation-count')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Add relation' }));

    const choose = async (label: string, option: string) => {
      await userEvent.click(screen.getByLabelText(label));
      await userEvent.click(await screen.findByRole('option', { name: option }));
    };
    await waitFor(() => expect(screen.getByLabelText('Source column')).toBeEnabled());
    await choose('Source column', 'owner');
    await choose('Target table', 'users');
    await waitFor(() => expect(screen.getByLabelText('Target column')).toBeEnabled());
    await choose('Target column', 'id');

    await userEvent.click(screen.getByRole('button', { name: 'Add relation' }));
    expect(screen.getByTestId('relation-count')).toHaveTextContent('1');
    expect(screen.queryByText('New relation')).not.toBeInTheDocument();
  });

  describe('with a saved relation', () => {
    it('shows it collapsed: columns, tables and both actions', async () => {
      renderList(true);
      const summary = await waitFor(() => {
        const card = document.querySelector('[data-cy="relation-card-owner"]') as HTMLElement | null;
        if (!card) throw new Error('no card yet');
        return card;
      });
      expect(within(summary).getByText('owner')).toBeInTheDocument();
      expect(within(summary).getByText('users')).toBeInTheDocument();
      expect(within(summary).getByText('id')).toBeInTheDocument();
      expect(within(summary).getByText('RESTRICT')).toBeInTheDocument();
      expect(within(summary).getByText('CASCADE')).toBeInTheDocument();
    });

    it('opens it for editing with the source column fixed, and collapses on Cancel', async () => {
      renderList(true);
      await userEvent.click(await screen.findByRole('button', { name: 'Edit relation on owner' }));

      expect(screen.getByText('Edit relation')).toBeInTheDocument();
      expect(screen.getByLabelText('Source column')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Save relation' })).toBeEnabled();

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText('Edit relation')).not.toBeInTheDocument();
      expect(document.querySelector('[data-cy="relation-card-owner"]')).toBeInTheDocument();
    });

    it('deletes it', async () => {
      renderList(true);
      await userEvent.click(await screen.findByRole('button', { name: 'Delete relation on owner' }));
      expect(screen.getByTestId('relation-count')).toHaveTextContent('0');
      expect(screen.getByText('No relations added yet')).toBeInTheDocument();
    });
  });
});
