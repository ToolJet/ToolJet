import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { addCSA } from "Support/utils/appBuilder/editor/textInput";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Checkbox Component Tests', { testIsolation: false }, () => {

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Checkbox-App`);
        cy.openApp();
        cy.dragAndDropWidget("Checkbox", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // CSA facet — all handles fire from an "On click" trigger via Control
    // Component action buttons. Non-deprecated handles from surface csa block:
    //   toggle          — source: checkbox.js:178 (no params)
    //   setValue        — source: checkbox.js:182 (param: value)
    //   setVisibility   — source: checkbox.js:187 (param: disable, toggle, default {{false}})
    //   setDisable      — source: checkbox.js:192 (param: disable, toggle, default {{false}})
    //   setLoading      — source: checkbox.js:197 (param: loading, toggle, default {{false}})
    it('should verify all the CSA from checkbox (On click)', () => {
        const actions = [
            // button1: hide the widget — setVisibility(false) — source: checkbox.js:187
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" },
            // button2: show the widget — setVisibility(true) — source: checkbox.js:187
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },
            // button3: disable the widget — setDisable(true) — source: checkbox.js:192
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },
            // button4: enable the widget — setDisable(false) — source: checkbox.js:192
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },
            // button5: setValue(true) — source: checkbox.js:182
            { event: "On click", action: "Set value", value: "{{true}}" },
            // button6: setValue(false) — source: checkbox.js:182
            { event: "On click", action: "Set value", value: "{{false}}" },
            // button7: toggle — flips checked state — source: checkbox.js:178
            { event: "On click", action: "toggle" },
            // button8: setLoading(true) — source: checkbox.js:197
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },
        ];

        addCSA("checkbox1", actions);

        // Button onClick CSAs fire at RUNTIME, not in edit mode (an edit-mode
        // click just selects the widget — probe-confirmed). Verify effects in
        // PREVIEW, where runtime state (visibility/disable/value/loading) applies.
        cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });
        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.wait(2500);

        const W = commonWidgetSelector.draggableWidget("checkbox1");
        const input = '[data-cy="checkbox1"] .form-check-input';
        const btn = (n) => commonWidgetSelector.draggableWidget(`button${n}`);

        // b1 setVisibility(false) → hidden; b2 setVisibility(true) → visible
        cy.get(btn(1)).click();
        cy.get(W).should("not.be.visible");
        cy.get(btn(2)).click();
        cy.get(W).should("be.visible");

        // b3 setDisable(true) → .disabled; b4 setDisable(false) → enabled
        cy.get(btn(3)).click();
        cy.get(W).should("have.class", "disabled");
        cy.get(btn(4)).click();
        cy.get(W).should("not.have.class", "disabled");

        // b5 setValue(true) → checked; b6 setValue(false) → unchecked
        cy.get(btn(5)).click();
        cy.get(input).should("be.checked");
        cy.get(btn(6)).click();
        cy.get(input).should("not.be.checked");

        // b7 toggle → flips (currently unchecked → checked) — source: checkbox.js:178
        cy.get(btn(7)).click();
        cy.get(input).should("be.checked");

        // b8 setLoading(true) → loader visible
        cy.get(btn(8)).click();
        cy.get(W).parent().find(".tj-widget-loader").should("be.visible");

        cy.go("back"); // return to the editor
    });

    // @deprecated — displayName: "Set checked (Deprecated)"; source: checkbox.js:202.
    // Generated for coverage but EXCLUDED from pass-required (deprecated handle).
    it.skip('[@deprecated] should verify setChecked CSA from checkbox (On click)', () => {
        const actions = [
            // setChecked(status) — deprecated superset of setValue — source: checkbox.js:202
            { event: "On click", action: "Set checked", value: "{{true}}" },
        ];
        addCSA("checkbox1", actions);
        // RESOLVE-LIVE: checked-state DOM assertion for checkbox1 unknown —
        // no indexed helper for deprecated setChecked effect.
    });
});
