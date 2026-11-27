import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BaseLogoNavDropdown from '../BaseLogoNavDropdown';

jest.mock('@/_components/AppLogo', () => ({
  __esModule: true,
  default: () => <span data-testid="app-logo" />,
}));

jest.mock('@/_services', () => ({
  authenticationService: { currentSessionValue: { current_organization_slug: 'ws1', admin: false } },
}));
jest.mock('@/_services/authentication.service', () => ({
  authenticationService: { currentSessionValue: { current_organization_slug: 'ws1', admin: false } },
}));

const renderAndOpen = async (type) => {
  render(
    <MemoryRouter>
      <BaseLogoNavDropdown type={type} />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByTestId('app-logo'));
  return (await screen.findByText(/^Back to /)).closest('a');
};

// Back link for each supported app type.
describe('BaseLogoNavDropdown back link', () => {
  test.each([
    ['front-end', 'Back to apps', '/ws1'],
    ['module', 'Back to modules', '/ws1/modules'],
    ['workflow', 'Back to workflows', '/ws1/workflows'],
  ])('%s -> "%s" linking to %s', async (type, text, href) => {
    const link = await renderAndOpen(type);
    expect(link).toHaveTextContent(text);
    expect(link).toHaveAttribute('href', href);
  });
});
