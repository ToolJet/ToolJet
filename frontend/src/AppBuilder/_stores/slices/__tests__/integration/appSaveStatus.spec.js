/**
 * The editor header's save indicator follows real saves: "Saving..." while a save is in flight,
 * "Could not save changes" after one fails (offline, server error), and back to saved once a later
 * save succeeds. HTTP is the only controlled boundary.
 */
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';

const state = () => useStore.getState();
const app = () => state().appStore.modules.canvas.app;

const offline = (path, method = 'put') => server.use(http[method](path, () => HttpResponse.error()));
const online = (path, method = 'put') => server.use(http[method](path, () => HttpResponse.json({})));

beforeEach(() => {
  const store = state();
  store.initializeDependencySlice('canvas');
  store.setApp({ appId: 'app-1' }, 'canvas');
  store.setCurrentVersionId('version-1');
  store.setGlobalSettings({ ...store.globalSettings, variables: {} });
  store.setPages([{ id: 'page-1', handle: 'home', name: 'Home', variables: {}, components: {} }], 'canvas');
  store.setCurrentPageId('page-1', 'canvas');
  store.setComponentNameIdMapping('canvas');
  store.initDependencyGraph('canvas');
});

describe('save indicator state', () => {
  test('a failed app variable save is reported, and a later successful save clears it', async () => {
    offline('*/v2/apps/:appId/versions/:versionId/global_settings');
    await state().saveVariableDefinition({ scope: 'app', name: 'threshold', value: '5' });

    expect(app().saveError).toBe(true);
    expect(app().isSaving).toBe(false);

    online('*/v2/apps/:appId/versions/:versionId/global_settings');
    await state().saveVariableDefinition({ scope: 'app', name: 'limit', value: '9' });

    expect(app().saveError).toBe(false);
  });

  test('a failed page variable save is reported', async () => {
    offline('*/v2/apps/:appId/versions/:versionId/pages');
    await state().saveVariableDefinition({ scope: 'page', name: 'selected', value: '1' });

    expect(app().saveError).toBe(true);
  });

  test('a failed component save is reported', async () => {
    offline('*/v2/apps/:appId/versions/:versionId/components');
    await state().saveComponentChanges({ c1: { component: { name: 'text2' } } }, 'components', 'update', 'canvas');

    expect(app().saveError).toBe(true);
    expect(app().isSaving).toBe(false);
  });

  test('a failed event handler save is reported', async () => {
    offline('*/v2/apps/:appId/versions/:versionId/events', 'post');
    await state().eventsSlice.createAppVersionEventHandlers({ event: { eventId: 'onClick' } }, 'canvas');

    expect(app().saveError).toBe(true);
  });

  test('shows saving while a save is in flight', async () => {
    let release;
    server.use(
      http.put('*/v2/apps/:appId/versions/:versionId/global_settings', async () => {
        await new Promise((resolve) => (release = resolve));
        return HttpResponse.json({});
      })
    );

    const saving = state().saveVariableDefinition({ scope: 'app', name: 'threshold', value: '5' });
    await new Promise((r) => setTimeout(r, 0));
    expect(app().isSaving).toBe(true);

    release();
    await saving;
    expect(app().isSaving).toBe(false);
    expect(app().saveError).toBe(false);
  });
});
