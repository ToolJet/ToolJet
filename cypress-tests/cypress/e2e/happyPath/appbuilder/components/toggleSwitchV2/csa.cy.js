import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { addCSA } from "Support/utils/appBuilder/csa";

// CSA facet — every handle in config.actions, driven from Button "On click"
// Control-Component actions. Button onClick CSAs fire at RUNTIME, so the
// effects are verified in PREVIEW (an edit-mode click just selects the widget).
// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Toggle Switch — csa facet', { testIsolation: false }, () => {
    const W = 'toggleswitch1'; // computeComponentName from config name 'ToggleSwitch'
    const INNER = `[data-cy="${W}"]`; // ToggleV2.jsx:264
    const INPUT = `${INNER} input.form-check-input`; // ToggleV2.jsx:67-88

    beforeEach(() => {
        cy.apiLogin();
        // fake.companyName is just the first word of a company name (fake.js:19-22)
        // — a small pool, so repeat local runs collide on POST /api/apps (409
        // "This app name is already taken") and abort the suite from beforeEach.
        cy.apiCreateApp(`${fake.companyName}-ToggleSwitch-CSA-App-${Date.now().toString().slice(-6)}`);
        cy.openApp();
        cy.dragAndDropWidget('Toggle Switch', 500, 100); // source: toggleswitchv2.js:3
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it('should verify all the CSA from toggleswitch1 (On click)', () => {
        const actions = [
            // button1: hide the widget — setVisibility(false) — source: toggleswitchv2.js:188 (displayName :189)
            { event: 'On click', action: 'Set visibility', valueToggle: '{{false}}' },
            // button2: show the widget — setVisibility(true) — source: toggleswitchv2.js:188 (displayName :189)
            { event: 'On click', action: 'Set visibility', valueToggle: '{{true}}' },
            // button3: disable — setDisable(true) — source: toggleswitchv2.js:193 (displayName :194)
            { event: 'On click', action: 'Set disable', valueToggle: '{{true}}' },
            // button4: enable — setDisable(false) — source: toggleswitchv2.js:193 (displayName :194)
            { event: 'On click', action: 'Set disable', valueToggle: '{{false}}' },
            // button5: setValue(true) — source: toggleswitchv2.js:183 (displayName :184)
            { event: 'On click', action: 'Set value', value: '{{true}}' },
            // button6: setValue(false) — source: toggleswitchv2.js:183 (displayName :184)
            { event: 'On click', action: 'Set value', value: '{{false}}' },
            // button7: toggle — flips the checked state — source: toggleswitchv2.js:179 (displayName :180)
            { event: 'On click', action: 'toggle' },
            // button8: setLoading(true) — source: toggleswitchv2.js:198 (displayName :199)
            { event: 'On click', action: 'Set loading', valueToggle: '{{true}}' },
        ];

        addCSA(W, actions);

        cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });
        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.wait(2500);

        const btn = (n) => commonWidgetSelector.draggableWidget(`button${n}`);

        // b1 setVisibility(false) → display:none on the inner wrapper (ToggleV2.jsx:255)
        cy.get(btn(1)).click();
        cy.get(INNER).should('not.be.visible');
        // b2 setVisibility(true) → visible again
        cy.get(btn(2)).click();
        cy.get(INNER).should('be.visible');

        // b3 setDisable(true) → the input is disabled (ToggleV2.jsx:79)
        cy.get(btn(3)).click();
        cy.get(INPUT).should('be.disabled');
        // b4 setDisable(false) → enabled again
        cy.get(btn(4)).click();
        cy.get(INPUT).should('not.be.disabled');

        // b5 setValue(true) → checked; b6 setValue(false) → unchecked
        cy.get(btn(5)).click();
        cy.get(INPUT).should('be.checked');
        cy.get(btn(6)).click();
        cy.get(INPUT).should('not.be.checked');

        // b7 toggle → flips (currently unchecked → checked) — source: toggleswitchv2.js:179
        cy.get(btn(7)).click();
        cy.get(INPUT).should('be.checked'); // source: toggleswitchv2.js:179 (displayName :180)

        // b8 setLoading(true) → the widget loader replaces the switch (ToggleV2.jsx:266-267)
        cy.get(btn(8)).click();
        cy.get(`${INNER} .tj-widget-loader`).should('be.visible');

        cy.go('back'); // return to the editor
    });
});
