import { fake } from "Fixtures/fake";

// customerIssues facet — STUB.
//
// No GitHub / ClickUp issue links were supplied for the Tabs component, so
// there is nothing to regress against yet. To activate this file:
//
//   1. Identify tracked issues for Tabs (GitHub issues / ClickUp tasks).
//   2. Re-run:
//        /tj-build-cypress-components tabs --facet=customerIssues
//      with the issue links supplied in the prompt, OR
//   3. Manually add one `it` per issue, titled:
//        `[<issue-id>] <one-line symptom>`
//      that reproduces the reported flow and asserts the fixed behaviour.
//
// Candidate areas to watch for regressions (derived from existing tabs facets):
//   - Tab header hidden via hideTabs=true not restoring on toggle-off (properties.cy.js)
//   - renderOnlyActiveTab=true incorrectly hiding scrollToTopOnTabSwitch control
//     before the value is committed (properties.cy.js:96)
//   - currentTab / currentTabTitle not updating in edit-mode inspector on tab
//     click (userflow.cy.js RESOLVE-LIVE — confirm at runtime)
//   - setTab CSA not switching the active tab in preview when tabId is numeric
//     vs string mismatch (csa.cy.js)
//
// testIsolation:false kept so the file is ready to fill in without scaffolding changes.
describe('Tabs — customerIssues facet', { testIsolation: false }, () => {
    it.skip('[STUB] add one it-block per tracked customer issue', () => {
        // TODO: add regression tests for tracked issues — provide GitHub/ClickUp
        // issue links to activate. See comment block at the top of this file.
        cy.log('stub — no issue links provided');
    });
});
