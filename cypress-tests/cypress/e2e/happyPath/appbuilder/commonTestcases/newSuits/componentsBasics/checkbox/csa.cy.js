import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { addCSA } from "Support/utils/editor/textInput";

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
    // SKIP — blocked on an addCSA rework (helper-author + CI). A ~10-run
    // investigation peeled back four layers in the current build; the shared
    // addCSA (used by ~25 specs) was reverted to baseline rather than left
    // half-reworked. Findings for the follow-up:
    //   1. Panel toggle: the beforeEach drop leaves the components panel open, so
    //      addCSA's FIRST button drag toggles it shut → close it once up front.
    //   2. add-event-handler is NOT rendered after a bare drop; the dropped
    //      button's inspector must be opened first (openEditorSidebar). A generic
    //      fix needs the just-dropped button's runtime name (index+1 assumes no
    //      pre-existing buttons — unsafe for all 25 consumers).
    //   3. The CodeHinter value editor (fx-button → code) re-renders continuously
    //      and detaches clearAndTypeOnCodeMirror's internal `.last()` mid-type.
    //   4. CSA params are heterogeneous: some render as a toggle
    //      (`event-<Label>-toggle-button`), some as a code field — addCSA's flat
    //      value/valueToggle split can't route them; it needs per-param-type
    //      handling like setCSAParam(type: toggle|select|code).
    // Un-skip once addCSA is reworked to route by param type + settle re-renders.
    it.skip('should verify all the CSA from checkbox (On click)', () => {
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

        // The beforeEach checkbox drop leaves the components panel open. addCSA's
        // FIRST button drag would then toggle it closed (search box hidden); its
        // later drags are fine because each action's CSA-config closes the panel.
        // Close it once up front so addCSA's first drag re-opens it cleanly.
        cy.get('[data-cy="right-sidebar-components-button"]').click();

        addCSA("checkbox1", actions);

        // NOTE: the indexed `verifyCSA` helper is numberInput-specific (asserts
        // `have.value` on a text input across buttons 1-9). Checkbox has no
        // matching text-value DOM contract, so explicit assertions are used
        // here per the facet-spec "or explicit assertions per the reference".

        // button1 → widget hidden
        cy.get(commonWidgetSelector.draggableWidget("button1")).click();
        cy.get(commonWidgetSelector.draggableWidget("checkbox1")).should("not.be.visible");

        // button2 → widget visible again
        cy.get(commonWidgetSelector.draggableWidget("button2")).click();
        cy.get(commonWidgetSelector.draggableWidget("checkbox1")).should("be.visible");

        // button3 → disabled
        cy.get(commonWidgetSelector.draggableWidget("button3")).click();
        // RESOLVE-LIVE: exact disabled-state DOM for checkbox (attr vs input
        // .be.disabled vs wrapper class) unknown — no indexed checkbox helper.
        cy.get(commonWidgetSelector.draggableWidget("checkbox1")).scrollIntoView();

        // button4 → enabled
        cy.get(commonWidgetSelector.draggableWidget("button4")).click();

        // button5 → setValue(true): checkbox checked
        cy.get(commonWidgetSelector.draggableWidget("button5")).click();
        // RESOLVE-LIVE: exact checked-state DOM (input[type=checkbox]:checked
        // location within draggable-widget-checkbox1) unknown — no indexed helper.

        // button6 → setValue(false): checkbox unchecked
        cy.get(commonWidgetSelector.draggableWidget("button6")).click();

        // button7 → toggle: flips checked state — source: checkbox.js:178
        cy.get(commonWidgetSelector.draggableWidget("button7")).click();

        // button8 → setLoading(true): loader visible
        cy.get(commonWidgetSelector.draggableWidget("button8")).click();
        // RESOLVE-LIVE: exact loader DOM for checkbox (loader class / location)
        // unknown — numberInput uses .tj-widget-loader under .parent(); confirm
        // checkbox markup live before asserting.
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
