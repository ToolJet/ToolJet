import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { act, render, screen, userEvent } from '@/test/test-utils';
import { authenticationService } from '@/_services/authentication.service';
import config from 'config';
import { AppMenu } from '../AppMenu';

jest.mock('@/_services/authentication.service', () => {
  const { BehaviorSubject } = require('rxjs');
  const subject = new BehaviorSubject({});
  return {
    authenticationService: {
      currentSession: subject.asObservable(),
      get currentSessionValue() {
        return subject.value;
      },
      updateCurrentSession: (value) => subject.next(value),
    },
  };
});
jest.mock('@/_services', () => ({
  authenticationService: require('@/_services/authentication.service').authenticationService,
}));
// fetchEdition() reads config.TOOLJET_EDITION on every call, so the edition is controlled there.
const setEdition = (edition) => {
  config.TOOLJET_EDITION = edition;
};

const ITEM = 'View usage analytics';

const Location = () => <div data-testid="location">{useLocation().pathname}</div>;

const renderMenu = async (props = {}) => {
  render(
    <Routes>
      <Route
        path="*"
        element={
          <>
            <AppMenu
              appId="app-1"
              appType="front-end"
              popoverVisible
              setMenuOpen={() => {}}
              onMenuOpen={() => {}}
              openAppActionModal={() => {}}
              isReleased
              {...props}
            />
            <Location />
          </>
        }
      />
    </Routes>,
    { route: '/acme' }
  );
  // Let react-bootstrap's popper finish positioning the open popover.
  await act(async () => {});
};

const setSession = (session) =>
  authenticationService.updateCurrentSession({
    current_organization_id: 'org-1',
    current_organization_slug: 'acme',
    current_user: { id: 'user-1' },
    ...session,
  });

describe('AppMenu — View usage analytics', () => {
  const originalEdition = config.TOOLJET_EDITION;
  afterAll(() => setEdition(originalEdition));

  beforeEach(() => {
    setEdition('ee');
    setSession({ admin: true });
  });

  it('opens the app view for a workspace admin on EE', async () => {
    await renderMenu();
    await userEvent.click(screen.getByText(ITEM));
    expect(screen.getByTestId('location')).toHaveTextContent('/acme/usage-analytics/apps/app-1');
  });

  it('is shown on Cloud', async () => {
    setEdition('cloud');
    await renderMenu();
    expect(screen.getByText(ITEM)).toBeInTheDocument();
  });

  it('is hidden on CE', async () => {
    setEdition('ce');
    await renderMenu();
    expect(screen.queryByText(ITEM)).not.toBeInTheDocument();
  });

  it('is hidden for non-admins', async () => {
    setSession({ admin: false, super_admin: false });
    await renderMenu();
    expect(screen.queryByText(ITEM)).not.toBeInTheDocument();
  });

  it('is hidden for apps that were never released', async () => {
    await renderMenu({ isReleased: false });
    expect(screen.queryByText(ITEM)).not.toBeInTheDocument();
  });

  it('is hidden for workflows and modules', async () => {
    await renderMenu({ appType: 'module' });
    expect(screen.queryByText(ITEM)).not.toBeInTheDocument();
  });
});
