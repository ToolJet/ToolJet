import React from 'react';
import { render, screen } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { authenticationService } from '@/_services';
import WorkspaceConstants from '../index';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => mockNavigate }));
jest.mock('react-hot-toast', () => ({ toast: { error: jest.fn() } }));
jest.mock('@/_helpers/utils', () => ({ ...jest.requireActual('@/_helpers/utils'), getWorkspaceId: () => 'ws-1' }));
jest.mock('@/modules/common/helpers/utils', () => ({
  ...jest.requireActual('@/modules/common/helpers/utils'),
  fetchEdition: () => 'ee',
}));
jest.mock('@/modules/WorkspaceSettings/components/ManageOrgConstantsSettings/ManageOrgConstantsSettings', () => ({
  __esModule: true,
  default: () => <div>constants page</div>,
}));

const signInWith = (session) => {
  Object.defineProperty(authenticationService, 'currentSessionValue', { configurable: true, get: () => session });
};

describe('WorkspaceConstants route gate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens the page for a user with the constants permission', () => {
    signInWith({ user_permissions: { org_constant_c_r_u_d: true } });
    render(<WorkspaceConstants />);
    expect(screen.getByText('constants page')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('opens the page for a super admin without the permission flag', () => {
    signInWith({ super_admin: true, user_permissions: { org_constant_c_r_u_d: false } });
    render(<WorkspaceConstants />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('sends everyone else home with a message', () => {
    signInWith({ user_permissions: { org_constant_c_r_u_d: false } });
    render(<WorkspaceConstants />);
    expect(toast.error).toHaveBeenCalledWith("You don't have access to Workspace constants", expect.any(Object));
    expect(mockNavigate).toHaveBeenCalledWith('/ws-1/home');
  });
});
