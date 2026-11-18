import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { fetchMenuApps, MENU_APPS_REUSE_MS, resetMenuAppsRequest } from '../menuAppsRequest';

const MENU_APPS_URL = 'http://localhost:3000/api/apps/menu-apps';

describe('fetchMenuApps', () => {
  let calls;
  let clock;
  const now = () => clock;

  beforeEach(() => {
    resetMenuAppsRequest();
    calls = 0;
    clock = 1_000_000;
    server.use(
      http.get(MENU_APPS_URL, () => {
        calls += 1;
        return HttpResponse.json({ apps: [{ id: `a-${calls}`, name: `Version ${calls}`, slug: 's', folder: null }] });
      })
    );
  });

  it('shares one request between everything that asks during one app load', async () => {
    const [desktop, mobile] = await Promise.all([fetchMenuApps('app-1', { now }), fetchMenuApps('app-1', { now })]);
    const popup = await fetchMenuApps('app-1', { now });

    expect(calls).toBe(1);
    expect(desktop).toEqual(mobile);
    expect(popup).toEqual(desktop);
  });

  it('asks again when the same app is opened later, so the list is never stale', async () => {
    await fetchMenuApps('app-1', { now });
    clock += MENU_APPS_REUSE_MS;
    const reopened = await fetchMenuApps('app-1', { now });

    expect(calls).toBe(2);
    expect(reopened[0].name).toBe('Version 2');
  });

  it('asks again for a different app', async () => {
    await fetchMenuApps('app-1', { now });
    await fetchMenuApps('app-2', { now });

    expect(calls).toBe(2);
  });

  it('returns no apps on failure and retries on the next call', async () => {
    server.use(http.get(MENU_APPS_URL, () => HttpResponse.json({ message: 'nope' }, { status: 500 }), { once: true }));

    await expect(fetchMenuApps('app-1', { now })).resolves.toEqual([]);
    await expect(fetchMenuApps('app-1', { now })).resolves.toHaveLength(1);
  });
});
