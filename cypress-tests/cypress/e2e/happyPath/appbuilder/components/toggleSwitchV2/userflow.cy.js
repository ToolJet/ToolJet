import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    openEditorSidebar,
    openAccordion,
    verifyAndModifyParameter,
    verifyAndModifySwitch,
    verifyAndModifyToggleFx,
} from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";

// Userflow facet — end-to-end builder journeys for the Toggle Switch.
//
// TODO: no per-component flow description was supplied, so these are the
// generic place → configure → observe journeys derived from the config. Replace
// or extend them with the real product flows when a description is available.
//
// testIsolation:false for cypress-real-dnd.
describe('Toggle Switch — userflow facet', { testIsolation: false }, () => {
    const W = 'toggleswitch1'; // computeComponentName from config name 'ToggleSwitch'
    const INNER = `[data-cy="${W}"]`; // ToggleV2.jsx:264
    const INPUT = `${INNER} input.form-check-input`; // ToggleV2.jsx:67-88
    const SWITCH = `${INNER} > div > div.d-flex`; // ToggleV2.jsx:66

    beforeEach(() => {
        cy.apiLogin();
        // fake.companyName is just the first word of a company name (fake.js:19-22)
        // — a small pool, so repeat local runs collide on POST /api/apps (409
        // "This app name is already taken") and abort the suite from beforeEach.
        cy.apiCreateApp(`${fake.companyName}-ToggleSwitch-Userflow-${Date.now().toString().slice(-6)}`);
        cy.openApp();
        cy.dragAndDropWidget('Toggle Switch', 450, 200); // source: toggleswitchv2.js:3
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // Place → rename the label → set Default state On → observe checked on the
    // canvas → confirm the exposed value follows.
    it('label + default-state On → renders checked and exposes value true', () => {
        openEditorSidebar(W);

        // defaults out of the box — source: toggleswitchv2.js:213-214
        cy.get(`${INNER} label`).scrollIntoView().should('have.text', 'Label');
        cy.get(INPUT).should('not.be.checked');

        // the builder relabels the field
        const labelText = fake.companyName; // dynamic: fake
        verifyAndModifyParameter('Label', labelText); // source: toggleswitchv2.js:25
        // CodeMirror commits the property on BLUR — without this the store keeps
        // the old value and the canvas renders stale (runtime-confirmed: the
        // inspector field showed the new text while <label> still read 'Label').
        cy.forceClickOnCanvas();
        cy.get(`${INNER} label`).should('have.text', labelText); // dynamic: fake echoed

        // ...and turns it on by default
        verifyAndModifySwitch('Default state', 'On'); // source: toggleswitchv2.js:38
        cy.get(INPUT).should('be.checked');

        // the component tree reflects both changes
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'value', type: 'Boolean', value: 'true' }, // source: toggleswitchv2.js:38 (Default state On → '{{true}}')
            { key: 'label', type: 'String', value: `"${labelText}"` }, // dynamic: fake echoed (toggleswitchv2.js:171)
        ], verifyNodeData);
    });

    // An end user flips the switch on the canvas; the exposed value follows.
    it('end-user toggle → exposed value flips to true', () => {
        cy.forceClickOnCanvas();
        cy.get(SWITCH).scrollIntoView().click({ force: true });
        cy.get(INPUT).should('be.checked');

        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'value', type: 'Boolean', value: 'true' }, // dynamic: runtime — the end-user toggle flips value (ToggleV2.jsx:23-27)
        ], verifyNodeData);
    });

    // Mandatory + untouched → the field reports itself invalid once interacted with.
    it('mandatory flow — an untouched mandatory switch reports Field cannot be empty', () => {
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyToggleFx('Make this field mandatory', '{{false}}'); // source: toggleswitchv2.js:16
        cy.get(`${INNER} div:has(> label)`).scrollIntoView().should('contain.text', '*'); // source: ToggleV2.jsx:282

        // toggle ON then OFF: userInteracted is armed and the value is back to
        // false, which a mandatory field rejects (_helpers/utils.js:463-470).
        cy.forceClickOnCanvas();
        cy.get(SWITCH).scrollIntoView().click({ force: true });
        cy.get(SWITCH).click({ force: true });
        cy.get(INPUT).should('not.be.checked');
        cy.get(commonWidgetSelector.validationFeedbackMessage(W))
            .should('be.visible')
            .and('have.text', 'Field cannot be empty'); // source: _helpers/utils.js:468
    });

    // Disable flow — the builder marks the field disabled; the widget reflects it.
    it('disable flow — the Disable toggle disables the input', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');
        verifyAndModifyToggleFx('Disable', '{{false}}'); // source: toggleswitchv2.js:62
        cy.get(INNER).should('have.attr', 'data-disabled', 'true'); // source: ToggleV2.jsx:252
        cy.get(INPUT).should('be.disabled');
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});
