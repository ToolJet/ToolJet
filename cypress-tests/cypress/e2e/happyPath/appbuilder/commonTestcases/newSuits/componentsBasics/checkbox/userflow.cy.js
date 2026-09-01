import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    openEditorSidebar,
    openAccordion,
    verifyAndModifySwitch,
    verifyAndModifyToggleFx,
} from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/inspector";

// Userflow facet — an end-to-end builder journey for the Checkbox: place it,
// observe its default, configure it, and confirm both the on-canvas render and
// the exposed value reflect the change. testIsolation:false for cypress-real-dnd.
describe('Checkbox — userflow facet', { testIsolation: false }, () => {
    const W = 'checkbox1';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Checkbox-Userflow`);
        cy.openApp();
        cy.dragAndDropWidget('Checkbox', 450, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // Place → observe default (unchecked) → set Default state On → observe
    // checked on canvas → confirm exposed value is now true in the inspector.
    it('configure default-state On → renders checked + exposed value true', () => {
        openEditorSidebar(W);

        // default label renders + default state is Off (unchecked)
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .find('label')
            .should('contain.text', 'Label');
        cy.get(commonWidgetSelector.draggableWidget(W)).find('input').should('not.be.checked');

        // user flips Default state → On
        verifyAndModifySwitch('Default state', 'On'); // source: checkbox.js:22
        cy.get(commonWidgetSelector.draggableWidget(W)).find('input').should('be.checked');

        // exposed value now reflects true in the app's component tree
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode('checkbox1', [
            { key: 'value', type: 'Boolean', value: 'true' }, // On → value true
        ], verifyNodeData);
    });

    // Disable flow — user marks the field disabled; the widget reflects it.
    it('disable flow — Disable toggle applies the disabled state', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyToggleFx('Disable', '{{false}}'); // source: checkbox.js:51 (flips ON)
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .should('have.class', 'disabled');
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});
