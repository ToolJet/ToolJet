import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('@/_components/NotificationCenter', () => ({
  NotificationCenter: () => <div data-testid="notifications" />,
}));
jest.mock('../../../ReviewInbox', () => () => <div data-testid="reviews" />);
jest.mock('@/_components/ToolTip', () => ({ ToolTip: ({ children }) => children }));
jest.mock('@/_ui/Icon/SolidIcons', () => () => null);
jest.mock('@/_helpers/routes', () => ({ getPrivateRoute: (name) => `/ws/${name}` }));
jest.mock('@/_helpers/utils', () => ({ canAccessTooljetDbDashboard: () => false }));
jest.mock('@/_helpers/active-branch', () => ({ appendBranchName: (path) => path }));
jest.mock('@/modules/dashboard/components', () => ({ SettingsMenu: () => null }));

const BaseLeftNavSideBar = require('../BaseLeftNavSideBar').default;

describe('BaseLeftNavSideBar', () => {
  // The review inbox once took the bell's place on enterprise, and git-sync notifications had nowhere to show.
  it('should show the notifications bell next to the review inbox', () => {
    render(
      <MemoryRouter>
        <BaseLeftNavSideBar
          router={{ pathname: '/ws/home' }}
          checkForUnsavedChanges={jest.fn()}
          canCreateVariableOrConstant={() => false}
          featureAccess={{}}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('notifications')).toBeInTheDocument();
    expect(screen.getByTestId('reviews')).toBeInTheDocument();
  });
});
