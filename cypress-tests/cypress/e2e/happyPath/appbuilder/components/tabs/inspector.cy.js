import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
  openAndVerifyNode,
  openNode,
  verifyNodes,
  verifyNodeData,
} from "Support/utils/appBuilder/inspector";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe("Tabs — inspector facet", { testIsolation: false }, () => {

    // source: tabs.js:394-398
    const exposedValues = [
        {
            key: "currentTab",       // source: tabs.js:394
            type: "String",
            value: '"t0"',           // runtime: first tab id from tabItems (tabs.js:412); depends on active tab
        },
        {
            key: "currentTabTitle",  // source: tabs.js:395
            type: "String",
            value: '"Tab 1"',        // runtime: first tab title from tabItems (tabs.js:415); depends on active tab
        },
        {
            key: "isVisible",        // source: tabs.js:396
            type: "Boolean",
            value: "true",           // default: true
        },
        {
            key: "isDisabled",       // source: tabs.js:397
            type: "Boolean",
            value: "false",          // default: false
        },
        {
            key: "isLoading",        // source: tabs.js:398
            type: "Boolean",
            value: "false",          // default: false
        },
    ];

    // CSA handles — source: tabs.js:311-391
    const functions = [
        { key: "setTab",            type: "Function" }, // source: tabs.js:311
        { key: "setVisibility",     type: "Function" }, // source: tabs.js:320
        { key: "setDisable",        type: "Function" }, // source: tabs.js:325
        { key: "setLoading",        type: "Function" }, // source: tabs.js:330
        { key: "setTabDisable",     type: "Function" }, // source: tabs.js:335
        { key: "setTabLoading",     type: "Function" }, // source: tabs.js:355
        { key: "setTabVisibility",  type: "Function" }, // source: tabs.js:373
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Tabs-App`);
        cy.openApp();
        cy.dragAndDropWidget("Tabs", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it("should verify exposed values on inspector", () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode("tabs1", exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });
});
