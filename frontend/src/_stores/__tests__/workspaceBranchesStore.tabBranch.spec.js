// Each tab keeps its own branch across refreshes, even when another tab switched branches.
// A refresh = re-importing modules: memory is lost, sessionStorage survives.
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';

const MAIN = { id: 'branch-main', name: 'main', is_default: true };
const FEATURE = { id: 'branch-feature', name: 'feat-branch-1', is_default: false };

// Server last-used = feature branch (another tab switched to it).
function serveBranches() {
  server.use(
    http.get('*/workspace-branches', () =>
      HttpResponse.json({ branches: [MAIN, FEATURE], active_branch_id: FEATURE.id })
    )
  );
}

function openUrl(path) {
  window.history.replaceState(null, '', path);
}

// Fresh modules = page load in the same tab.
function loadPage() {
  let modules;
  jest.isolateModules(() => {
    modules = {
      activeBranch: require('@/_helpers/active-branch'),
      store: require('@/_stores/workspaceBranchesStore').useWorkspaceBranchesStore,
    };
  });
  modules.store.setState({ isGitSyncConfigured: true });
  return modules;
}

async function resolveBranch(store) {
  await store.getState().actions.fetchBranches();
  return store.getState().currentBranch?.name;
}

describe("a tab's branch", () => {
  beforeEach(() => {
    sessionStorage.clear();
    serveBranches();
  });

  it("survives a refresh on a page without ?branch, instead of taking another tab's branch", async () => {
    openUrl('/workspace-1?branch=main');
    const firstLoad = loadPage();
    expect(await resolveBranch(firstLoad.store)).toBe('main');

    // Refresh on a branch-agnostic page.
    openUrl('/workspace-1/home');
    const afterRefresh = loadPage();

    expect(afterRefresh.activeBranch.appendBranchName('/workspace-1')).toBe('/workspace-1?branch=main');
    openUrl('/workspace-1');
    expect(await resolveBranch(afterRefresh.store)).toBe('main');
  });

  it('follows the URL when it names a branch', async () => {
    openUrl('/workspace-1?branch=main');
    expect(await resolveBranch(loadPage().store)).toBe('main');

    openUrl('/workspace-1?branch=feat-branch-1');
    expect(await resolveBranch(loadPage().store)).toBe('feat-branch-1');
  });

  it('ignores a branch this tab remembered from another workspace', async () => {
    sessionStorage.setItem('tj-tab-branch', JSON.stringify({ id: 'other-workspace-branch', name: 'main' }));
    openUrl('/workspace-1');

    expect(await resolveBranch(loadPage().store)).toBe('feat-branch-1');
  });

  it("starts a brand-new tab on the user's last-used branch", async () => {
    openUrl('/workspace-1');
    expect(await resolveBranch(loadPage().store)).toBe('feat-branch-1');
  });
});
