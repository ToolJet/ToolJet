/**
 * Deleting a page asks with the same dialog as deleting a query (UB-03): `Delete "<page>"?`, Cancel
 * and Delete. The confirm and cancel buttons keep the hooks QA's page helpers click.
 */
import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import { DeletePageConfirmationModal } from '@/AppBuilder/RightSideBar/PageSettingsTab/PageMenu/DeletePageConfirmationModal';

const scenario = defineAppBuilderScenario({
  id: 'page-delete-dialog',
  name: 'Page delete uses the shared delete dialog',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true },
});

let session;

const openDialog = async () => {
  session = new AppBuilderTestSession({ scenario });
  await session.store.act((state) => {
    state.openPageEditPopover({ id: 'p2', name: 'Second' });
    state.toggleDeleteConfirmationModal(true);
  });
  session.render(<DeletePageConfirmationModal darkMode={false} />);
};

// Break this catches: the page delete falls back to its own "Delete Page" modal with a "Yes" button.
test('asks with the shared delete dialog, titled after the page', async () => {
  await openDialog();

  expect(screen.getByRole('heading', { name: 'Delete "Second"?' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Delete/ })).toHaveAttribute('data-cy', 'modal-confirm-button');
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('data-cy', 'modal-cancel-button');
});

// Break this catches: Cancel leaves the dialog open.
test('Cancel closes the dialog without deleting', async () => {
  await openDialog();

  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

  expect(session.store.read((state) => state.showDeleteConfirmationModal)).toBe(false);
});
