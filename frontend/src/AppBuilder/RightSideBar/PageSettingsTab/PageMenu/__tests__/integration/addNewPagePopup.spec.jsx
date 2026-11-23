/**
 * Regression spec for the "add new page creates pages in an infinite loop" bug.
 *
 * REPRO (confirmed live on a fresh app, 2026-10-23): clicking "New page" in the
 * Pages panel mounts AddEditPagePopup with newPagePopupConfig
 * {show: true, mode: 'add', type: 'default'}. The popup's auto-create effect
 * calls addNewPage(), which synchronously pushes the new page into the zustand
 * store (pageMenuSlice.js — set() runs before the autosave await). That store
 * write forces a SYNCHRONOUS nested re-render + effect flush through
 * useSyncExternalStore — BEFORE the `setHasAutoSaved(true)` on the next line of
 * the effect is ever applied. The effect therefore re-enters with
 * hasAutoSaved still false and `pages` one longer, creates "Page 2", re-enters,
 * creates "Page 3"… until React's nested-update limit (~50) throws
 * "Maximum update depth exceeded". One click = 52 POST /pages and a crashed
 * editor. A React STATE flag cannot guard a synchronously re-entrant effect;
 * only a ref (written before the store mutation) can.
 *
 * This spec mounts the real popup against the REAL composed store (no App
 * Builder mocks) and asserts exactly one page is auto-created. Before the fix
 * it goes red either way the bug manifests: React throws the max-update-depth
 * error out of render, or the store ends up with dozens of pages.
 *
 * DRIVING the aftermath — addNewPage is async: after the store push it awaits
 * the autosave POST (MSW below), then calls switchPage, whose doSwitch contains
 * two `await yieldToMain()` MACROTASK hops (see pageSwitch.spec.js header).
 * settle() drives those with real setTimeout(0) hops; afterEach drains the
 * exposed-value bracket switchPage opens and never closes.
 */
import '@/test/setupMsw';
import React from 'react';
import { render, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { AddEditPagePopup } from '../../AddNewPagePopup';

const state = () => useStore.getState();

/** One macrotask hop — resolves one `await yieldToMain()` / pending fetch. */
const hop = () => new Promise((resolve) => setTimeout(resolve, 0));
/** addNewPage: store push -> autosave fetch -> switchPage (2 macrotask hops). */
async function settle() {
  for (let i = 0; i < 5; i++) await hop();
}

/**
 * Brings the real store to the state the editor is in on a fresh app with the
 * Pages panel open: one Home page, app record, version id. Ordering of the
 * seed calls is load-bearing — see src/test/app-builder/seed.js.
 */
function seedFreshApp() {
  const s = state();
  s.initializeDependencySlice('canvas');
  s.setPages([{ id: 'home-1', handle: 'home', name: 'Home', components: {} }], 'canvas');
  s.setCurrentPageId('home-1', 'canvas');
  s.setComponentNameIdMapping('canvas');
  s.initDependencyGraph('canvas');
  s.setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'home-1', slug: 'slug-app-1' }, 'canvas');
  s.setCurrentVersionId('version-1');
}

beforeEach(() => {
  server.use(
    // Autosave create fired by addNewPage -> savePageChanges.
    http.post('http://localhost:3000/api/v2/apps/:appId/versions/:versionId/pages', () =>
      HttpResponse.json({}, { status: 201 })
    ),
    // Fired unconditionally by the popup's nav-item-with-app effect on mount.
    http.get('http://localhost:3000/api/apps/addable', () => HttpResponse.json({ apps: [] }))
  );
});

afterEach(async () => {
  // Let any pending doSwitch continuation finish inside THIS test, then
  // reclaim the exposed-value bracket switchPage opened (pageSwitch.spec.js).
  await act(async () => {
    await settle();
  });
  while (state().isExposedValueBatching()) state().flushExposedValueBatch();
});

describe('AddEditPagePopup auto-create (mode: add)', () => {
  test('creates exactly ONE page, even though the store push re-renders synchronously', async () => {
    seedFreshApp();
    state().setNewPagePopupConfig({ show: true, mode: 'add', type: 'default' });

    // Before the fix this render throws "Maximum update depth exceeded":
    // auto-create effect -> addNewPage() store push -> nested sync re-render ->
    // effect re-enters with hasAutoSaved still false -> creates again…
    await act(async () => {
      render(<AddEditPagePopup darkMode={false} />);
    });
    await act(async () => {
      await settle();
    });

    const pages = state().modules.canvas.pages;
    expect(pages.map((p) => p.name)).toEqual(['Home', 'Page 1']);
    expect(pages).toHaveLength(2);
  });

  test('the auto-created page is a default page with a kebab-case handle', async () => {
    seedFreshApp();
    state().setNewPagePopupConfig({ show: true, mode: 'add', type: 'default' });

    await act(async () => {
      render(<AddEditPagePopup darkMode={false} />);
    });
    await act(async () => {
      await settle();
    });

    const created = state()
      .modules.canvas.pages.filter((p) => p.id !== 'home-1')
      .pop();
    expect(created).toMatchObject({ name: 'Page 1', handle: 'page-1', type: 'default', isPageGroup: false });
  });
});
