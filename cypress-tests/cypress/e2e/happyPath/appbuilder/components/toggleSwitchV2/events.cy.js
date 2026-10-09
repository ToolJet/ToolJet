import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { addMultiEventsWithAlert } from "Support/utils/appBuilder/events";
import { openEditorSidebar } from "Support/utils/commonWidget";

// Events facet — config.events for the Toggle Switch is a single handle.
// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Toggle Switch — events facet', { testIsolation: false }, () => {
    const W = 'toggleswitch1'; // computeComponentName from config name 'ToggleSwitch'
    const INNER = `[data-cy="${W}"]`; // ToggleV2.jsx:264
    const SWITCH = `${INNER} > div > div.d-flex`; // ToggleV2.jsx:66 — onClick=handleToggleChange

    beforeEach(() => {
        cy.apiLogin();
        // fake.companyName is just the first word of a company name (fake.js:19-22)
        // — a small pool, so repeat local runs collide on POST /api/apps (409
        // "This app name is already taken") and abort the suite from beforeEach.
        cy.apiCreateApp(`${fake.companyName}-ToggleSwitch-Events-App-${Date.now().toString().slice(-6)}`);
        cy.openApp();
        cy.dragAndDropWidget('Toggle Switch', 500, 100); // source: toggleswitchv2.js:3
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── On change ─────────────────────────────────────────────────────────────
    // source: toggleswitchv2.js:95 (onChange, displayName 'On change')
    it('On change — fires when the switch is toggled', () => {
        openEditorSidebar(W);
        const events = [{ event: 'On change', message: 'On change Event' }]; // dynamic: alert text
        addMultiEventsWithAlert(events);

        // The Show-Alert message must persist before we trigger: the FIRST
        // toggle after configuring can otherwise fire the DEFAULT "Hello world!"
        // message (the custom one hasn't propagated yet). Autosave + settle.
        cy.waitForAutoSave();
        cy.forceClickOnCanvas();
        cy.wait(1000);

        // handleToggleChange (ToggleV2.jsx:23-27) flips `on` and calls
        // fireEvent('onChange'); it fires in edit mode.
        cy.get(SWITCH).scrollIntoView().click({ force: true });

        cy.verifyToastMessage(commonSelectors.toastMessage, 'On change Event', false); // dynamic
    });
});
