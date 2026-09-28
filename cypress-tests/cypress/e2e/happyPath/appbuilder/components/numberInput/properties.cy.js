/**
 * SPEC — Number Input — properties facet.
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
describe('Number Input — properties facet', { testIsolation: false }, () => {
    const W = 'numberinput1'; // runtimeCandidate

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-NIProps-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget('Number Input', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── General ──────────────────────────────────────────────────────────────
    it('general — label + placeholder + value + decimalPlaces (code)', () => {
        // default label renders 'Label'. source: numberinput.js:22
        cy.get(`[data-cy="${W}-label"]`).should('have.text', 'Label');
        // default value '0' → input value. source: numberinput.js:27
        cy.get(`[data-cy="${W}-input"]`).should('have.value', '0');

        // label (code). source: numberinput.js:22
        openEditorSidebar(W);
        const labelText = fake.randomSentence; // dynamic: fake
        verifyAndModifyParameter('Label', labelText);
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-label"]`).should('have.text', labelText); // dynamic: fake

        // placeholder (code). source: numberinput.js:32
        openEditorSidebar(W);
        const placeholderText = `${fake.randomNumber}`; // dynamic: numeric placeholder
        verifyAndModifyParameter('Placeholder', placeholderText);
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).should('have.attr', 'placeholder', placeholderText); // dynamic: fake

        // value / Default value (code). source: numberinput.js:27
        openEditorSidebar(W);
        verifyAndModifyParameter('Default value', '42');
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).should('have.value', '42');

        // decimalPlaces (code) default {{2}} → rounds value. source: numberinput.js:40
        openEditorSidebar(W);
        verifyAndModifyParameter('Default value', '3.14159');
        openEditorSidebar(W);
        verifyAndModifyParameter('Decimal places', '{{2}}');
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).should('have.value', '3.14'); // 3.14159 → 2 dp
    });

    // ── Additional Actions (one it-block per toggle — no toggle-back needed) ────
    it('additional — showClearBtn shows clear button when input has value', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyToggleFx('Enable clear button', '{{false}}'); // flips ON. source: numberinput.js:48
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).clear().type('5');
        cy.get('.tj-input-clear-btn').should('be.visible');
    });

    it('additional — loadingState shows loader', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyToggleFx('Loading state', '{{false}}'); // flips ON. source: numberinput.js:54
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
        verifyAndModifyToggleFx('Disable', '{{false}}'); // flips ON. source: numberinput.js:73
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).should('be.disabled');
    });

    it('additional — visibility hides the widget', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyToggleFx('Visibility', '{{true}}'); // flips OFF. source: numberinput.js:60
        cy.get(commonWidgetSelector.draggableWidget(W)).should('not.be.visible');
    });

    it('additional — collapseWhenHidden toggles', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        // fx default false → verify+flip ON (layout-only side effect). source: numberinput.js:67
        verifyAndModifyToggleFx('Collapse when hidden', '{{false}}');
    });

    it('additional — tooltip accepts text', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyParameter('Tooltip', fake.randomSentence); // dynamic: fake. source: numberinput.js:96
    });

    it('additional — disableStepControls removes the step arrows', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        // step controls exist by default (NumberInput.jsx:77)
        cy.get(`[data-cy="draggable-widget-${W}"] .number-input-arrow`).should('exist');
        verifyAndModifyToggleFx('Disable step controls', '{{false}}'); // flips ON. source: numberinput.js:104
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="draggable-widget-${W}"] .number-input-arrow`).should('not.exist');
    });

    // ── Validation ────────────────────────────────────────────────────────────
    it('validation — mandatory + maxValue + minValue + regex + customRule', () => {
        // mandatory (toggle) → '*' marker. source: numberinput.js:327
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyToggleFx('Make this field mandatory', '{{false}}'); // flips ON
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-label"]`).should('contain.text', '*');

        // maxValue → over-max entry invalid. source: numberinput.js:330
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyParameter('Max value', '5');
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).clear().type('10').blur();
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should('be.visible');

        // minValue → under-min entry invalid (reset max first). source: numberinput.js:329
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyParameter('Max value', '');
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyParameter('Min value', '8');
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).clear().type('2').blur();
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should('be.visible');

        // regex → non-matching entry invalid (reset min first). source: numberinput.js:328
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyParameter('Min value', '');
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyParameter('Regex', '^[0-9]{5}$'); // exactly 5 digits
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).clear().type('12').blur(); // 2 digits → no match
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should('be.visible');

        // customRule → echoes custom error (reset regex first). source: numberinput.js:331
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyParameter('Regex', '');
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyParameter('Custom validation', "{{ 'custom error' }}");
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).clear().type('1').blur();
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should('have.text', 'custom error');
    });

    // ── tooltipFormat (switch: Plain text / Markdown / HTML) ────────────────────
    it('additional — tooltipFormat switch selects Markdown', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        // tooltipFormat (switch) default plainText. source: numberinput.js:82
        cy.get('[data-cy="togglr-button-markdown"]').click({ force: true });
        cy.get('[data-cy="togglr-button-markdown"]')
            .closest('[role="radio"]')
            .should('have.attr', 'aria-checked', 'true'); // Markdown selected
    });

    // ── Layout (others) ───────────────────────────────────────────────────────
    it('layout — showOnDesktop + showOnMobile via verifyLayout', () => {
        // source: numberinput.js:11 / numberinput.js:12
        verifyLayout(W);
    });
});
