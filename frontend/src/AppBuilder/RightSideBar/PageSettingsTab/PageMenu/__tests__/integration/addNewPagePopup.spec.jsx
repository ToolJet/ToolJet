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
import { render, act, fireEvent, screen, waitFor } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { AddEditPagePopup } from '../../AddNewPagePopup';
import { AddNewPageMenu } from '../../AddNewPageMenu';
import { PageGroupItem } from '../../PageGroupItem';
// Imported last: imported first, PageSettings enters the ColorSwatches import cycle before it resolves.
import { PageSettings } from '@/AppBuilder/RightSideBar/PageSettingsTab/PageSettings';

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

describe('AddEditPagePopup embedded in the right panel', () => {
  // The page configuration panel embeds the popup and shares newPagePopupConfig with the Pages panel's
  // floating popups. Only the floating "New page" popup may create the page.
  test('New page with a page configuration open creates ONE page, not one per mounted popup', async () => {
    seedFreshApp();
    state().setEditingPage(state().modules.canvas.pages[0]);
    state().setNewPagePopupConfig({ show: true, mode: 'edit', type: 'default' });
    await act(async () => {
      render(<AddEditPagePopup darkMode={false} embedded onClose={() => {}} />);
    });

    await act(async () => {
      state().setNewPagePopupConfig({ show: true, mode: 'add', type: 'default' });
      render(<AddEditPagePopup darkMode={false} />);
    });
    await act(async () => {
      await settle();
    });

    expect(state().modules.canvas.pages.map((p) => p.name)).toEqual(['Home', 'Page 1']);
  });
});

// HP-47b: in one open page configuration, renaming A → B and then back to A must save A again.
describe('AddEditPagePopup page name', () => {
  test('renaming a page back to its original name saves it', async () => {
    server.use(
      http.put('http://localhost:3000/api/v2/apps/:appId/versions/:versionId/pages/:pageId', () =>
        HttpResponse.json({})
      ),
      http.patch('http://localhost:3000/api/v2/apps/:appId/versions/:versionId/pages/:pageId', () =>
        HttpResponse.json({})
      )
    );
    seedFreshApp();
    state().setEditingPage(state().modules.canvas.pages[0]);
    state().setNewPagePopupConfig({ show: true, mode: 'edit', type: 'default' });
    let view;
    await act(async () => {
      view = render(<AddEditPagePopup darkMode={false} embedded onClose={() => {}} />);
    });
    const nameInput = () => view.container.querySelector('input.form-control[type="text"]');
    const rename = async (value) => {
      await act(async () => {
        fireEvent.change(nameInput(), { target: { value } });
        fireEvent.blur(nameInput());
      });
    };

    await rename('Main');
    expect(state().modules.canvas.pages[0].name).toBe('Main');

    await rename('Home');
    expect(state().modules.canvas.pages[0].name).toBe('Home');
  });
});

// LR-23: page popups open from rows and buttons inside the Pages panel. Measured from those, New page and
// Edit page details opened over the panel and Edit group off the left edge of the screen.
describe('[LR-23] page popups open past the Pages panel', () => {
  const PANEL = { x: 54, y: 48, left: 54, top: 48, right: 404, bottom: 852, width: 350, height: 804 };
  // Every element inside the panel stands in for the row or button a popup opens from.
  const ROW = { x: 64, y: 200, left: 64, top: 200, right: 343, bottom: 232, width: 279, height: 32 };
  const controls = createAppBuilderControls();
  let rect;

  beforeEach(() => {
    controls.observers.install();
    rect = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.classList.contains('sidebar-h-100-popover')) return PANEL;
      return this.closest('.sidebar-h-100-popover')
        ? ROW
        : { ...ROW, x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0 };
    });
    seedFreshApp();
    const s = state();
    s.setPages(
      [
        ...s.modules.canvas.pages,
        { id: 'group-1', name: 'Group A', handle: 'group-a', isPageGroup: true, icon: 'IconFolder', components: {} },
      ],
      'canvas'
    );
    s.setPageSettings(s.computePageSettings({}), 'canvas');
  });

  afterEach(() => {
    rect.mockRestore();
    controls.restore();
  });

  const openInPagesPanel = async (ui, open) => {
    const { unmount } = render(
      <ModuleProvider moduleId="canvas" isModuleMode={false}>
        <div className="sidebar-h-100-popover">
          <div className="left-sidebar-panel-content">{ui}</div>
        </div>
      </ModuleProvider>
    );
    await open();
    await waitFor(() => {
      const popup = document.getElementById('add-new-page-popup');
      expect(popup).toHaveAttribute('data-popper-placement', 'right-start');
      expect(popup.style.transform).toMatch(/^translate\(412px, /);
    });
    // A mounted row cannot render once the store resets after the test.
    unmount();
  };

  test('New page opens 8px past the panel', () =>
    openInPagesPanel(<AddNewPageMenu darkMode={false} />, async () => {
      fireEvent.click(screen.getByRole('button', { name: /new page/i }));
    }));

  test('Edit group opens 8px past the panel, not off the left edge', () =>
    openInPagesPanel(<PageGroupItem page={state().modules.canvas.pages[1]} darkMode={false} />, async () => {
      fireEvent.click(screen.getByText('Group A'));
    }));
});

// UC-14: with 19 pages New page sat below the fold, and reaching it scrolled the panel title away. It sits in
// a footer below the tabs, outside the region that scrolls, on either tab.
test('[UC-14] New page sits in the Pages panel footer, outside the scrolling tabs', async () => {
  const controls = createAppBuilderControls();
  controls.observers.install();
  seedFreshApp();
  const s = state();
  s.setPages(
    [
      ...s.modules.canvas.pages,
      ...Array.from({ length: 18 }, (_, i) => ({
        id: `page-${i + 2}`,
        name: `Page ${i + 2}`,
        handle: `page-${i + 2}`,
        components: {},
      })),
    ],
    'canvas'
  );
  s.setPageSettings(s.computePageSettings({}), 'canvas');
  let view;
  await act(async () => {
    view = render(
      <ModuleProvider moduleId="canvas" isModuleMode={false}>
        <PageSettings surface="navigation" onClose={() => {}} />
      </ModuleProvider>
    );
  });

  expect(screen.getByText('Page 19')).toBeInTheDocument();
  const newPage = screen.getByRole('button', { name: /new page/i });
  const inTabs = () => screen.getAllByRole('tabpanel', { hidden: true }).some((panel) => panel.contains(newPage));
  expect(inTabs()).toBe(false);

  fireEvent.click(screen.getByRole('tab', { name: 'Styles' }));
  expect(screen.getByRole('button', { name: /new page/i })).toBe(newPage);
  expect(inTabs()).toBe(false);
  view.unmount();
  controls.restore();
});
