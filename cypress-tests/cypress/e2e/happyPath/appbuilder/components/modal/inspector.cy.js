import { fake } from "Fixtures/fake";
import { commonWidgetSelector, inspectorSelectors } from "Selectors/common";
import {
  launchModal,
  closeModal,
  openModalInspector,
  toggleModalProperty,
} from "Support/utils/appBuilder/components/modal";
import {
  openNode,
  openAndVerifyNode,
  verifyNodes,
} from "Support/utils/appBuilder/inspector";
import {
  openStateFromComponent,
  verifyNodeData,
} from "Support/utils/appBuilder/inspectorTree";

// Inspector facet — the Modal's exposed variables + functions in the left
// component tree, plus dynamic state reflection as properties/actions change.
// testIsolation:false for cypress-real-dnd; each test re-creates its own app.
describe("Modal — inspector facet", { testIsolation: false, retries: { runMode: 2, openMode: 0 } }, () => {
  const W = "modal1";

  // Exposed variables — source: modalV2.js:359-365
  const EXPOSED_VALUES = [
    { key: "show", type: "Boolean", value: "false" }, // source: modalV2.js:360
    { key: "isDisabledModal", type: "Boolean", value: "false" }, // source: modalV2.js:361
    { key: "isDisabledTrigger", type: "Boolean", value: "false" }, // source: modalV2.js:362
    { key: "isVisible", type: "Boolean", value: "true" }, // source: modalV2.js:363
    { key: "isLoading", type: "Boolean", value: "false" }, // source: modalV2.js:364
  ];

  // Exposed functions (CSA handles) — source: modalV2.js:366-395
  const FUNCTIONS = [
    { key: "open", type: "Function" }, // source: modalV2.js:367
    { key: "close", type: "Function" }, // source: modalV2.js:371
    { key: "setVisibility", type: "Function" }, // source: modalV2.js:376
    { key: "setDisableTrigger", type: "Function" }, // source: modalV2.js:381
    { key: "setDisableModal", type: "Function" }, // source: modalV2.js:386
    { key: "setLoading", type: "Function" }, // source: modalV2.js:391
  ];

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Modal-Inspector`);
    cy.openApp();
    cy.dragAndDropWidget("Modal");
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("exposes the correct default variables + functions in the component tree", () => {
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.hideTooltip();

    openNode("components");
    openAndVerifyNode(W, EXPOSED_VALUES, verifyNodeData);
    verifyNodes(FUNCTIONS, verifyNodeData);
  });

  it("exposed variables reflect open/closed state and property toggles", () => {
    // A) id tooltip — hovering the `id` value surfaces the full id.
    openStateFromComponent(W);
    cy.get(
      `${inspectorSelectors.inspectorNodeValue("id")} ${inspectorSelectors.jsonViewerNodeValue}`
    )
      .invoke("text")
      .then((idValue) => {
        cy.get(inspectorSelectors.inspectorNodeValue("id")).realHover();
        cy.get(inspectorSelectors.nodeTooltip)
          .should("be.visible")
          .and("have.text", idValue.trim());
      });

    // B) `show` follows the open/closed state.
    launchModal(W);
    verifyNodeData("show", "Boolean", "true");
    closeModal(W);
    verifyNodeData("show", "Boolean", "false");

    // C) Each remaining exposed boolean is driven by a property toggle. Flip
    // each from its default and confirm the exposed variable reflects it.
    const STATE_TOGGLES = [
      {
        accordion: "Additional Actions",
        label: "Loading state", // OFF → ON — source: modalV2.js:15
        exposedVar: "isLoading",
        expected: "true",
      },
      {
        accordion: "Additional Actions",
        label: "Disable modal window", // OFF → ON — source: modalV2.js:56
        exposedVar: "isDisabledModal",
        expected: "true",
      },
      {
        accordion: "Trigger",
        label: "Disable modal trigger", // OFF → ON — source: modalV2.js:48
        exposedVar: "isDisabledTrigger",
        expected: "true",
      },
      {
        accordion: "Trigger",
        label: "Modal trigger visibility", // ON → OFF (keep last) — source: modalV2.js:33
        exposedVar: "isVisible",
        expected: "false",
      },
    ];
    STATE_TOGGLES.forEach(({ accordion, label, exposedVar, expected }) => {
      openModalInspector(accordion);
      toggleModalProperty(label);
      openStateFromComponent(W); // re-open the state tree after the change
      verifyNodeData(exposedVar, "Boolean", expected);
    });
  });
});
