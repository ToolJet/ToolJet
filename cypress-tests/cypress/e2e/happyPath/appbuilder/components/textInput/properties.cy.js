/**
 * SPEC — Text Input — properties facet.
 * FOR AI: general (label/placeholder/value/decimalPlaces); additional actions split
 * per-toggle (showClearBtn, loadingState, disabledState, visibility, collapseWhenHidden,
 * tooltip, disableStepControls); validation (mandatory + maxValue/minValue/customRule);
 * layout. Selectors from BaseInput DOM; each additional toggle is its own it-block so no
 * fragile toggle-back is needed.
 * Helpers: verifyAndModifyParameter, verifyAndModifyToggleFx, verifyLayout, openEditorSidebar, openAccordion.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
    verifyLayout,
    openEditorSidebar,
    openAccordion,
} from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Text Input — properties facet', { testIsolation: false }, () => {
    const W = 'textinput1'; // runtimeCandidate

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TIProps-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget('Text Input', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── General ──────────────────────────────────────────────────────────────
    it('general — label + placeholder + value (code)', () => {
        // default label renders 'Label'. source: textinput.js:24
        cy.get(`[data-cy="${W}-label"]`).should('have.text', 'Label');
        // default value '' → empty input. source: textinput.js:349
        cy.get(`[data-cy="${W}-input"]`).should('have.value', '');
        // default placeholder 'Enter your input'. source: textinput.js:352
        cy.get(`[data-cy="${W}-input"]`).should('have.attr', 'placeholder', 'Enter your input');

        // label (code). source: textinput.js:24
        openEditorSidebar(W);
        const labelText = fake.randomSentence; // dynamic: fake
        verifyAndModifyParameter('Label', labelText);
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-label"]`).should('have.text', labelText); // dynamic: fake

        // placeholder (code). source: textinput.js:27
        openEditorSidebar(W);
        const placeholderText = fake.randomSentence; // dynamic: fake
        verifyAndModifyParameter('Placeholder', placeholderText);
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).should('have.attr', 'placeholder', placeholderText); // dynamic: fake

        // value / Default value (code). source: textinput.js:35
        openEditorSidebar(W);
        const valueText = fake.firstName; // dynamic: fake
        verifyAndModifyParameter('Default value', valueText);
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).should('have.value', valueText); // dynamic: fake
    });

    // ── Additional Actions (one it-block per toggle — no toggle-back needed) ────
    it('additional — showClearBtn shows clear button when input has value', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyToggleFx('Enable clear button', '{{false}}'); // flips ON. source: textinput.js:48
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).clear().type('5');
        cy.get('.tj-input-clear-btn').should('be.visible');
    });

    it('additional — loadingState shows loader', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyToggleFx('Loading state', '{{false}}'); // flips ON. source: textinput.js:54
        cy.forceClickOnCanvas();
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .within(() => {
                cy.get('.tj-widget-loader').should('be.visible');
            });
    });

    it('additional — disabledState disables the input', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyToggleFx('Disable', '{{false}}'); // flips ON. source: textinput.js:73
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).should('be.disabled');
    });

    it('additional — visibility hides the widget', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyToggleFx('Visibility', '{{true}}'); // flips OFF. source: textinput.js:60
        cy.get(commonWidgetSelector.draggableWidget(W)).should('not.be.visible');
    });

    it('additional — collapseWhenHidden toggles', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        // fx default false → verify+flip ON (layout-only side effect). source: textinput.js:67
        verifyAndModifyToggleFx('Collapse when hidden', '{{false}}');
    });

    it('additional — tooltip accepts text', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyParameter('Tooltip', fake.randomSentence); // dynamic: fake. source: textinput.js:96
    });

    // ── Validation ────────────────────────────────────────────────────────────
    it('validation — mandatory + maxLength + minLength + regex + customRule', () => {
        // mandatory (toggle) → '*' marker. source: textinput.js:100
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyToggleFx('Make this field mandatory', '{{false}}'); // flips ON
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-label"]`).should('contain.text', '*');

        // maxLength → over-length entry invalid. source: textinput.js:103
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyParameter('Max length', '5');
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).clear().type('abcdefghij').blur();
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should('be.visible');

        // minLength → under-length entry invalid (reset max first). source: textinput.js:102
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyParameter('Max length', '');
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyParameter('Min length', '8');
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).clear().type('ab').blur();
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should('be.visible');

        // regex → non-matching entry invalid (reset min first). source: textinput.js:101
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyParameter('Min length', '');
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyParameter('Regex', '^[0-9]+$'); // digits-only
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).clear().type('abc').blur(); // non-matching
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should('be.visible');

        // customRule → echoes custom error (reset regex first). source: textinput.js:104
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyParameter('Regex', '');
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyParameter('Custom validation', "{{ 'custom error' }}");
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).clear().type('x').blur();
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should('have.text', 'custom error');
    });

    // ── tooltipFormat (switch: Plain text / Markdown / HTML) ────────────────────
    it('additional — tooltipFormat switch selects Markdown', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        // tooltipFormat (switch) default plainText. source: textinput.js:78
        cy.get('[data-cy="togglr-button-markdown"]').click({ force: true });
        // aria-checked lives on the parent [role="radio"], not the inner .toggle-item div
        cy.get('[data-cy="togglr-button-markdown"]')
            .closest('[role="radio"]')
            .should('have.attr', 'aria-checked', 'true'); // Markdown selected
    });

    // ── Layout (others) ───────────────────────────────────────────────────────
    it('layout — showOnDesktop + showOnMobile via verifyLayout', () => {
        // source: textinput.js:11 / textinput.js:12
        verifyLayout(W);
    });
});
