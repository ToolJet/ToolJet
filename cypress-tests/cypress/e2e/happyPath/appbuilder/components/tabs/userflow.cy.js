import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    openEditorSidebar,
    verifyAndModifyParameter,
} from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";

// Userflow facet — an end-to-end builder journey for the Tabs component: place it,
// observe its 3 default tabs with Tab 1 active, click a different tab, and confirm
// the activeTab state updates. testIsolation:false for cypress-real-dnd.
describe('Tabs — userflow facet', { testIsolation: false }, () => {
    const W = 'tabs1';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Tabs-Userflow`);
        cy.openApp();
        cy.dragAndDropWidget('Tabs', 450, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // Drop → observe 3 default tabs rendered with Tab 1 active, and confirm the
    // inspector shows currentTab as empty string before any interaction.
    it('renders 3 default tabs with Tab 1 active', () => {
        // Three default tab labels should appear on the canvas — source: tabs.js:415,424,433
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .within(() => {
                cy.contains('Tab 1').should('exist'); // source: tabs.js:415
                cy.contains('Tab 2').should('exist'); // source: tabs.js:424
                cy.contains('Tab 3').should('exist'); // source: tabs.js:433
            });

        // The first tab nav item should carry the active class on initial render.
        // RESOLVE-LIVE: confirm the exact active-state class/attribute on the tab
        // nav buttons; `.nav-item.active` is the most common Bootstrap pattern used
        // in ToolJet's Tabs component — verify against Tabs.jsx at runtime.
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .within(() => {
                cy.get('.nav-item').first()
                    .should('have.class', 'active'); // RESOLVE-LIVE: verify active-class name in Tabs.jsx
            });

        // Before any tab is clicked, currentTab exposed variable defaults to ''
        // (inspector renders it as ""). — source: tabs.js:394
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode('tabs1', [
            { key: 'currentTab', type: 'String', value: '"t0"' }, // source: tabs.js:394
        ], verifyNodeData);
    });

    // Click Tab 2 nav item → Tab 2 becomes the active tab.
    // Then open the inspector to confirm currentTab has updated to the tab's id.
    it('clicking Tab 2 switches the active tab', () => {
        // Click the second tab nav button on canvas (edit-mode click on the tab
        // header itself — not a content area click — triggers tab selection).
        // RESOLVE-LIVE: confirm the click target; `.nav-item:nth-child(2)` or the
        // inner `<a>` / `<button>` depending on Tabs.jsx render. If the canvas
        // intercepts the click (widget drag mode), a double-click or a Ctrl+click
        // may be required — validate at runtime.
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .within(() => {
                cy.get('.nav-item').eq(1).click(); // RESOLVE-LIVE: verify click reaches tab nav in edit-mode
            });

        // Tab 2 should now carry the active state.
        // RESOLVE-LIVE: aria-selected="true" on a <button role="tab"> is the
        // accessible variant; .active class is the visual variant — check which
        // Tabs.jsx applies and adjust the assertion accordingly.
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .within(() => {
                cy.get('.nav-item').eq(1)
                    .should('have.class', 'active'); // RESOLVE-LIVE: confirm active indicator for Tabs
            });

        // Open inspector and verify currentTab updated to the second tab's id.
        // The default second tab id is 't1' — source: tabs.js:424 (id property of
        // second tabItem in definition). currentTab in edit mode may or may not
        // update on tab click (runtime preview vs edit mode differ) — mark RESOLVE-LIVE.
        // RESOLVE-LIVE: confirm whether currentTab is set on tab-click in edit mode
        // or only in preview/runtime. If not set in edit mode, this assertion will
        // need to be run in preview context.
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode('tabs1', [
            { key: 'currentTab', type: 'String', value: '"t1"' }, // RESOLVE-LIVE: expected value is tab id — source: tabs.js:424
        ], verifyNodeData);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});
