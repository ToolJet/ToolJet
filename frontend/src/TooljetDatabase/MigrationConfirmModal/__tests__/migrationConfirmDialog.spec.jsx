// The schema-change confirmation (Figma "New migration dialog"): a required Title that starts from the change's own
// name, an always-open SQL field with the {{self}} hint under it, the changes overview, and the dependents card.
import '@/test/setupMsw';
import React, { useEffect } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TooljetDatabaseContext } from '@/TooljetDatabase';
import useMigrationModal from '@/TooljetDatabase/MigrationConfirmModal/useMigrationModal';
import { CHANGE_TYPE } from '@/TooljetDatabase/MigrationConfirmModal';

function MigrationHarness({ options }) {
  const { runMigration, modal } = useMigrationModal();
  useEffect(() => runMigration(options), []); // eslint-disable-line react-hooks/exhaustive-deps
  return modal;
}

const DEPENDENTS = {
  count: 2,
  dependents: [
    { id: 'a1', name: 'Orders dashboard', type: 'front-end', queries: [{ name: 'getOrders' }] },
    { id: 'w1', name: 'Inventory sync', type: 'workflow', queries: [{ name: 'readStock' }] },
  ],
};

function renderModal(options, { dependents = { count: 0 } } = {}) {
  const rawSqlBodies = [];
  const run = jest.fn(() => Promise.resolve({}));
  server.use(
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableId/dependents', () =>
      HttpResponse.json({ result: dependents })
    ),
    http.post('*/tooljet-db/organizations/:organizationId/table/:tableId/migrations/sql', async ({ request }) => {
      rawSqlBodies.push(await request.json());
      return HttpResponse.json({ result: {} });
    })
  );
  render(
    <TooljetDatabaseContext.Provider value={{ organizationId: 'org-1', tables: [] }}>
      <MigrationHarness options={{ run, tableId: 'table-1', changes: [], showSqlEditor: true, ...options }} />
    </TooljetDatabaseContext.Provider>
  );
  return { run, rawSqlBodies };
}

const dialog = () => screen.findByRole('dialog');
const title = () =>
  waitFor(() => {
    const input = document.querySelector('[data-cy="migration-confirm-title-input"]');
    expect(input).toBeTruthy();
    return input;
  });
const runButton = () => screen.findByRole('button', { name: 'Run in development' });

