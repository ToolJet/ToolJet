import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { render, screen } from '@/test/test-utils';
import { PatSettingsRoute } from '../PatSettingsRoute';

let mockSession;
jest.mock('@/_hooks/useSessionManagement', () => ({
  useSessionManagement: () => ({
    isLoading: false,
    isValidSession: true,
    session: mockSession,
    setLoading: jest.fn(),
  }),
}));

const renderAt = () =>
  render(
    <Routes>
      <Route path="/" element={<div>home</div>} />
      <Route
        path="/pat"
        element={
          <PatSettingsRoute>
            <div>pat page</div>
          </PatSettingsRoute>
        }
      />
    </Routes>,
    { route: '/pat' }
  );

describe('PatSettingsRoute', () => {
  it('redirects a user with neither flag', async () => {
    mockSession = { admin: false, super_admin: false, user_permissions: { pat_create: false, pat_revoke: false } };
    renderAt();
    expect(await screen.findByText('home')).toBeInTheDocument();
    expect(screen.queryByText('pat page')).not.toBeInTheDocument();
  });

  it('redirects an end-user with no flags, who owns no token', async () => {
    mockSession = {
      admin: false,
      super_admin: false,
      user_permissions: { is_end_user: true, pat_create: false, pat_revoke: false },
      has_own_pats: false,
    };
    renderAt();
    expect(await screen.findByText('home')).toBeInTheDocument();
    expect(screen.queryByText('pat page')).not.toBeInTheDocument();
  });

  it.each([
    ['admin', { admin: true }],
    ['super_admin', { super_admin: true }],
    ['pat_create', { user_permissions: { pat_create: true } }],
    ['pat_revoke', { user_permissions: { pat_revoke: true } }],
    ['has_own_pats', { has_own_pats: true }],
  ])('allows %s', async (_label, session) => {
    mockSession = { admin: false, super_admin: false, user_permissions: {}, ...session };
    renderAt();
    expect(await screen.findByText('pat page')).toBeInTheDocument();
  });
});
