/**
 * SPEC — Number Input — contexts facet.
 * FOR AI: 1 case — device context: Show on desktop / Show on mobile gate the widget
 * across the desktop + mobile layouts (dynamic). (Exposed-value reflection → inspector.cy.js.)
 * Pattern mirrors the Modal V2 contexts facet (PR #17848).
 * Helpers: openEditorSidebar, openAccordion, verifyAndModifyToggleFx.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    openEditorSidebar,
    openAccordion,
    verifyAndModifyToggleFx,
} from "Support/utils/commonWidget";

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Number Input — contexts facet', { testIsolation: false }, () => {
    const W = 'numberinput1';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-NIContexts-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget('Number Input', 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // Device-visibility context: Show on desktop (default ON) / Show on mobile
    // (default OFF) gate the widget across the desktop + mobile layouts.
    // source: numberinput.js:11 / numberinput.js:12
    it('device context — Show on desktop / Show on mobile gate the widget', () => {
        openEditorSidebar(W);
        openAccordion('Devices');

        // Show on desktop default {{true}} → flip OFF → widget removed from desktop
        verifyAndModifyToggleFx('Show on desktop', '{{true}}');
        cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');

        // restore desktop visibility (flip back ON)
        verifyAndModifyToggleFx('Show on desktop', '{{false}}');
        cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');

        // Show on mobile default {{false}} → widget absent on the mobile layout
        cy.get(commonWidgetSelector.changeLayoutToMobileButton).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        cy.get(commonWidgetSelector.changeLayoutToDesktopButton).click();

        // enable Show on mobile → widget now present on the mobile layout
        openEditorSidebar(W);
        openAccordion('Devices');
        verifyAndModifyToggleFx('Show on mobile', '{{false}}'); // flips ON
        cy.get(commonWidgetSelector.changeLayoutToMobileButton).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        cy.get(commonWidgetSelector.changeLayoutToDesktopButton).click();
    });
});
