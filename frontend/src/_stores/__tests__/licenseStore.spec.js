import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import config from 'config';
import { authenticationService } from '@/_services';
import { useLicenseStore } from '../licenseStore';

it('ignores late workspace access and clears access while loading or on failure', async () => {
  const original = authenticationService.currentSessionValue;
  let finishA;
  let startedA;
  const started = new Promise((resolve) => {
    startedA = resolve;
  });
  server.use(
    http.get(`${config.apiUrl}/license/access`, ({ request }) => {
      if (request.headers.get('tj-workspace-id') === 'workspace-a') {
        startedA();
        return new Promise((resolve) => {
          finishA = () => resolve(HttpResponse.json({ queryLibraryEnabled: true }));
        });
      }
      return HttpResponse.json({ queryLibraryEnabled: false });
    })
  );
  try {
    authenticationService.updateCurrentSession({ ...original, current_organization_id: 'workspace-a' });
    const pendingA = useLicenseStore.getState().actions.fetchFeatureAccess();
    await started;
    expect(useLicenseStore.getState().featureAccess).toEqual({});
    authenticationService.updateCurrentSession({ ...original, current_organization_id: 'workspace-b' });
    await useLicenseStore.getState().actions.fetchFeatureAccess();
    finishA();
    await pendingA;
    expect(useLicenseStore.getState()).toMatchObject({
      featureAccess: { queryLibraryEnabled: false },
      featureAccessWorkspaceId: 'workspace-b',
    });
    server.use(http.get(`${config.apiUrl}/license/access`, () => HttpResponse.error()));
    await useLicenseStore.getState().actions.fetchFeatureAccess();
    expect(useLicenseStore.getState()).toMatchObject({ featureAccess: {}, featuresLoaded: true });
  } finally {
    finishA?.();
    authenticationService.updateCurrentSession(original);
  }
});
