/**
 * extraSparsePathsForHydrate — the sparse-checkout cone a hydrate runs with.
 *
 * hydrateStubApp clones exactly one folder (`paths: [resourceFolder]`), then widens the cone for
 * the cascades that follow. Each cascade reads referenced content straight off disk via
 * `listGitResources(repoPath, …)`, so a folder left out of the cone makes that cascade list
 * nothing and create nothing — `imported: 0`, no error, no log. The failure surfaces much later
 * as an embedded resource whose target row never existed.
 *
 * That is exactly how `workflows` was missed: only `data-sources` and `modules` were added, so
 * Phase 11 Step 11.1's create-the-missing-workflow self-heal ran on an empty listing. A workflow
 * newly referenced by a pulled app got its query row and nothing else, and running it failed with
 * `Workflow "<co_relation_id>" not found in this workspace`. See ../fixes.md.
 *
 * A pure function so the invariant is testable without mocking simple-git and the on-disk
 * resource lookup, which would only assert that git was called with certain arguments.
 *
 * @group workflows
 */
import { extraSparsePathsForHydrate } from '@ee/platform-git-sync/pull.service';
import { APP_TYPES } from '@modules/apps/constants';

describe('extraSparsePathsForHydrate', () => {
  it('always includes workflows — an app, a module and a workflow can all embed one', () => {
    for (const type of [APP_TYPES.FRONT_END, APP_TYPES.MODULE, APP_TYPES.WORKFLOW, undefined]) {
      expect(extraSparsePathsForHydrate(type)).toContain('workflows');
    }
  });

  it('always includes data-sources, which deriveDataSourcesFromQueries reads', () => {
    for (const type of [APP_TYPES.FRONT_END, APP_TYPES.MODULE, APP_TYPES.WORKFLOW, undefined]) {
      expect(extraSparsePathsForHydrate(type)).toContain('data-sources');
    }
  });

  it('includes modules only for a front-end app — nothing else can embed a module', () => {
    expect(extraSparsePathsForHydrate(APP_TYPES.FRONT_END)).toContain('modules');
    expect(extraSparsePathsForHydrate(APP_TYPES.MODULE)).not.toContain('modules');
    expect(extraSparsePathsForHydrate(APP_TYPES.WORKFLOW)).not.toContain('modules');
  });

  it('does not add the resource folder the clone already materialized', () => {
    // `paths: [resourceFolderForApp(stubApp)]` covers it; re-adding would be a no-op fetch.
    expect(extraSparsePathsForHydrate(APP_TYPES.FRONT_END)).not.toContain('apps');
  });

  it('returns each folder once, so no add is issued twice', () => {
    for (const type of [APP_TYPES.FRONT_END, APP_TYPES.MODULE, APP_TYPES.WORKFLOW]) {
      const paths = extraSparsePathsForHydrate(type);
      expect(paths).toHaveLength(new Set(paths).size);
    }
  });

  it('matches the exact cone per app type', () => {
    expect(extraSparsePathsForHydrate(APP_TYPES.FRONT_END)).toEqual(['data-sources', 'modules', 'workflows']);
    expect(extraSparsePathsForHydrate(APP_TYPES.MODULE)).toEqual(['data-sources', 'workflows']);
    expect(extraSparsePathsForHydrate(APP_TYPES.WORKFLOW)).toEqual(['data-sources', 'workflows']);
  });
});
