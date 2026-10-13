/**
 * SPEC — Number Input — userflow facet.
 * FOR AI: end-to-end happy path — drop, type a value, verify exposed value + clear via CSA.
 * Helpers: openEditorSidebar.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { openEditorSidebar } from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid.
describe('Number Input — userflow facet', { testIsolation: false }, () => {
    const W = 'numberinput1'; // runtimeCandidate

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-NIUserflow-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget('Number Input', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // Happy path: a user types a number → the input reflects it.
    it('user types a value → input reflects the typed number', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .find('input')
            .clear()
            .type('42')
            .should('have.value', '42');
    });
});
