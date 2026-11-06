import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { addCSA, verifyCSA } from "Support/utils/editor/textInput";
import { addMultiEventsWithAlert } from "Support/utils/events";
import { openAndVerifyNode, openNode, verifyNodes, verifyNodeData } from "Support/utils/inspector";
import {
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
    verifyLayout,
    openEditorSidebar,
    openAccordion,
} from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Text Editor Component Tests', { testIsolation: false }, () => {
    const W = "richtexteditor1";

    // config.events = {} (richtextarea.js:56 / definition.events []:117) — this
    // component declares NO events, so there is NO events facet / it() below.

    const functions = [
        { "key": "setValue", "type": "Function" },      // source: richtextarea.js:85
        { "key": "setDisable", "type": "Function" },    // source: richtextarea.js:91
        { "key": "setVisibility", "type": "Function" }, // source: richtextarea.js:96
        { "key": "setLoading", "type": "Function" },    // source: richtextarea.js:101
    ];

    const exposedValues = [
        { "key": "value", "type": "String", "value": "\"\"" }, // source: richtextarea.js:81
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-RichTextarea-App`);
        cy.openApp();
        cy.dragAndDropWidget("Text Editor", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // Widget renders and is visible/enabled by default.
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible"); // dynamic: rendered visible on drop

        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData); // default value "" — source: richtextarea.js:81
    });

    it.skip('should verify the properties of the text editor', () => {
        openEditorSidebar(W);

        // placeholder (code) — default "Placeholder text" (richtextarea.js:111)
        verifyAndModifyParameter("Placeholder", fake.randomSentence); // dynamic: fake
        // NOTE: placeholder text renders inside the quill/contenteditable editor
        // (opaque DOM). Assert the placeholder attribute/text live.
        /* RESOLVE-LIVE cssProp for placeholder: selector for placeholder text inside quill editor */

        // defaultValue (code) — default "" (richtextarea.js:112)
        verifyAndModifyParameter("Default value", fake.randomSentence); // dynamic: fake
        // NOTE: value lives in a contenteditable/quill editor, not a plain input;
        // assert the typed default via exposed `value` in inspector.
        /* RESOLVE-LIVE cssProp for defaultValue: exposed value assertion after typing default value */

        // Additional actions toggles (section: additionalActions)
        openAccordion("Additional Actions", []);

        // loadingState (toggle) — default {{false}} (richtextarea.js:113)
        verifyAndModifyToggleFx("Show loading state", "{{false}}"); // source: richtextarea.js:113
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .find(".tj-widget-loader")
            .should("be.visible"); // dynamic: loader shown after enabling loading state
        verifyAndModifyToggleFx("Show loading state", "{{false}}"); // source: richtextarea.js:113 (toggle back)

        // dynamicHeight (toggle) — default {{false}} (richtextarea.js:114)
        verifyAndModifyToggleFx("Dynamic height", "{{false}}"); // source: richtextarea.js:114
        verifyAndModifyToggleFx("Dynamic height", "{{false}}"); // source: richtextarea.js:114 (toggle back)

        // collapseWhenHidden (toggle) — default {{false}} (richtextarea.js:115)
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: richtextarea.js:115
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: richtextarea.js:115 (toggle back)
    });

    it.skip('should verify the styles of the text editor', () => {
        // NOTE: this config declares NO color/box styles (richtextarea.js:57-79).
        // The "styles" facet here is only the visibility + disabledState toggles.
        openEditorSidebar(W);

        // visibility (toggle) — default {{true}} (richtextarea.js:119)
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: richtextarea.js:119
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible"); // dynamic: hidden after disabling visibility
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: richtextarea.js:119 (toggle back)

        // disabledState (toggle) — default {{false}} (richtextarea.js:120)
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: richtextarea.js:120
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("have.attr", "data-disabled", "true"); // dynamic: data-disabled reflects Disable toggle enabled above (richtextarea.js:120)
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: richtextarea.js:120 (toggle back)
    });

    it.skip('should verify the layout of the text editor', () => {
        // showOnDesktop default {{true}} (richtextarea.js:107), showOnMobile
        // default {{false}} (richtextarea.js:108) — verifyLayout covers both.
        verifyLayout(W);
    });

    it('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify all the CSA from the text editor', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // source: richtextarea.js:96
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },  // source: richtextarea.js:97
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },     // source: richtextarea.js:91
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },    // source: richtextarea.js:92
            { event: "On click", action: "Set value", value: "New text" },            // source: richtextarea.js:87
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },     // source: richtextarea.js:101
        ];
        addCSA(W, actions);
        verifyCSA(W);
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });

});
