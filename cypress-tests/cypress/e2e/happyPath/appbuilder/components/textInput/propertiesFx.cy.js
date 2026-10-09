/**
 * SPEC — Text Input — propertiesFx facet.
 * FOR AI: fx/code path for fx-capable fields. CODE fields exercised via verifyAndModifyParameter
 * with {{binding}} values; TOGGLE fields via verifyAndModifyToggleFx (verify braced default then
 * flip, asserting the flipped DOM effect). Negative: tooltipFormat (fxCapable:false) has no fx button.
 * Helpers: verifyAndModifyParameter, verifyAndModifyToggleFx, openEditorSidebar, openAccordion.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
    openEditorSidebar,
    openAccordion,
} from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Text Input — propertiesFx facet', { testIsolation: false }, () => {
    const W = 'textinput1';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TIPropsFx-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget('Text Input', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── FX-capable CODE fields ────────────────────────────────────────────────
    it('value fx — {{binding}} resolves to the input value', () => {
        openEditorSidebar(W);
        // value (code, fxCapable). source: textinput.js:27
        verifyAndModifyParameter('Default value', '{{50}}');
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).should('have.value', '50'); // {{50}} → 50
    });

    it('label fx — {{binding}} resolves to the label text', () => {
        openEditorSidebar(W);
        // label (code, fxCapable). source: textinput.js:22
        verifyAndModifyParameter('Label', "{{'FX Label'}}");
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-label"]`).should('have.text', 'FX Label'); // {{'FX Label'}}
    });

    it('tooltip fx — code field accepts a binding', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        // tooltip (code, fxCapable). source: textinput.js:96
        verifyAndModifyParameter('Tooltip', fake.randomSentence); // dynamic: fake
    });

    // ── FX-capable TOGGLE fields ──────────────────────────────────────────────
    it('loadingState fx — verify {{false}} default → flip ON → loader visible', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyToggleFx('Loading state', '{{false}}'); // flips ON. source: textinput.js:54
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .within(() => {
                cy.get('.tj-widget-loader').should('be.visible');
            });
    });

    it('visibility fx — verify {{true}} default → flip OFF → widget hidden', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyToggleFx('Visibility', '{{true}}'); // flips OFF. source: textinput.js:60
        cy.get(commonWidgetSelector.draggableWidget(W)).should('not.be.visible');
    });

    it('disabledState fx — verify {{false}} default → flip ON → input disabled', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyToggleFx('Disable', '{{false}}'); // flips ON. source: textinput.js:73
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).should('be.disabled');
    });

    it('mandatory fx — verify {{false}} default → flip ON → * marker', () => {
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyToggleFx('Make this field mandatory', '{{false}}'); // flips ON. source: textinput.js:327
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-label"]`).should('contain.text', '*');
    });
});
