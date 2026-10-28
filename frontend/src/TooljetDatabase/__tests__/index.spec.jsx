import React from 'react';
import { render } from '@testing-library/react';
import TooljetDatabase from '..';
import TooljetDatabasePage from '../TooljetDatabasePage';
import { canAccessTooljetDbDashboard } from '@/_helpers/utils';
import { authenticationService } from '@/_services/authentication.service';
import { fetchAndSetWindowTitle } from '@white-label/whiteLabelling';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useOutletContext: () => ({
    collapseSidebar: false,
    setCollapseSidebar: jest.fn(),
    setEnableCollapsibleSidebar: jest.fn(),
  }),
}));

jest.mock('../TooljetDatabasePage', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn(() => React.createElement('div', { 'data-testid': 'tooljet-database-page' })),
  };
});

jest.mock('../TooljetDatabaseContext', () => ({
  TooljetDatabaseProvider: ({ children }) => children,
}));

jest.mock('../usePostgrestQueryBuilder', () => ({
  usePostgrestQueryBuilder: () => ({
    handleBuildFilterQuery: jest.fn(),
    handleBuildSortQuery: jest.fn(),
    buildPaginationQuery: jest.fn(),
    resetSortQuery: jest.fn(),
    resetFilterQuery: jest.fn(),
    resetAll: jest.fn(),
    handleRefetchQuery: jest.fn(),
  }),
}));

jest.mock('@/_helpers/utils', () => ({
  canAccessTooljetDbDashboard: jest.fn(),
}));

jest.mock('@/_services/authentication.service', () => ({
  authenticationService: { currentSessionValue: {} },
}));

jest.mock('@white-label/whiteLabelling', () => ({
  fetchAndSetWindowTitle: jest.fn(),
  pageTitles: { DATABASE: 'Database' },
}));

describe('TooljetDatabase permissions', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    canAccessTooljetDbDashboard.mockReset();
  });

  it('redirects unauthorized users and never mounts the database UI', () => {
    authenticationService.currentSessionValue = { admin: false, user_permissions: {} };
    canAccessTooljetDbDashboard.mockReturnValue(false);

    render(<TooljetDatabase />);

    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(TooljetDatabasePage).not.toHaveBeenCalled();
    expect(fetchAndSetWindowTitle).not.toHaveBeenCalled();
  });

  it('renders the database UI for authorized users without redirecting', () => {
    authenticationService.currentSessionValue = { admin: true, user_permissions: {} };
    canAccessTooljetDbDashboard.mockReturnValue(true);

    render(<TooljetDatabase />);

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(TooljetDatabasePage).toHaveBeenCalled();
  });
});
