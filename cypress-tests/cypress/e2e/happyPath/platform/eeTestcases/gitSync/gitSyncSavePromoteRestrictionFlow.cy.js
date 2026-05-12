import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";

// Flow #10 from the dev→prod user-flows gist:
//   "App embedding a module → save/promote blocked unless module has same or
//    higher env available on the target instance.
//    Verify restriction message is shown on save and on promote."
//
// HEAVY SCOUT REQUIRED — the "env" concept on modules + the restriction message
// don't have selectors yet. This file is a placeholder structure; the IT body
// is intentionally TODO until the live UI is scouted.
//
// Open scout questions:
//   1. Where is module env set? Is it dev/staging/production like apps, or a
//      module-specific concept?
//   2. What event triggers the restriction — clicking Save? Clicking Promote?
//   3. What's the exact message text + its data-cy?
//   4. Is the restriction enforced in the UI (toast/modal) or in the API
//      response?
describe(
  "Git Sync — Flow #10: App with module — save/promote restriction",
  { retries: 0 },
  () => {
    const testId = Date.now();
    const devWsName = `gitsync-dev-${testId}`;
    const prodWsName = `gitsync-prod-${testId}`;
    const branchName = `test-flow10-${testId}`;

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

    it.skip("App embedding higher-env module → save blocked with restriction message", () => {
      // TODO scout (before un-skipping):
      //   - selectors for module env selector / version-env mapping
      //   - the exact UI flow that triggers the restriction
      //   - the exact restriction message text
      //   - what data-cy wraps the restriction message
      //
      // Once scouted, the test should:
      //   1. On Dev: build module v1 in DEV env only.
      //   2. On Dev: build app embedding the module.
      //   3. Push, merge, pull on Prod.
      //   4. On Prod: try to save the app → expect restriction message X.
      //   5. On Prod: try to promote the app → expect restriction message Y.
    });

    it.skip("App embedding higher-env module → promote blocked with restriction message", () => {
      // TODO: see above.
    });
  },
);
