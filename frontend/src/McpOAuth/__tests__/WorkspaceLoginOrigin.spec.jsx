/**
 * @jest-environment-options {"url":"https://tooljet.synthetic.example"}
 */
import { waitFor } from '@testing-library/react';
import { authorizeUserAndHandleErrors } from '@/_helpers/authorizeWorkspace';
import { authenticationService } from '@/_services';
import { sessionTransferService } from '@/_services/session-transfer.service';

jest.mock('@/_services', () => ({
  authenticationService: { currentSessionValue: {}, updateCurrentSession: jest.fn(), authorize: jest.fn() },
}));
jest.mock('@/_helpers/routes', () => ({
  ...jest.requireActual('@/_helpers/routes'),
  isCustomDomain: () => false,
}));
jest.mock('@/_helpers/utils', () => ({
  stripTrailingSlash: (value) => value.replace(/\/$/, ''),
  safelyParseJSON: jest.fn(),
}));
jest.mock('@/_helpers', () => ({ eraseCookie: jest.fn(), getCookie: jest.fn() }));
jest.mock('@/_services/authentication.service', () => ({ authenticationService: {} }));
jest.mock('@/modules/common/helpers/utils', () => ({ fetchEdition: () => 'ee' }));
jest.mock('@/AppBuilder/_stores/store', () => ({
  __esModule: true,
  default: { getState: () => ({ setUser: jest.fn(), setOrganization: jest.fn() }) },
}));
jest.mock('@/_helpers/white-label/whiteLabelling', () => ({ fetchWhiteLabelDetails: jest.fn() }));
jest.mock('@/_services/custom-domain.service', () => ({ customDomainService: {} }));
jest.mock('@/_services/session-transfer.service', () => ({
  sessionTransferService: { createTransferToken: jest.fn() },
}));

test('a workspace with a custom domain completes OAuth login on the issuing browser origin', async () => {
  authenticationService.authorize.mockResolvedValue({
    custom_domain: 'garden.synthetic.example',
    current_organization_id: 'garden-id',
    current_organization_slug: 'garden',
    current_organization_name: 'Garden operations',
    current_user: { email: 'builder@synthetic.example', id: 'builder' },
    group_permissions: [],
  });
  const callback = jest.fn();
  authorizeUserAndHandleErrors('garden-id', 'garden', callback, `/mcp/consent?request=${'G'.repeat(43)}`);
  await waitFor(() => expect(callback).toHaveBeenCalled());
  expect(sessionTransferService.createTransferToken).not.toHaveBeenCalled();
  expect(window.location.origin).toBe('https://tooljet.synthetic.example');
});
