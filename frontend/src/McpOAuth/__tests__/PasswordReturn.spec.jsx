import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BaseLoginPage from '@/modules/auth/pages/LoginPage/components/BaseLoginPage/BaseLoginPage';
import { onLoginSuccess } from '@/_helpers/platform/utils/auth.utils';
import { setCookie } from '@/_helpers/cookie';

jest.mock('@/_services', () => ({
  authenticationService: {
    saveLoginOrganizationId: jest.fn(),
    saveLoginOrganizationSlug: jest.fn(),
    login: jest.fn().mockResolvedValue({ id: 'synthetic-user' }),
  },
}));
jest.mock('@/_helpers/platform/utils/auth.utils', () => ({ onLoginSuccess: jest.fn() }));
jest.mock('@/_helpers/authorizeWorkspace', () => ({ updateCurrentSession: jest.fn() }));
jest.mock('@/_helpers/cookie', () => ({ setCookie: jest.fn() }));
jest.mock('@white-label/whiteLabelling', () => ({ retrieveWhiteLabelText: () => 'ToolJet' }));
jest.mock('@/modules/common/helpers/posthogHelper', () => ({ initPosthog: jest.fn(), captureEvent: jest.fn() }));
jest.mock('@/modules/auth/components/LoginPageRightPanel/LoginPageRightPanel', () => ({
  FeatureGraphicRightPanel: () => null,
}));
jest.mock('@/modules/onboarding/components/OnboardingBackgroundWrapper', () => ({
  __esModule: true,
  default: ({ LeftSideComponent }) => <LeftSideComponent />,
}));
jest.mock('@/modules/auth/pages/LoginPage/components', () => ({
  LoginForm: ({ onSubmit }) => (
    <button onClick={() => onSubmit('operator@synthetic.example', 'synthetic-password', jest.fn())}>Sign in</button>
  ),
  MfaVerifyForm: () => null,
}));

beforeEach(() => {
  jest.clearAllMocks();
  window.public_config = {};
});
test.each([
  [`/mcp/consent?request=${'K'.repeat(43)}`, true],
  ['/apps/greenhouse', false],
  ['/mcp/consent?request=invalid', false],
])('keeps OAuth password returns tab-local without changing other login returns: %s', async (returnTo, oauth) => {
  window.history.replaceState({}, '', `/login?redirectTo=${encodeURIComponent(returnTo)}`);
  render(
    <MemoryRouter
      initialEntries={[window.location.pathname + window.location.search]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <BaseLoginPage configs={{}} />
    </MemoryRouter>
  );
  await waitFor(() => expect(setCookie).toHaveBeenCalledWith('redirectPath', returnTo, false));
  // A separate login tab can replace this shared cookie before this form is submitted.
  document.cookie = `redirectPath=${encodeURIComponent(`/mcp/consent?request=${'M'.repeat(43)}`)}`;
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() =>
    expect(onLoginSuccess).toHaveBeenCalledWith({ id: 'synthetic-user' }, expect.any(Function), oauth ? returnTo : null)
  );
});
