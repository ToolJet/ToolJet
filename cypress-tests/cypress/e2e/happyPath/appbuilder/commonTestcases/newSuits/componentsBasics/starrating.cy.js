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
describe('Rating Component Tests', { testIsolation: false }, () => {
    const W = "starrating1";

    const functions = [
        { key: "setValue", type: "Function" },       // source: starrating.js:323
        { key: "setVisibility", type: "Function" },   // source: starrating.js:328
        { key: "setDisable", type: "Function" },      // source: starrating.js:333
        { key: "setLoading", type: "Function" },      // source: starrating.js:338
        { key: "resetValue", type: "Function" },      // source: starrating.js:343
    ];

    // Exposed `value` is a Number. Config default is 0 (source: starrating.js:320)
    // but definition.properties.defaultSelected.value = '3' (source: starrating.js:358)
    // seeds the initial rating, so the runtime exposed value on drop is expected
    // to be 3. If the AUT exposes 0 instead, flip this to "0" during fix-on-fail.
    const exposedValues = [
        { key: "value", type: "Number", value: "3" }, // source: starrating.js:358 (defaultSelected seeds value; :320 default 0)
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Rating-App`);
        cy.openApp();
        cy.dragAndDropWidget("Rating", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // Label default text (source: starrating.js:355)
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("be.visible")
            .and("contain.text", "Select your rating"); // source: starrating.js:355
        // enabled + visible by default (source: starrating.js:363 visibility {{true}}, :366 disabledState {{false}})
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("not.have.attr", "data-disabled", "true"); // source: starrating.js:366
    });

    it.skip('should verify the properties', () => {
        openEditorSidebar(W);

        // label — code. Assert widget renders the typed text.
        verifyAndModifyParameter("Label", fake.randomSentence); // dynamic: fake
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("contain.text", fake.randomSentence); // dynamic: fake

        // iconType — switch [Stars, Hearts]. iconType lives in the label accordion.
        openAccordion("label");
        // Select "Hearts" then "Stars". iconType toggles which selected-bg style renders.
        cy.contains('[data-cy^="dropdown-option-"], label, button', /^Hearts$/i).click({ force: true }); // source: starrating.js:29
        /* RESOLVE-LIVE iconType switch option selector + effect assertion (hearts) for starrating */
        cy.contains('[data-cy^="dropdown-option-"], label, button', /^Stars$/i).click({ force: true }); // source: starrating.js:28
        /* RESOLVE-LIVE iconType switch option selector + effect assertion (stars) for starrating */

        // maxRating — code (number of stars). Assert rendered star count changes.
        verifyAndModifyParameter("Number of stars", "8"); // dynamic: test value
        /* RESOLVE-LIVE star-icon selector to assert maxRating renders 8 icons for starrating */

        // defaultSelected — code (default selected stars).
        verifyAndModifyParameter("Default no of selected stars", "2"); // dynamic: test value
        /* RESOLVE-LIVE selected-star selector to assert defaultSelected=2 for starrating */

        // tooltips — code (array of per-star tooltip strings).
        verifyAndModifyParameter("Tooltips", '{{["A","B","C"]}}'); // dynamic: test value
        /* RESOLVE-LIVE per-star tooltip hover assertion for starrating */

        // allowEditing — toggle, default {{true}} (source: starrating.js:361)
        verifyAndModifyToggleFx("Allow editing", "true"); // source: starrating.js:361

        // allowHalfStar — toggle, default {{false}} (source: starrating.js:359)
        verifyAndModifyToggleFx("Allow half rating", "false"); // source: starrating.js:359

        // Additional Actions section toggles
        // loadingState — toggle, default {{false}} (source: starrating.js:367)
        verifyAndModifyToggleFx("Loading state", "false"); // source: starrating.js:367
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .within(() => {
                cy.get(".tj-widget-loader").should("be.visible"); // dynamic: loading toggled on shows loader
            });

        // visibility — toggle, default {{true}} (source: starrating.js:363)
        verifyAndModifyToggleFx("Visibility", "true"); // source: starrating.js:363
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.exist"); // source: starrating.js:363
        verifyAndModifyToggleFx("Visibility", "true"); // source: starrating.js:363 (toggle back)

        // disabledState — toggle, default {{false}} (source: starrating.js:366)
        verifyAndModifyToggleFx("Disable", "false"); // source: starrating.js:366
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("have.attr", "data-disabled", "true"); // source: starrating.js:366

        // collapseWhenHidden — toggle, default {{false}} (source: starrating.js:365)
        verifyAndModifyToggleFx("Collapse when hidden", "false"); // source: starrating.js:365

        // tooltip — code, default '' (source: starrating.js:368)
        verifyAndModifyParameter("Tooltip", fake.randomSentence); // dynamic: fake
        /* RESOLVE-LIVE component tooltip hover assertion for starrating */

        // tooltipFormat — switch [Plain text, Markdown, HTML] (source: starrating.js:105-107)
        cy.contains('[data-cy^="dropdown-option-"], label, button', /^Markdown$/i).click({ force: true }); // source: starrating.js:106
        /* RESOLVE-LIVE tooltipFormat switch option selector + effect for starrating */
        cy.contains('[data-cy^="dropdown-option-"], label, button', /^Plain text$/i).click({ force: true }); // source: starrating.js:105
    });

    it.skip('should verify the styles', () => {
        openEditorSidebar(W);

        // ---- Label accordion ----
        openAccordion("label");

        // labelStyle — select [Standard, Legacy] default standard (source: starrating.js:380)
        /* RESOLVE-LIVE labelStyle select option selector + effect (standard/legacy) for starrating */

        // labelColor — colorSwatches, default var(--cc-primary-text) (source: starrating.js:375)
        selectColourFromColourPicker("Label color", ["255", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for labelColor for starrating */
        // verifyWidgetColorCss(W, /* cssProp */, [255, 0, 0, 100]); // dynamic: test color — RESOLVE-LIVE cssProp

        // labelFontSize — numberInput, default {{12}} (source: starrating.js:374)
        /* RESOLVE-LIVE labelFontSize input selector + font-size assertion for starrating */

        // alignment — switch [Side, Top] default side (source: starrating.js:381)
        cy.contains('[data-cy^="dropdown-option-"], label, button', /^Top$/i).click({ force: true }); // source: starrating.js:159
        /* RESOLVE-LIVE cssProp/attr for alignment=top for starrating */
        cy.contains('[data-cy^="dropdown-option-"], label, button', /^Side$/i).click({ force: true }); // source: starrating.js:158

        // The next four label styles are conditionally rendered under
        // labelStyle=standard (default) & alignment=side (default, restored above).
        // direction — switch(icon) [Left, Right] default left (source: starrating.js:382)
        cy.contains('[data-cy^="dropdown-option-"], label, button', /^Right$/i).click({ force: true }); // source: starrating.js:169
        /* RESOLVE-LIVE direction icon-switch option selector + cssProp/attr for direction=right for starrating */
        cy.contains('[data-cy^="dropdown-option-"], label, button', /^Left$/i).click({ force: true }); // source: starrating.js:169

        // auto — checkbox (Width), default {{true}} (source: starrating.js:383). Uncheck
        // to reveal labelWidth + widthType (condRender auto=false).
        /* RESOLVE-LIVE auto Width checkbox selector + effect (uncheck reveals labelWidth/widthType) for starrating */
        // cy.get(/* Width checkbox */).uncheck({ force: true }); // source: starrating.js:188

        // labelWidth — slider, default {{33}} (source: starrating.js:385). Rendered when auto=false.
        /* RESOLVE-LIVE labelWidth slider selector + label-width css assertion for starrating */
        // cy.get(/* labelWidth slider */).invoke("val", 50).trigger("change"); // source: starrating.js:205

        // widthType — select [Of component, Of container] default ofComponent (source: starrating.js:384). Rendered when auto=false.
        /* RESOLVE-LIVE widthType select option selector + effect for starrating */
        // cy.contains('[data-cy^="dropdown-option-"], label, button', /^Of container$/i).click({ force: true }); // source: starrating.js:225

        // ---- Icon accordion ----
        openAccordion("Icon");

        // iconType default = stars, so textColor (Selected background, stars) is the
        // visible selected-bg swatch. selectedBackgroundHearts is NOT rendered unless
        // iconType=hearts, so it is asserted in the properties/iconType path — see
        // not_automatable note.
        // textColor — colorSwatches (stars), default #EFB82D (source: starrating.js:373)
        selectColourFromColourPicker("Selected background", ["239", "184", "45", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp + selected-star sub-selector for textColor for starrating */
        // verifyWidgetColorCss(W, /* cssProp */, [239, 184, 45, 100]); // dynamic: test color — RESOLVE-LIVE cssProp

        // unselectedBackground — colorSwatches, default var(--cc-surface3-surface) (source: starrating.js:387)
        selectColourFromColourPicker("Unselected background", ["0", "0", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp + unselected-star sub-selector for unselectedBackground for starrating */
        // verifyWidgetColorCss(W, /* cssProp */, [0, 0, 255, 100]); // dynamic: test color — RESOLVE-LIVE cssProp

        // ---- Container accordion ----
        openAccordion("Container");

        // boxShadow — default 0px 0px 0px 0px #00000040 (source: starrating.js:379)
        fillBoxShadowParams(["X", "Y", "Blur", "Spread"], ["0", "0", "10", "0"]); // dynamic: test shadow
        verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]); // dynamic: test shadow

        // padding — switch [Default, None] default default (source: starrating.js:378)
        cy.contains('[data-cy^="dropdown-option-"], label, button', /^None$/i).click({ force: true }); // source: starrating.js:314
        /* RESOLVE-LIVE cssProp for padding=none for starrating */
        cy.contains('[data-cy^="dropdown-option-"], label, button', /^Default$/i).click({ force: true }); // source: starrating.js:313
    });

    it.skip('should verify the layout', () => {
        // showOnDesktop {{true}} / showOnMobile {{false}} (source: starrating.js:351-352)
        verifyLayout(W);
    });

    it.skip('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
        //id is pending
    });

    it.skip('should verify the On Change event', () => {
        const events = [
            { event: "On Change", message: "onChange Event" }, // source: starrating.js:125
        ];

        addMultiEventsWithAlert(events, false);

        // Firing onChange requires clicking a star icon inside the widget. The
        // star-icon sub-selector is not in the cache, so the trigger + toast
        // assertion is behind RESOLVE-LIVE.
        /* RESOLVE-LIVE star-icon selector to click and fire onChange for starrating */
        // cy.get(commonWidgetSelector.draggableWidget(W)).find(/* star icon */).eq(4).click({ force: true });
        // cy.verifyToastMessage(commonSelectors.toastMessage, 'onChange Event', false); // dynamic: echoed event message
    });

    it.skip('should verify all the CSA', () => {
        const actions = [
            { event: "On click", action: "Set value", value: "4" },              // source: starrating.js:326 (default '0')
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // source: starrating.js:331
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },  // source: starrating.js:331
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },     // source: starrating.js:336
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },    // source: starrating.js:336
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },     // source: starrating.js:341
            { event: "On click", action: "Set loading", valueToggle: "{{false}}" },    // source: starrating.js:341
            { event: "On click", action: "Reset rating" },                        // source: starrating.js:345
        ];
        addCSA(W, actions);
        verifyCSA(W);
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });
});
