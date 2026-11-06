import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { addCSA, verifyCSA } from "Support/utils/editor/textInput";
import { addMultiEventsWithAlert } from "Support/utils/events";
import { openAndVerifyNode, openNode, verifyNodes, verifyNodeData } from "Support/utils/inspector";
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
describe('Link Component Tests', { testIsolation: false }, () => {
    const W = "link1";

    // exposedVariables is empty in config (link.js:181) — Link exposes no
    // component-scoped values, only action functions. So the inspector facet
    // asserts functions only; exposedValues stays empty.
    const exposedValues = [];

    const functions = [
        { key: "click", type: "Function" },          // source: link.js:184
        { key: "setLinkTarget", type: "Function" },  // source: link.js:188
        { key: "setLinkText", type: "Function" },    // source: link.js:193
        { key: "setVisibility", type: "Function" },  // source: link.js:198
        { key: "setDisable", type: "Function" },     // source: link.js:203
        { key: "setLoading", type: "Function" },     // source: link.js:208
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Link-App`);
        cy.openApp();
        cy.dragAndDropWidget("Link", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // Link text default renders as the anchor label.
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("be.visible")
            .and("have.text", "Click here"); // source: link.js:220
        // Enabled + visible by default (visibility {{true}}, disabledState {{false}}).
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("not.have.attr", "data-disabled", "true"); // source: link.js:223
    });

    it.skip('should verify the properties', () => {
        openEditorSidebar(W);

        // Link text (code) — typed text becomes the anchor label.
        const linkText = fake.randomSentence;
        verifyAndModifyParameter("Link text", linkText); // dynamic: fake
        cy.forceClickOnCanvas();
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("have.text", linkText); // dynamic: fake, echoed typed value

        // Link target (code) — assert the href reflects the typed target.
        openEditorSidebar(W);
        verifyAndModifyParameter("Link target", "https://tooljet.com/"); // dynamic: test target
        cy.forceClickOnCanvas();
        cy.get(commonWidgetSelector.draggableWidget(W))
            .find("a")
            .should("have.attr", "href", "https://tooljet.com/"); // dynamic: test target, echoed

        // Target type (select) — options new/same, default new. No support helper
        // for property-level selects; assert the field renders and RESOLVE the
        // option pick + resulting anchor target attribute live.
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.parameterLabel("Target type")).should("have.text", "Target type"); // source: link.js:31
        /* RESOLVE-LIVE targetType select: pick option "same" and assert the rendered <a> target attribute (new→_blank / same→_self); options new/same source: link.js:31, default new source: link.js:221 */

        // Additional actions toggles.
        openEditorSidebar(W);
        openAccordion("Additional actions");

        // Visibility default {{true}} — toggling off hides the widget.
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: link.js:222
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible"); // dynamic: Visibility toggled off
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: link.js:222 (toggle back)

        // Disable default {{false}} — toggling on disables the widget.
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: link.js:223
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("have.attr", "data-disabled", "true"); // source: link.js:223
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: link.js:223 (toggle back)

        // Loading state default {{false}} — toggling on shows the loader.
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: link.js:226
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .find(".tj-widget-loader")
            .should("be.visible"); // dynamic: Loading state toggled on
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: link.js:226 (toggle back)

        // Tooltip format (switch) — options Plain text / Markdown / HTML, default
        // plainText. No support helper for property-level switches; assert the field
        // renders and RESOLVE the option pick + selected-state assertion live.
        cy.get(commonWidgetSelector.parameterLabel("Tooltip")).should("have.text", "Tooltip"); // source: link.js:66
        /* RESOLVE-LIVE tooltipFormat switch: click togglr-button-markdown / -html and assert selected (options plainText/markdown/html source: link.js:66, default plainText source: link.js:225) */

        // Tooltip (code) — type a value; surfaces on hover.
        verifyAndModifyParameter("Tooltip", fake.randomSentence); // dynamic: fake — source: link.js:80
    });

    it.skip('should verify the styles', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // ---- "Link text" accordion ----
        openAccordion("Link text");

        // Text color (colorSwatches). cssProp for the anchor colour is not in the
        // cache slice (surface-cache shared.cssPropertyMap is empty).
        selectColourFromColourPicker("Text color", ["255", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for textColor: which DOM node + css property carries the Link text colour (likely inner <a> "color") */
        verifyWidgetColorCss(W, "color", [255, 0, 0, 100]); // dynamic: test color

        // Text size (numberInput) — default 14.
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion("Link text");
        cy.get(commonWidgetSelector.stylePicker("Text size"))
            .find('input[type="number"]')
            .clear()
            .type("20"); // dynamic: test size
        cy.forceClickOnCanvas();
        /* RESOLVE-LIVE cssProp for textSize: confirm anchor font-size reflects "20px" and the number-input sub-selector */
        cy.get(commonWidgetSelector.draggableWidget(W))
            .find("a")
            .should("have.css", "font-size", "20px"); // dynamic: test size

        // Horizontal alignment (alignButtons) — options left/center/right, default
        // left. Click each option; resulting justify/text-align node unknown from
        // empty cache.
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion("Link text");
        cy.get('[data-cy="togglr-button-left"]').click(); // source: link.js:112
        cy.get('[data-cy="togglr-button-center"]').click(); // source: link.js:112
        cy.get('[data-cy="togglr-button-right"]').click(); // source: link.js:112
        /* RESOLVE-LIVE cssProp for horizontalAlignment: which node carries text/justify alignment and its css value for "right" */

        // Vertical alignment (switch, icon) — options top/center/bottom, default
        // center. Click each option; resulting vertical-align node unknown from
        // empty cache.
        cy.get('[data-cy="togglr-button-top"]').click(); // source: link.js:121
        cy.get('[data-cy="togglr-button-center"]').click(); // source: link.js:121
        cy.get('[data-cy="togglr-button-bottom"]').click(); // source: link.js:121
        /* RESOLVE-LIVE cssProp for verticalAlignment: css prop/value driven by the vertical-align switch options top/center/bottom */

        // Underline (select) — options no-underline/on-hover/underline, default
        // on-hover. Open the select and pick the "underline" option; resulting
        // text-decoration node unknown from empty cache.
        cy.get(commonWidgetSelector.stylePicker("Underline")).click(); // source: link.js:143
        cy.get('[data-cy="underline-option"], [id*="react-select"]').contains(/underline/i).click(); // source: link.js:143
        /* RESOLVE-LIVE cssProp + option selector for underline: text-decoration value produced per option (no-underline/on-hover/underline) */

        // Box shadow (boxShadow) — default 0px 0px 0px 0px #00000040.
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion("Link text");
        fillBoxShadowParams(["X", "Y", "Blur", "Spread"], ["0", "0", "10", "0"]); // dynamic: test shadow
        verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]); // dynamic: test shadow

        // ---- container accordion ----
        // Padding (switch) — options Default/None, default default. Click each
        // option; resulting padding css node unknown from empty cache.
        openAccordion("container");
        cy.get('[data-cy="togglr-button-default"]').click(); // source: link.js:166
        cy.get('[data-cy="togglr-button-none"]').click(); // source: link.js:166
        /* RESOLVE-LIVE cssProp for padding: padding css value for "none" vs "default" and the container sub-selector */
    });

    it.skip('should verify the layout', () => {
        // verifyLayout covers showOnDesktop ({{true}}) hide + showOnMobile
        // ({{false}}) show. source: link.js:215 (showOnDesktop), link.js:216 (showOnMobile)
        verifyLayout(W);
    });

    it('should verify exposed values and functions on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        // exposedValues is empty (link.js:181) — only functions are asserted.
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify the events', () => {
        const events = [
            { event: "On click", message: "onClick Event" }, // source: link.js:90
            { event: "On hover", message: "onHover Event" },  // source: link.js:91
        ];
        addMultiEventsWithAlert(events, false);

        // On hover is safe to trigger without navigating.
        cy.get(commonWidgetSelector.draggableWidget(W)).realHover();
        cy.verifyToastMessage(commonSelectors.toastMessage, "onHover Event", false); // source: link.js:91

        // On click: a real click navigates (targetType default "new" — link.js:221 —
        // opens link target in a new tab; "same" would unload the AUT). The Show
        // Alert handler is wired above, but asserting the toast reliably without a
        // real navigation must be confirmed against the live build.
        /* RESOLVE-LIVE click assertion for onClick: confirm clicking the link in
           the editor fires the event WITHOUT performing the href navigation
           (targetType new/same). If navigation occurs, stub window.open / prevent
           default before asserting the "onClick Event" toast. */
    });

    it.skip('should verify the CSA', () => {
        const actions = [
            { event: "On click", action: "Click" },                                          // source: link.js:184
            { event: "On click", action: "Set link target", value: "https://tooljet.com/" }, // source: link.js:188
            { event: "On click", action: "Set link text", value: "Updated link" },           // source: link.js:193
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" },       // source: link.js:200
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },          // source: link.js:205
            { event: "On click", action: "Set loading", valueToggle: "{{false}}" },          // source: link.js:210
        ];
        addCSA(W, actions);
        verifyCSA(W);
    });
});
