import { renderHook } from '@testing-library/react';

import { useSwitchOrganization } from '../useSwitchOrganization';

const mockRedirectWithSessionTransfer = jest.fn();
jest.mock('@/_helpers/useSessionTransferRedirect', () => ({
  useSessionTransferRedirect: () => mockRedirectWithSessionTransfer,
}));

const organization = (overrides = {}) => ({ id: 'id-b', slug: 'ws-b', name: 'B', ...overrides });

describe('useSwitchOrganization', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/ws-a/apps');
    window.public_config = {};
    jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => jest.restoreAllMocks());

  const setup = () => renderHook(() => useSwitchOrganization()).result.current;

  test('does nothing when the target is the workspace already open', () => {
    window.history.pushState({}, '', '/ws-b/apps');

    setup()(organization());

    expect(window.open).not.toHaveBeenCalled();
    expect(mockRedirectWithSessionTransfer).not.toHaveBeenCalled();
  });

  test('opens the same page under the target workspace slug in a new tab', () => {
    setup()(organization(), true);

    expect(window.open).toHaveBeenCalledWith('/ws-b/apps', '_blank');
  });

  test('transfers the session to a workspace on its own custom domain', () => {
    setup()(organization({ custom_domain: 'acme.example.com' }));

    expect(mockRedirectWithSessionTransfer).toHaveBeenCalledWith(
      'https://acme.example.com',
      '/ws-b/apps',
      'id-b',
      false
    );
  });

  test('moves from a custom domain to the main host for a workspace without one', () => {
    window.public_config = { TOOLJET_HOST: 'https://main.example.com/' };

    setup()(organization());

    expect(mockRedirectWithSessionTransfer).toHaveBeenCalledWith(
      'https://main.example.com',
      '/ws-b/apps',
      'id-b',
      false
    );
  });
});
