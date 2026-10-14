import React from 'react';
import { render, screen } from '@/test/test-utils';
import { authenticationService } from '@/_services/authentication.service';
import { BreadCrumbContext } from '@/App/App';
import { SettingsPage } from '../SettingsPage';

// The shared lucide stub can't render Button's leadingIcon (icons[...] is a component, not an iconNode).
jest.mock('lucide-react/dynamic.mjs', () => ({ DynamicIcon: () => null }));
jest.mock('@/_ui/Layout', () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock('@/modules/AiBuilder/components/ProfileNotificationsCard', () => ({ __esModule: true, default: () => null }));
jest.mock('../TwoFactorAuthCard', () => ({ TwoFactorAuthCard: () => null }));
jest.mock('@/_services/personalAccessTokens.service', () => ({
  personalAccessTokensService: { list: () => Promise.resolve([]), create: jest.fn(), remove: jest.fn() },
}));
jest.mock('@/_services/organization.service', () => ({
  organizationService: { getOrganizations: () => Promise.resolve({ organizations: [] }) },
}));

it('Profile settings has no personal access tokens card', async () => {
  authenticationService.updateCurrentSession({
    current_organization_id: 'org-1',
    current_user: { email: 'a@b.c', first_name: 'A', last_name: 'B' },
    role: { name: 'admin' },
    admin: true,
  });
  render(
    <BreadCrumbContext.Provider value={{ updateSidebarNAV: jest.fn() }}>
      <SettingsPage />
    </BreadCrumbContext.Provider>
  );

  expect(await screen.findByRole('heading', { name: /change password/i })).toBeInTheDocument();
  expect(screen.queryByText(/personal access tokens?/i)).not.toBeInTheDocument();
});
