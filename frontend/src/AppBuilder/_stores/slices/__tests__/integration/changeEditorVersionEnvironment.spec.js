/**
 * Switching the editor onto a development draft while a later environment is selected
 * (e.g. the auto-switch after a background draft create from a Production version).
 * The header reads selectedEnvironment, so it must follow the environment the version opens in.
 *
 * Runs against the REAL composed store; only HTTP is faked.
 */
import useStore from '@/AppBuilder/_stores/store';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const DEV = { id: 'env-dev', name: 'development', priority: 1 };
const STAGING = { id: 'env-stg', name: 'staging', priority: 2 };
const PROD = { id: 'env-prod', name: 'production', priority: 3 };

const draftVersion = (environmentId) => ({
  id: 'ver-draft',
  name: 'qa-bug3-a',
  currentEnvironmentId: environmentId,
  status: 'DRAFT',
  versionType: 'version',
});

let environmentOfNextVersion = DEV.id;
const server = setupServer(
  http.get('*/v2/apps/:appId/versions/:versionId', () =>
    HttpResponse.json({ editing_version: draftVersion(environmentOfNextVersion), should_freeze_editor: false })
  )
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());

const switchTo = (selectedEnvironment, versionEnvironmentId) => {
  environmentOfNextVersion = versionEnvironmentId;
  useStore.setState({ environments: [DEV, STAGING, PROD], selectedEnvironment, versionsPromotedToEnvironment: [] });
  return new Promise((resolve, reject) =>
    useStore.getState().changeEditorVersionAction('app-1', 'ver-draft', resolve, reject)
  );
};

describe('changeEditorVersionAction environment', () => {
  it('moves the header environment to development when the target is a development draft opened from Production', async () => {
    await switchTo(PROD, DEV.id);
    expect(useStore.getState().selectedEnvironment.name).toBe('development');
  });

  it('keeps the selected environment when the version is available there', async () => {
    await switchTo(STAGING, PROD.id);
    expect(useStore.getState().selectedEnvironment.name).toBe('staging');
  });
});
