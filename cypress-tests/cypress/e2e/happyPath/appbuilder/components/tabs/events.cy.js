import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { addMultiEventsWithAlert } from "Support/utils/appBuilder/events";
import { openEditorSidebar } from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Tabs — events facet', { testIsolation: false }, () => {
    const W = 'tabs1'; // runtimeCandidate from tabs-surface.yaml

    // The tabs widget renders three default tab items (Tab 1 / Tab 2 / Tab 3)
    // from the `tabItems` definition default — source: tabs.js:412-443.
    // Each tab is a <li class="nav-item"> inside <ul class="nav">.
    // The default active tab is `t0` (Tab 1); clicking Tab 2 (`t1`) switches
    // the active tab and fires onTabSwitch — source: tabs.js:397.

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Tabs-Events-App`);
        cy.openApp();
        cy.dragAndDropWidget('Tabs', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── On tab switch ───────────────────────────────────────────────────────────
    // source: tabs.js:160
    it('On tab switch — fires when a different tab header is clicked', () => {
        openEditorSidebar(W);
        // Wire the event so a Show Alert action fires when the tab changes.
        const events = [{ event: 'On tab switch', message: 'On tab switch Event' }]; // dynamic
        addMultiEventsWithAlert(events);
        // Allow the autosave to persist the event handler before triggering.
        cy.waitForAutoSave();
        cy.forceClickOnCanvas();
        cy.wait(1000);

        // Click Tab 2 (nav-item index 1, id "t1") to switch from the default
        // active tab (Tab 1 / t0) and fire onTabSwitch.
        // The click target is the <li class="nav-item"> element inside the
        // <ul class="nav"> rendered within the tabs widget wrapper.
        // RESOLVE-LIVE: if .nav-item does not match at runtime, try
        // `[data-cy="draggable-widget-tabs1"] [role="tab"]:eq(1)` as a fallback.
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .find('.nav-item')
            .eq(1) // index 1 → Tab 2 (title "Tab 2", id "t1") — source: tabs.js:424-433
            .click({ force: true });

        // Observable effect: the Show Alert toast containing our wired message.
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On tab switch Event', false); // dynamic
    });
});
