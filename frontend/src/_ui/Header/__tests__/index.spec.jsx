import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../Breadcrumbs', () => ({ Breadcrumbs: () => null }));
jest.mock('@/_ui/AppButton/AppButton', () => ({ ButtonSolid: () => null }));
jest.mock('@/_components', () => ({ ToolTip: ({ children }) => children }));
jest.mock('@/modules/common/components/LicenseBanner', () => () => null);
jest.mock('@/_ui/WorkspaceBranchDropdown', () => ({ WorkspaceBranchDropdown: () => null }));
jest.mock('@/_ui/WorkspaceGitCTA', () => ({ WorkspaceGitCTA: () => null }));
jest.mock('@/_stores/workspaceBranchesStore', () => ({ useWorkspaceBranchesStore: () => false }));
jest.mock('@/_services', () => ({ authenticationService: { currentSessionValue: {} } }));
jest.mock('@/_helpers/gitSyncLicense', () => ({ isGitSyncLicenseInvalid: () => false }));

import Header from '../index';

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Header featureAccess={{}} />
    </MemoryRouter>
  );

describe('Header section title', () => {
  it.each(['/ws-1/workflows', '/ws-1/workflows/approvals', '/ws-1/workflows/executions'])(
    'names the Workflows section on %s',
    (path) => {
      const { container } = renderAt(path);

      expect(container.querySelector('[data-cy="dashboard-section-header"]')).toHaveTextContent('Workflows');
    }
  );
});
