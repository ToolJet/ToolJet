/**
 * The Promote button in the version menu must follow the environment the version would land in.
 * A builder whose app permission group leaves out Production can open Development and Staging only. Promote from
 * Staging used to stay enabled for them (it only looked at the app_promote permission) and the version moved into an
 * environment they cannot open, leaving the editor with no Release button and no explanation.
 *
 * Nothing ToolJet-owned is mocked: the real button, the real store and the real environment-access helpers.
 */
import '@/test/setupMsw';
import React from 'react';
import { render, screen } from '@/test/test-utils';
import useStore from '@/AppBuilder/_stores/store';
import { authenticationService } from '@/_services';
import PromoteVersionButton from '../../PromoteVersionButton';

const APP_ID = 'app-1';
const DEVELOPMENT = { id: 'env-dev', name: 'development', priority: 1 };
const STAGING = { id: 'env-staging', name: 'staging', priority: 2 };
const PRODUCTION = { id: 'env-prod', name: 'production', priority: 3, isDefault: true };

const seedEditor = ({ versionEnvironment, environmentAccess }) => {
  authenticationService.updateCurrentSession({
    ...authenticationService.currentSessionValue,
    user_permissions: { app_promote: true },
    app_group_permissions: { environment_access: environmentAccess, editable_apps_id: [APP_ID] },
  });
  useStore.setState({
    environments: [DEVELOPMENT, STAGING, PRODUCTION],
    selectedEnvironment: versionEnvironment,
    appVersionEnvironment: versionEnvironment,
    currentVersionId: 'version-1',
  });
};

const renderPromote = () =>
  render(
    <PromoteVersionButton
      version={{ id: 'version-1', name: 'v1', currentEnvironmentId: useStore.getState().appVersionEnvironment.id }}
      variant="inline"
    />
  );

describe('Promote from the version menu', () => {
  // Break this catches: Promote looking only at app_promote, so a builder without Production access can still move
  // a version into Production.
  it('is disabled when the next environment is one the user has no access to', () => {
    seedEditor({
      versionEnvironment: STAGING,
      environmentAccess: { development: true, staging: true, production: false },
    });
    renderPromote();

    expect(screen.getByRole('button', { name: 'Promote' })).toBeDisabled();
  });

  // Break this catches: the access check disabling Promote for every environment, not just the one that is closed.
  it('stays enabled when the user can access the next environment', () => {
    seedEditor({
      versionEnvironment: DEVELOPMENT,
      environmentAccess: { development: true, staging: true, production: false },
    });
    renderPromote();

    expect(screen.getByRole('button', { name: 'Promote' })).toBeEnabled();
  });

  // Break this catches: the access check disabling Promote for everyone once the target is Production.
  it('stays enabled for a user who can access Production', () => {
    seedEditor({
      versionEnvironment: STAGING,
      environmentAccess: { development: true, staging: true, production: true },
    });
    renderPromote();

    expect(screen.getByRole('button', { name: 'Promote' })).toBeEnabled();
  });
});