describe('Migration confirmation dialog', () => {
  test('should say which environment the migration runs in', async () => {
    renderModal({});

    expect(await dialog()).toHaveTextContent('Schema changes require migration');
    expect(await dialog()).toHaveTextContent('Run migration on development environment');
  });

  test('should open with the cursor in the Title field, not on the close button', async () => {
    renderModal({ defaultTitle: 'Add column "age"' });

    await waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector('[data-cy="migration-confirm-title-input"]'))
    );
  });

  describe('title', () => {
    test('should start from the change’s own name, so it can run straight away', async () => {
      const { run } = renderModal({ defaultTitle: 'Add column "age"' });

      expect(await title()).toHaveValue('Add column "age"');
      await userEvent.click(await runButton());

      await waitFor(() => expect(run).toHaveBeenCalledWith('Add column "age"'));
    });

    test('should not run until a title is given when the change has no name of its own', async () => {
      renderModal({ titlePlaceholder: 'Explain your changes briefly..' });

      expect(await runButton()).toBeDisabled();
      await userEvent.type(await title(), 'Backfill status');
      expect(await runButton()).toBeEnabled();
    });

    test('should not accept a title of spaces', async () => {
      renderModal({ titlePlaceholder: 'Explain your changes briefly..' });

      await userEvent.type(await title(), '   ');

      expect(await runButton()).toBeDisabled();
    });

    test('should not run once the title is cleared', async () => {
      renderModal({ defaultTitle: 'Add column "age"' });

      await userEvent.clear(await title());

      expect(await runButton()).toBeDisabled();
    });
  });

  describe('SQL', () => {
    test('should show the SQL field open, with no description field and no Add migration button', async () => {
      renderModal({});

      expect(await screen.findByTestId('migration-confirm-sql-editor-field')).toBeInTheDocument();
      expect(document.querySelector('[data-cy="migration-confirm-description-input"]')).toBeNull();
      expect(document.querySelector('[data-cy="migration-confirm-add-migration"]')).toBeNull();
    });

    test('should mark the SQL optional unless the change needs it', async () => {
      renderModal({});

      expect(await screen.findByText('SQL (optional)')).toBeInTheDocument();
    });

    test('should not mark the SQL optional when it is the change itself', async () => {
      renderModal({ sqlRequired: true });

      expect(await screen.findByText('SQL')).toBeInTheDocument();
      expect(screen.queryByText('SQL (optional)')).not.toBeInTheDocument();
    });

    test('should show the {{self}} table-reference hint as helper text under the field', async () => {
      renderModal({});

      const hint = await screen.findByTestId('migration-confirm-sql-hint');
      expect(hint).toHaveTextContent('{{self}}');
      expect(hint).toHaveTextContent('{{table.<name>}}');
    });

    test('should keep the SQL placeholder to one line, without the hint', async () => {
      renderModal({});

      await screen.findByTestId('migration-confirm-sql-hint');
      await waitFor(() => {
        const placeholder = document.querySelector('[data-cy="migration-confirm-sql-editor"] .cm-placeholder');
        expect(placeholder).toBeTruthy();
        expect(placeholder.textContent).not.toContain('{{self}}');
        expect(placeholder.textContent).not.toContain('\n');
      });
    });

    test('should have no SQL field for a change that cannot take one', async () => {
      renderModal({ showSqlEditor: false });

      await title();
      expect(screen.queryByTestId('migration-confirm-sql-editor-field')).not.toBeInTheDocument();
    });
  });

  describe('changes overview', () => {
    const CHANGES = [
      { type: CHANGE_TYPE.ADD, name: 'age', detail: 'int · default 0' },
      { type: CHANGE_TYPE.REMOVE, name: 'legacy_id' },
      { type: CHANGE_TYPE.EDIT, oldName: 'full_name', name: 'display_name' },
      { type: CHANGE_TYPE.EDIT, name: 'email', detail: 'add NOT NULL constraint' },
    ];

    test('should count and list every change', async () => {
      renderModal({ changes: CHANGES });

      expect(await screen.findByText('Changes overview (4)')).toBeInTheDocument();
      const list = screen.getByTestId('migration-changes-list');
      expect(list).toHaveTextContent('age');
      expect(list).toHaveTextContent('int · default 0');
      expect(list).toHaveTextContent('full_name');
      expect(list).toHaveTextContent('display_name');
      expect(list).toHaveTextContent('add NOT NULL constraint');
    });

    test('should strike through a dropped name and a renamed column’s old name', async () => {
      renderModal({ changes: CHANGES });

      await screen.findByText('Changes overview (4)');
      expect(screen.getByText('legacy_id')).toHaveClass('tw-line-through');
      expect(screen.getByText('full_name')).toHaveClass('tw-line-through');
      expect(screen.getByText('display_name')).not.toHaveClass('tw-line-through');
    });

    test('should show a plus for an added column, a minus for a dropped one and a square pen for an edit', async () => {
      renderModal({ changes: CHANGES });

      await screen.findByText('Changes overview (4)');
      const list = screen.getByTestId('migration-changes-list');
      expect(list.querySelectorAll('.lucide-plus')).toHaveLength(1);
      expect(list.querySelectorAll('.lucide-minus')).toHaveLength(1);
      expect(list.querySelectorAll('.lucide-square-pen')).toHaveLength(2);
      expect(list.querySelector('.lucide-pencil')).toBeNull();
    });

    test('should lay a row out as one line of text: name, then its detail', async () => {
      renderModal({ changes: CHANGES });

      await screen.findByText('Changes overview (4)');
      const rows = screen.getByTestId('migration-changes-list').children;
      expect(rows[0].textContent).toBe('age int · default 0');
      expect(rows[2].textContent).toBe('full_name display_name');
      expect(rows[3].textContent).toBe('email add NOT NULL constraint');
    });

    test('should mute an added column’s detail but not a dropped column’s', async () => {
      renderModal({
        changes: [
          { type: CHANGE_TYPE.ADD, name: 'age', detail: 'int' },
          { type: CHANGE_TYPE.REMOVE, name: 'legacy_id', detail: 'had 3 relations' },
        ],
      });

      await screen.findByText('Changes overview (2)');
      expect(screen.getByText('int')).toHaveClass('tw-text-text-placeholder');
      expect(screen.getByText('had 3 relations')).not.toHaveClass('tw-text-text-placeholder');
    });

    test('should show no overview when nothing changes structurally', async () => {
      renderModal({ changes: [] });

      await title();
      expect(screen.queryByText(/Changes overview/)).not.toBeInTheDocument();
    });
  });

  describe('dependents', () => {
    test('should show a collapsed count that opens into the resources', async () => {
      renderModal({}, { dependents: DEPENDENTS });

      const summary = await screen.findByRole('button', { name: /2 resources depend on this table/ });
      expect(summary).toHaveAttribute('aria-expanded', 'false');
      // The list stays mounted while closed (it animates), so closed is a state of its container, not absence.
      const list = () => screen.getByText('Orders dashboard').closest('[data-slot="collapsible-content"]');
      expect(list()).toHaveAttribute('data-state', 'closed');
      // The collapse is a grid-rows animation on the content element: a display override on it (flex, block) keeps the
      // list open whatever its state says, which no jsdom assertion on visibility can show.
      expect(list()).toHaveClass('tw-grid');
      expect(list().className).not.toMatch(/tw-(flex|block|inline)\b/);

      await userEvent.click(summary);

      expect(summary).toHaveAttribute('aria-expanded', 'true');
      expect(list()).toHaveAttribute('data-state', 'open');
      expect(screen.getByText('Inventory sync')).toBeInTheDocument();
    });

    describe('a table used in an app, a workflow and a module', () => {
      const MIXED = {
        count: 3,
        dependents: [
          { id: 'a1', name: 'Orders dashboard', type: 'front-end', queries: [{ name: 'getOrders' }] },
          { id: 'w1', name: 'Inventory sync', type: 'workflow', queries: [{ name: 'readStock' }] },
          { id: 'm1', name: 'Address form', type: 'module', queries: [{ name: 'getAddresses' }] },
        ],
      };
      const rowOf = (name) => screen.getByText(name).closest('div');

      test('should count all three and list each by name', async () => {
        renderModal({}, { dependents: MIXED });

        await userEvent.click(await screen.findByRole('button', { name: /3 resources depend on this table/ }));

        ['Orders dashboard', 'Inventory sync', 'Address form'].forEach((name) =>
          expect(screen.getByText(name)).toBeInTheDocument()
        );
      });

      test('should give each kind its own icon', async () => {
        renderModal({}, { dependents: MIXED });
        await userEvent.click(await screen.findByRole('button', { name: /3 resources depend on this table/ }));

        expect(rowOf('Orders dashboard').querySelector('.lucide-app-window')).toBeTruthy();
        expect(rowOf('Inventory sync').querySelector('.lucide-workflow')).toBeTruthy();
        expect(rowOf('Address form').querySelector('.lucide-blocks')).toBeTruthy();
      });
    });

    test('should fall back to the app icon and "Untitled" for a dependent the UI does not know', async () => {
      renderModal(
        {},
        { dependents: { count: 1, dependents: [{ id: 'x1', name: '', type: 'something-new', queries: [] }] } }
      );

      await userEvent.click(await screen.findByRole('button', { name: /1 resource depends on this table/ }));

      expect(screen.getByText('Untitled').closest('div').querySelector('.lucide-app-window')).toBeTruthy();
    });

    test('should say "1 resource" for a single dependent', async () => {
      renderModal({}, { dependents: { count: 1, dependents: [DEPENDENTS.dependents[0]] } });

      expect(await screen.findByRole('button', { name: /1 resource depends on this table/ })).toBeInTheDocument();
    });

    test('should say how many more there are than are listed', async () => {
      renderModal({}, { dependents: { count: 7, dependents: DEPENDENTS.dependents } });

      await userEvent.click(await screen.findByRole('button', { name: /7 resources depend on this table/ }));

      expect(screen.getByText('+5 more')).toBeInTheDocument();
    });

    test('should show no card when nothing depends on the table', async () => {
      renderModal({}, { dependents: { count: 0 } });

      await title();
      await waitFor(() => expect(screen.queryByText(/Checking dependent resources/)).not.toBeInTheDocument());
      expect(screen.queryByRole('button', { name: /depend/ })).not.toBeInTheDocument();
    });
  });

  describe('closing', () => {
    test('should close from Cancel without running', async () => {
      const { run } = renderModal({ defaultTitle: 'Add column "age"' });

      await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(run).not.toHaveBeenCalled();
    });

    test('should close from the X button', async () => {
      renderModal({});

      await userEvent.click(await screen.findByRole('button', { name: 'Close' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });
});
