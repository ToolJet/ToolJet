import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";

// Flow #11 from the dev→prod user-flows gist:
//   "App pins to a specific module version at building [current branch or any
//    version]. Updating the module on Dev does not silently change behaviour
//    of an already-released app version on Prod until the app is re-released."
//
// HEAVY SCOUT REQUIRED — version-pinning UX (the dropdown that appears when an
// app embeds a module) hasn't been captured yet. The structure below shows the
// shape of the test; the IT body is TODO until the live UI is scouted.
//
// Open scout questions:
//   1. When the user drops a Module widget on an app canvas, is there a version
//      dropdown? What's its data-cy and how do we select v1 vs v2?
//   2. What's the "release" UX for a module on a branch (vs an app)?
//   3. After releasing the embedding app on Prod, what API/UI signal proves the
//      pin is locked to v1's content?
describe(
  "Git Sync — Flow #11: Module version pinning to released app",
  { retries: 0 },
  () => {
    const testId = Date.now();
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

    it.skip("Released app on Prod stays on pinned module v1 even after Dev module updates to v2", () => {
      // TODO scout (before un-skipping):
      //   - module version dropdown on app's embedded Module widget
      //   - module release/save-version flow in editor
      //
      // Once scouted, the test should:
      //   1. Dev: create module, save as v1 with content A.
      //   2. Dev: create app, embed module pinned to v1.
      //   3. Push branch → merge → pull Prod.
      //   4. Prod: release app → launch released version → assert content A.
      //   5. Dev: update module to v2 with content B → push → merge → pull Prod.
      //   6. Prod: re-launch released app → assert content STILL A (not B).
      //   7. Prod: re-release the app → re-launch → assert content NOW B.
    });
  },
);
