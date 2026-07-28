import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { addMultiEventsWithAlert } from "Support/utils/events";
import { openAndVerifyNode, openNode, verifyNodes, verifyNodeData } from "Support/utils/inspector";
import {
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
    selectColourFromColourPicker,
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
describe('Toggle Switch (Legacy) Component Tests', { testIsolation: false }, () => {
    // Config declares NO actions → NO CSA it() block. (toggleswitch.js has no `actions` key.)
    const W = "toggleswitchlegacy1"; // runtime name = config.name("ToggleSwitchLegacy").toLowerCase()+1 (appCanvasUtils.js:274)

    const exposedValues = [
        {
            "key": "value",
            "type": "Boolean",
            "value": "false"
        }, // source: toggleswitch.js:64
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-ToggleSwitch-App`);
        cy.openApp();
        cy.dragAndDropWidget("Toggle Switch (Legacy)", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // label default renders on the widget
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("contain.text", "Toggle label"); // source: toggleswitch.js:72

        // default status (value) is false → the switch input is unchecked
        cy.get(commonWidgetSelector.draggableWidget(W))
            .find("input")
            .should("not.be.checked"); // source: toggleswitch.js:73

        // widget is visible + enabled by default
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible"); // source: toggleswitch.js:79
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("have.attr", "data-disabled", "false"); // source: toggleswitch.js:80
    });

    it.skip('should verify the properties', () => {
        // fake.randomSentence is a getter that regenerates per access — capture once.
        const data = { label: fake.randomSentence };
        openEditorSidebar(W);

        // label (code) — type a fake string, assert it renders on the widget
        verifyAndModifyParameter("Label", data.label); // dynamic: fake
        cy.forceClickOnCanvas();
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("contain.text", data.label); // dynamic: fake (echoed typed label)

        // Default status (toggle) — default {{false}}, flip On → exposed value becomes true
        openEditorSidebar(W);
        verifyAndModifyToggleFx("Default status", "{{false}}"); // source: toggleswitch.js:73
        cy.forceClickOnCanvas();
        cy.get(commonWidgetSelector.draggableWidget(W))
            .find("input")
            .should("be.checked"); // dynamic: default status toggled On → value true
    });

    it.skip('should verify the styles', () => {
        // Text color (colorSwatches) — default var(--cc-primary-text)
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        selectColourFromColourPicker("Text color", ["255", "0", "0", "100"]); // dynamic: test color // source: toggleswitch.js:34
        /* RESOLVE-LIVE cssProp for textColor — label text color CSS prop + sub-selector unknown (empty cache) */
        verifyWidgetColorCss(
            `${commonWidgetSelector.draggableWidget(W)} label`,
            "color",
            [255, 0, 0, 100],
            true
        ); // dynamic: test color

        // Toggle switch color (colorSwatches) — default var(--cc-primary-brand)
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        selectColourFromColourPicker("Toggle switch color", ["0", "128", "0", "100"]); // dynamic: test color // source: toggleswitch.js:41
        /* RESOLVE-LIVE cssProp for toggleSwitchColor — switch track/thumb color CSS prop + sub-selector unknown (empty cache) */
        verifyWidgetColorCss(
            `${commonWidgetSelector.draggableWidget(W)}`,
            "background-color",
            [0, 128, 0, 100]
        ); // dynamic: test color

        // Visibility (toggle) default {{true}} + Disable (toggle) default {{false}} → verifyLayout covers show/hide
        verifyLayout(W); // source: toggleswitch.js:11 (showOnDesktop), toggleswitch.js:12 (showOnMobile)

        // Disable (toggle) — default {{false}}, flip On → data-disabled true
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: toggleswitch.js:80
        cy.forceClickOnCanvas();
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("have.attr", "data-disabled", "true"); // dynamic: Disable toggled On
    });

    it.skip('should verify the layout', () => {
        // showOnDesktop default {{true}} → hide on desktop; showOnMobile default {{false}} → show on mobile
        verifyLayout(W); // source: toggleswitch.js:11 (showOnDesktop true), toggleswitch.js:12 (showOnMobile false)
    });

    it.skip('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        // No functions[] — config declares no actions.
    });

    it.skip('should verify all the events from the Toggle Switch', () => {
        const events = [
            { event: "On Change", message: "onChange Event" }, // source: toggleswitch.js:31
        ];

        addMultiEventsWithAlert(events, false);

        // fire onChange by toggling the switch input
        cy.forceClickOnCanvas();
        cy.get(commonWidgetSelector.draggableWidget(W)).find("input").click({ force: true });
        cy.verifyToastMessage(commonSelectors.toastMessage, "onChange Event", false); // source: toggleswitch.js:31
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });

});
