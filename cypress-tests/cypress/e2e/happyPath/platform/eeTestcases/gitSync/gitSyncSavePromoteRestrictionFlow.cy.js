import { gitSyncDualWs } from "Support/utils/platform/gitSyncDualWs";

// Flow #10 from the dev→prod user-flows gist:
//   "App embedding a module → save/promote blocked unless module has same or
//    higher env available on the target instance.
//    Verify restriction message is shown on save and on promote."
//
// ─────────────────────────────────────────────────────────────────────────────
// CURRENT STATUS — SKELETON, BLOCKED. Needs further scouting + product work.
// ─────────────────────────────────────────────────────────────────────────────
//
// What this flow needs to verify:
//   - A module exists only in `development` env on Prod (no staging/prod).
//   - An app on Prod embeds that module via ModuleViewer.
//   - Clicking "Save" on the app → restriction message ("module not
//     available in this env").
//   - Clicking "Promote" on the app → restriction message.
//
// Why it's blocked from automation today:
//   1. The save/promote actions are gated by writable-branch state on Prod.
//      After our git-sync pull, Prod is on `master` which is read-only —
//      same blocker that prevented Flow #3 from automating promote/release.
//      To click Save / Promote on Prod we'd first need to create a feature
//      branch on Prod and switch to it, OR develop a different test rig
//      that puts the workspace in a writable state.
//   2. The "module env" concept (dev / staging / production for modules,
//      rather than for apps) is not yet exposed via a stable data-cy. The
//      restriction message text and its container also need a scout pass —
//      we couldn't find a `data-cy="restriction-..."` selector in the
//      frontend during the Flow #9 scouting we did.
//   3. The API-level equivalents of "save app" + "promote app" with the
//      restriction enforcement aren't documented end-to-end. We'd need to
//      trace which endpoint the frontend hits when Save is clicked and
//      whether the same 4xx/restriction body is returned at the API.
//
// What needs to happen before this can be un-skipped:
//   - Frontend: add stable data-cy selectors for the module-env selector,
//     the save/promote restriction message wrapper, and the message text
//     container.
//   - Test side: add a `gitSyncCreateBranchOnProd` helper or equivalent
//     so we can land on a writable branch after pull (mirror of the
//     existing `gitSyncCreateBranchViaApi` but invoked against Prod's
//     workspace context).
//   - Scout: capture the network request/response for "Save app on
//     locked module env" via DevTools so the API-only path can be
//     tested without the UI restriction render.
//
// The skeleton stays here as the trackable home for the flow. When the
// blockers above are cleared, this file gets the same shape as flows
// #3 / #7 / #9: setup → author with API → push → merge → pull on Prod →
// branch-on-Prod → attempt save → assert restriction → attempt promote
// → assert restriction.
describe(
  "Git Sync — Flow #10: App with module — save/promote restriction",
  { retries: 0 },
  () => {
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

    it.skip(
      "App embedding higher-env module → save blocked with restriction message",
      () => {
        // Blocked — see file header.
        //
        // Once unblocked, the IT body shape is:
        //   1. Dev: create module v1, ensure it exists only in `development` env.
        //   2. Dev: create app embedding module via ModuleViewer.
        //   3. Push (apiEditorPush + apiGitSyncPush). PR + merge.
        //   4. Prod: pullMaster.
        //   5. Prod: create a feature branch (needs new helper).
        //   6. Prod: switch to feature branch + open the app.
        //   7. Click Save → assert restriction message visible.
      },
    );

    it.skip(
      "App embedding higher-env module → promote blocked with restriction message",
      () => {
        // Blocked — see file header.
        //
        // Once unblocked, after the Save-restriction assertion in the
        // previous test, click Promote → assert restriction message visible.
      },
    );
  },
);
