/**
 * SPEC — Number Input — basics facet.
 * FOR AI: 2 cases — the component's core field behaviour:
 *   1. renders the default label + value and reflects a typed value.
 *   2. step controls increment / decrement the value.
 * (Inspector surface → inspector.cy.js · device visibility → contexts.cy.js ·
 *  events → events.cy.js · CSA → csa.cy.js.)
 * Pattern mirrors the Modal V2 basics facet (PR #17848) — the core lifecycle of the widget.
 * Helpers: none (direct BaseInput DOM assertions).
 */
import { fake } from "Fixtures/fake";

describe('Number Input — basics facet', { testIsolation: false }, () => {
    const W = 'numberinput1';
    const INPUT = `[data-cy="${W}-input"]`;

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-NIBasics-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget('Number Input', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // Core field behaviour: default label + value render, and typing updates the field.
    it('renders defaults and reflects a typed value', () => {
        cy.get(`[data-cy="${W}-label"]`).should('have.text', 'Label'); // default label. source: numberinput.js:22
        cy.get(INPUT).should('have.value', '0');                        // default value. source: numberinput.js:27
        cy.get(INPUT).clear().type('42').should('have.value', '42');    // typing reflects
    });

    // Step controls are the defining behaviour of a number field (present by default).
    // First .number-input-arrow = increment (+1), second = decrement (-1).
    // source: NumberInput.jsx:80 (increment) / NumberInput.jsx:87 (decrement)
    it('step controls increment and decrement the value', () => {
        const arrows = `[data-cy="draggable-widget-${W}"] .number-input-arrow`;
        cy.get(INPUT).clear().type('5').blur();
        cy.get(INPUT).should('have.value', '5');

        cy.get(arrows).eq(0).click({ force: true }); // increment → 6
        cy.get(INPUT).should('have.value', '6');

        cy.get(arrows).eq(1).click({ force: true }); // decrement → 5
        cy.get(INPUT).should('have.value', '5');
    });
});
