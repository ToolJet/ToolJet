import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";

// Flow #11 from the dev→prod user-flows gist:
//   "App pins to a specific module version at building [current branch or any
//    version]. Updating the module on Dev does not silently change behaviour
//    of an already-released app version on Prod until the app is re-released."
//
// ─────────────────────────────────────────────────────────────────────────────
// CURRENT STATUS — SKELETON, BLOCKED. Needs further scouting + product work.
// ─────────────────────────────────────────────────────────────────────────────
//
// What this flow needs to verify:
//   1. Dev: create module v1 with content A.
//   2. Dev: create app embedding the module pinned to v1.
//   3. Push → merge → pull on Prod.
//   4. Prod: release app → launch released version → assert content A.
//   5. Dev: update the module to v2 with content B → push → merge → pull Prod.
//   6. Prod: re-launch the released app → assert content STILL A (not B).
//   7. Prod: re-release the app → re-launch → assert content NOW B.
//
// Why it's blocked from automation today:
//   1. "Release app" on Prod is gated by writable-branch state. After
//      git-sync pull, Prod is on read-only `master` and the Release CTA
//      isn't exposed in the env-tag dropdown — same blocker that capped
//      Flow #3 and that we'd need a Prod-side feature-branch helper for.
//   2. Module version pinning via the components diff uses
//      `properties.moduleVersionId.value = <module_reference_id>`. We
//      know the schema (Flow #9's ModuleViewer wires it with `""` for
//      follow-latest), but pinning to a specific version requires
//      reading the module's `AppVersion.module_reference_id` from the
//      app-versions API — not yet wired into our test helpers.
//   3. "Launch released version" is the deployed/viewer URL that depends
//      on the app being released. We could fake-release via API if we
//      know the right endpoint, but we haven't traced it (see Flow #3
//      header for context on the locked-master block).
//
// What needs to happen before this can be un-skipped:
//   - Test helper for module version capture:
//       cy.apiGetModuleVersionReferenceId(moduleId, branchId) → returns
//       the AppVersion.module_reference_id for the editing version.
//   - Test helper for release on Prod (or a Prod-side branch-create
//     helper that unblocks the existing UI release flow).
//   - Trace: capture how the editor "Save as new version" + the
//     subsequent module content update creates a fresh
//     module_reference_id. Pinning is meaningless if a content update
//     in-place keeps the same reference id.
//   - Decide: do we exercise the "follow-latest" branch of the contract
//     (moduleVersionId === '') as well? That would test the OTHER end
//     of the pinning behaviour — useful for a non-regression baseline.
//
// The skeleton stays here as the trackable home for the flow. When the
// blockers above are cleared, this file gets the same shape as flows
// #3 / #7 / #9: setup → author with API (incl. specific version pin) →
// push → merge → pull on Prod → release → launch → assert pinned content
// → bump module on Dev → push → merge → pull → assert pinned content
// HASN'T changed → re-release on Prod → assert content NOW reflects the
// new module version.
describe(
  "Git Sync — Flow #11: Module version pinning to released app",
  { retries: 0 },
  () => {
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const devWsName = `gitsync-dev-${testId}`;
    const prodWsName = `gitsync-prod-${testId}`;
    const branchName = `test-flow11-${testId}`;

    const devIdRef = { value: null };
    const prodIdRef = { value: null };

    before(() => {
      Cypress.config("redirectionLimit", 20);
      gitSyncDualWs.setupDevAndProd({
        devName: devWsName,
        prodName: prodWsName,
        devIdRef,
        prodIdRef,
      });
    });

    after(() => {
      gitSyncDualWs.teardown({ devIdRef, prodIdRef, branchName });
    });

    it.skip(
      "Released app on Prod stays on pinned module v1 even after Dev module updates to v2",
      () => {
        // Blocked — see file header.
        //
        // Once unblocked, the IT body shape is:
        //   1. Dev: apiCreateModule, add a marker Text "v1-marker-{testId}".
        //   2. Dev: capture module's AppVersion.module_reference_id (= v1id).
        //   3. Dev: apiCreateAppOnBranch + ModuleViewer with
        //      properties.moduleVersionId = v1id (pinned).
        //   4. Dev: apiEditorPush(module) + apiEditorPush(app)
        //      + apiGitSyncPush. PR + merge.
        //   5. Prod: pullMaster → open app → release → launch.
        //   6. Assert launched app shows "v1-marker-{testId}".
        //   7. Dev: bump module to v2 (new module_reference_id, new content
        //      "v2-marker-{testId}"). Push → merge → pull Prod.
        //   8. Prod: re-launch released app → assert STILL "v1-marker".
        //   9. Prod: re-release app → re-launch → assert NOW "v2-marker".
      },
    );
  },
);
