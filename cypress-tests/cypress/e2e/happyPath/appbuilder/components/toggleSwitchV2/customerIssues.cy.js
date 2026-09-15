import { fake } from "Fixtures/fake";

// customerIssues facet — STUB.
//
// TODO: no GitHub / ClickUp issue links were supplied for the Toggle Switch, so
// there is nothing to regress against yet. To generate real cases, re-run:
//
//   /tj-build-cypress-components toggleswitchv2 --facet=customerIssues
//
// with the issue links, and add one `it` per tracked issue titled
// `[<issue-id>] <one-line symptom>` that reproduces the reported flow and
// asserts the fixed behaviour.
//
// Candidate starting points from this component's own findings (see
// .superpowers/sdd/plan-toggleswitchv2.md):
//   - definition.styles has no `uncheckedColor` <-> `toggleSwitchColor` key
//     symmetry with the style key names (toggleswitchv2.js:114 declares
//     `toggleSwitchColor` but its displayName is 'Checked color').
//   - `isValid` is exposed at runtime (ToggleV2.jsx:232) but is absent from
//     config.exposedVariables (toggleswitchv2.js:169-176).
//
// testIsolation:false for cypress-real-dnd, kept so the file is ready to fill in.
describe('Toggle Switch — customerIssues facet', { testIsolation: false }, () => {
    const W = 'toggleswitch1'; // computeComponentName from config name 'ToggleSwitch'

    beforeEach(() => {
        cy.apiLogin();
        // fake.companyName is just the first word of a company name (fake.js:19-22)
        // — a small pool, so repeat local runs collide on POST /api/apps (409
        // "This app name is already taken") and abort the suite from beforeEach.
        cy.apiCreateApp(`${fake.companyName}-ToggleSwitch-CustomerIssues-${Date.now().toString().slice(-6)}`);
        cy.openApp();
        cy.dragAndDropWidget('Toggle Switch', 450, 200); // source: toggleswitchv2.js:3
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('[STUB] add one it-block per tracked customer issue', () => {
        // TODO: replace with a real regression once issue links are provided.
        cy.log(W);
    });
});
