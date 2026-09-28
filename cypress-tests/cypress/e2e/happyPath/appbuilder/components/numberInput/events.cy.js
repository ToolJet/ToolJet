/**
 * SPEC — Number Input — events facet.
 * FOR AI: wires all 4 events (onChange/onFocus/onBlur/onEnterPressed) via addMultiEventsWithAlert
 * (isWait=true so the custom Show-Alert message propagates), then triggers each on the input and
 * asserts its toast. Structure follows the green checkbox golden events facet.
 * Helpers: addMultiEventsWithAlert, openEditorSidebar.
 */
import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { addMultiEventsWithAlert } from "Support/utils/appBuilder/events";
import { openEditorSidebar } from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Number Input — events facet', { testIsolation: false }, () => {
    const W = 'numberinput1';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-NIEvents-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget('Number Input', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it('should verify all the events from the number input', () => {
        openEditorSidebar(W);
        // events: onChange, onFocus, onBlur, onEnterPressed. source: numberinput.js:112-115
        const events = [
            { event: 'On focus', message: 'On focus Event' },              // source: numberinput.js:113
            { event: 'On blur', message: 'On blur Event' },                // source: numberinput.js:114
            { event: 'On change', message: 'On change Event' },            // source: numberinput.js:112
            { event: 'On enter pressed', message: 'On enter pressed Event' }, // source: numberinput.js:115
        ];
        addMultiEventsWithAlert(events); // isWait=true so the custom messages propagate
        cy.waitForAutoSave();
        cy.forceClickOnCanvas();
        cy.wait(1000);

        const inputSelector = `[data-cy="${W}-input"]`;

        // focus → onFocus
        cy.get(inputSelector).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On focus Event', false); // dynamic

        // type a value → onChange
        cy.get(inputSelector).clear().type('42');
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On change Event', false); // dynamic

        // Enter → onEnterPressed
        cy.get(inputSelector).type('{enter}');
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On enter pressed Event', false); // dynamic

        // blur (click canvas) → onBlur
        cy.forceClickOnCanvas();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On blur Event', false); // dynamic
    });
});
