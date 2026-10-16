import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { openAndVerifyNode, openNode, verifyNodeData } from "Support/utils/inspector";
import {
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
    selectColourFromColourPicker,
    fillBoxShadowParams,
    verifyBoxShadowCss,
    verifyWidgetColorCss,
    verifyLayout,
    openEditorSidebar,
    openAccordion,
} from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Horizontal Divider Component Tests', { testIsolation: false }, () => {
    // W (runtime name) = HorizontalDivider1 → data-cy draggable-widget-horizontaldivider1
    const W = "HorizontalDivider1";

    // config.exposedVariables === {} (divider.js:140) — NO exposed values facet.
    // config.events === {} (divider.js:57) — NO events facet, no events it().
    // No config.actions — NO CSA facet, no CSA it().

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Divider-App`);
        cy.openApp();
        cy.dragAndDropWidget("Horizontal Divider", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // Defaults: label empty (divider.js:147) → no label span rendered, only
        // the divider line; widget visible (visibility {{true}}, divider.js:148).
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible"); // source: divider.js:148
        // label default "" (divider.js:147) → outer div renders only the line div,
        // so the widget has no visible text.
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.text", ""); // source: divider.js:147

        // exposedVariables is empty (divider.js:140) — nothing to assert on inspector.
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode("components");
        openAndVerifyNode("horizontaldivider1", [], verifyNodeData);
    });

    it.skip('should verify the properties', () => {
        openEditorSidebar(W);

        // label — type: code (divider.js:15), default "" (divider.js:147).
        // Typing a value renders it as the divider label span.
        const labelText = fake.randomSentence;
        verifyAndModifyParameter("Label", labelText); // dynamic: fake
        cy.get(commonWidgetSelector.draggableWidget(W)).should("contain.text", labelText); // dynamic: fake

        // Additional actions section holds visibility + tooltip + tooltipFormat.
        openAccordion("Additional actions", []);

        // visibility — type: toggle (divider.js:22), default {{true}} (divider.js:148).
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: divider.js:148
        // toggled off → widget hidden (display:none, Divider.jsx:75).
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible"); // dynamic: visibility toggled off
        // toggle visibility back on so the widget re-renders.
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: divider.js:148
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible"); // dynamic: visibility toggled back on

        // tooltipFormat — type: switch (divider.js:34), options plainText/markdown/html,
        // default plainText (divider.js:150). Select each format option.
        cy.get('[data-cy="togglr-button-plainText"]').click(); // source: divider.js:38
        cy.get('[data-cy="togglr-button-markdown"]').click(); // source: divider.js:39
        cy.get('[data-cy="togglr-button-html"]').click(); // source: divider.js:40

        // tooltip — type: code (divider.js:48), default "" (divider.js:149).
        const tooltipText = fake.randomSentence;
        verifyAndModifyParameter("Tooltip", tooltipText); // dynamic: fake
    });

    it.skip('should verify the styles', () => {
        // Give the divider a label first so labelColor / labelAlignment / textWrap
        // have a rendered span to affect.
        openEditorSidebar(W);
        verifyAndModifyParameter("Label", fake.randomSentence); // dynamic: fake

        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // ---- Divider accordion ----
        openAccordion("Divider", []);

        // dividerColor — colorSwatches (divider.js:59), default var(--cc-default-border)
        // (divider.js:154). Applied as background-color of the inner line div
        // (Divider.jsx:32), NOT the draggable wrapper — sub-selector unknown from
        // empty cache.
        selectColourFromColourPicker("Divider color", ["255", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for dividerColor — line div background-color, sub-selector inside draggable-widget-horizontaldivider1 */
        verifyWidgetColorCss(W, "background-color", [255, 0, 0, 100]); // dynamic: test color

        // dividerStyle — switch (divider.js:68), options solid/dashed, default solid
        // (divider.js:156). solid → backgroundColor; dashed → backgroundImage gradient
        // (Divider.jsx:21-34). CSS effect sub-selector unknown from empty cache.
        cy.get('[data-cy="togglr-button-solid"]').click(); // source: divider.js:75
        cy.get('[data-cy="togglr-button-dashed"]').click(); // source: divider.js:76
        /* RESOLVE-LIVE cssProp for dividerStyle — dashed sets background-image gradient on the inner line div */

        // labelAlignment — switch(icon) (divider.js:80), options left/center/right,
        // default center (divider.js:155). Drives outer justify-content
        // (Divider.jsx:80). CSS assertion selector unknown from empty cache.
        cy.get('[data-cy="togglr-button-left"]').click(); // source: divider.js:87
        cy.get('[data-cy="togglr-button-center"]').click(); // source: divider.js:88
        cy.get('[data-cy="togglr-button-right"]').click(); // source: divider.js:89
        /* RESOLVE-LIVE cssProp for labelAlignment — outer div justify-content flex-start/center/flex-end */

        // labelColor — colorSwatches (divider.js:94), default var(--cc-placeholder-text)
        // (divider.js:157). Applied to the label span color (Divider.jsx:38),
        // sub-selector unknown from empty cache.
        selectColourFromColourPicker("Label Color", ["0", "255", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for labelColor — label <span> color, sub-selector inside draggable-widget-horizontaldivider1 */
        verifyWidgetColorCss(W, "color", [0, 255, 0, 100]); // dynamic: test color

        // textWrap — switch (divider.js:102), options wrap/nowrap, default wrap
        // (divider.js:158). nowrap sets white-space:nowrap on label span
        // (Divider.jsx:46). CSS selector unknown from empty cache.
        cy.get('[data-cy="togglr-button-wrap"]').click(); // source: divider.js:110
        cy.get('[data-cy="togglr-button-nowrap"]').click(); // source: divider.js:111
        /* RESOLVE-LIVE cssProp for textWrap — label <span> white-space nowrap */

        // boxShadow — boxShadow (divider.js:116), default 0px 0px 0px 0px #00000040
        // (divider.js:160). Applied to inner line div + label span (Divider.jsx:18,39).
        fillBoxShadowParams(["X", "Y", "Blur", "Spread"], ["0", "0", "10", "0"]); // dynamic: test shadow
        /* RESOLVE-LIVE cssProp for boxShadow — applied to inner line div, not the draggable wrapper */
        verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]); // dynamic: test shadow

        // ---- container accordion ----
        openAccordion("container", []);

        // padding — switch (divider.js:125), options default/none, default default
        // (divider.js:159). CSS effect selector unknown from empty cache.
        cy.get('[data-cy="togglr-button-default"]').click(); // source: divider.js:134
        cy.get('[data-cy="togglr-button-none"]').click(); // source: divider.js:135
        /* RESOLVE-LIVE cssProp for padding — container padding default/none */
    });

    it.skip('should verify the layout', () => {
        // others.showOnDesktop default {{true}} (divider.js:143),
        // others.showOnMobile default {{false}} (divider.js:144).
        verifyLayout(W);
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });

});
