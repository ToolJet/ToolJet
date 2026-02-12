import { fake } from "Fixtures/fake";
import { tableSelector } from "Selectors/table";

import {
  verifyMultipleComponentValuesFromInspector,
  verifyComponentValueFromInspector,
  openEditorSidebar,
  openAccordion,
  verifyBoxShadowCss,
} from "Support/utils/commonWidget";
import { verifyNodeData, openNode, verifyValue } from "Support/utils/inspector";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
  commonText,
  commonWidgetText,
  codeMirrorInputLabel,
} from "Texts/common";
import { addNewPage } from "Support/utils/multipage";
import {
  selectCSA,
  selectEvent,
  addSupportCSAData,
} from "Support/utils/events";
import { multipageSelector } from "Selectors/multipage";
import {
  selectQuery,
  deleteQuery,
  query,
  changeQueryToggles,
  renameQueryFromEditor,
  addInputOnQueryField,
} from "Support/utils/queries";
import {
  verifyCouldnotConnectWithAlert,
  resizeQueryPanel,
  verifypreview,
  addInput,
} from "Support/utils/dataSource";
import {
  addPropertiesFromCodeHinderPopup,
  addFromCodeHinderPopup,
} from "Support/utils/codehinder";
import { tableText } from "Texts/table";
import {
  searchOnTable,
  verifyTableElements,
  selectDropdownOption,
  deleteAndVerifyColumn,
  addAndOpenColumnOption,
  verifyAndEnterColumnOptionInput,
  verifyInvalidFeedback,
  addInputOnTable,
  verifySingleValueOnTable,
  verifyAndModifyToggleFx,
  selectFromSidebarDropdown,
  dataPdfAssertionHelper,
  dataCsvAssertionHelper,
  addFilter,
} from "Support/utils/table";

describe("Editor- Codehinder", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
  });

  it("should verify query codehinder", () => {
    cy.viewport(1800, 1800);
    resizeQueryPanel("50");
    selectQuery("Run JavaScript code");
    cy.get(`[data-cy="runjs-input-field"]`)
      .click()
      .realHover()
      .find('[class="svg-icon m-2 popup-btn"]')
      .click();
    cy.wait(200);

    cy.get('[data-cy="codehinder-popup-badge"]').should("have.text", "Runjs");
    addInputOnQueryField(
      "codehinder-popup",
      `setTimeout(() => {
        actions.setVariable('var', 'test');
      actions.setPageVariable('pageVar', 'pageTest');
    }, [0]) `
    );
    cy.get('[data-cy="codehinder-popup-close-option-icon"]').click();
    cy.get(`[data-cy="runjs-input-field"]`)
      .find(".CodeMirror-line")
      .should(
        "have.text",
        `setTimeout(() => {          actions.setVariable(\'var\', \'test\');        actions.setPageVariable(\'pageVar\', \'pageTest\');}, [0])`
      );

    changeQueryToggles("notification-on-success");
    cy.get('[data-cy="success-message-input-field"]')
      .click()
      .realHover()
      .find('[class="svg-icon m-2 popup-btn"]')
      .click();

    cy.get('[data-cy="codehinder-popup-badge"]').should("have.text", "Editor");
    addInputOnQueryField("codehinder-popup", `Message from codehinder`);
    cy.get('[data-cy="codehinder-popup-close-option-icon"]').click();
    cy.get('[data-cy="success-message-input-field"]')
      .find(".CodeMirror-line")
      .should("have.text", "Message from codehinder");

    query("create");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Query Added");
    query("run");
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Query (runjs1) completed."
    );
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Message from codehinder"
    );

    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    verifyNodeData("variables", "Object", "1 entry ");
    openNode("variables", 0);

    verifyValue("var", "String", `"test"`);

    openNode("page");
    openNode("variables", 1);
    verifyValue("pageVar", "String", `"pageTest"`);
  });

  it.only("should verify styles codehinder", () => {
    cy.dragAndDropWidget("Table");
    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).should("be.visible");

    const data = {};
    data.color = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;

    openEditorSidebar(tableText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    addPropertiesFromCodeHinderPopup(
      commonWidgetText.parameterVisibility,
      "{{false",
      "widget/table1::visibility"
    );
    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).should("not.be.visible");
    cy.get("[data-cy='visibility-fx-button']").click();
    cy.get(
      commonWidgetSelector.parameterTogglebutton(
        commonWidgetText.parameterVisibility
      )
    ).click();
    addPropertiesFromCodeHinderPopup(
      commonWidgetText.parameterDisable,
      "{{true",
      "widget/table1::disabledState"
    );
    cy.waitForAutoSave();
    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).should("have.attr", "data-disabled", "true");
    cy.get("[data-cy='disable-fx-button']").click();
    cy.get("[data-cy='disable-toggle-button']").click();

    // // cy.get("[data-cy='border-radius-fx-button']:eq(1)").click();
    addFromCodeHinderPopup(
      "Action Button Radius",
      commonWidgetText.borderRadiusInput,
      "widget/table1::actionButtonRadius"
    );

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    openEditorSidebar(tableText.defaultWidgetName);
    openAccordion("Columns", ["Options", "Properties", "Layout"]);
    deleteAndVerifyColumn("email");
    openEditorSidebar(tableText.defaultWidgetName);
    openAccordion("Action buttons", [
      "Options",
      "Properties",
      "Columns",
      "Layout",
    ]);
    cy.get('[data-cy="button-add-new-action-button"]').click();

    cy.get('[data-cy="rightActions-cell-2"]')
      .eq(0)
      .find("button")
      .should("have.css", "border-radius", "20px");

    openEditorSidebar(tableText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    addFromCodeHinderPopup(
      "Border Radius",
      commonWidgetText.borderRadiusInput,
      "widget/table1::borderRadius"
    );
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();

    cy.get(
      commonWidgetSelector.draggableWidget(tableText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");

    openEditorSidebar(tableText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion(commonWidgetText.accordionGenaral, []);

    addPropertiesFromCodeHinderPopup(
      commonWidgetText.parameterBoxShadow,
      "10px 10px 10px 10px #a81313ff",
      "widget/table1::boxShadow"
    );

    addPropertiesFromCodeHinderPopup(
      "Table type",
      "randomText",
      "widget/table1::tableType"
    );

    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(tableText.defaultWidgetName))
      .find("table")
      .invoke("attr", "class")
      .and("contain", "randomText");

    openEditorSidebar(tableText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    addPropertiesFromCodeHinderPopup(
      "Cell size",
      "randomText",
      "widget/table1::cellSize"
    );

    addPropertiesFromCodeHinderPopup(
      "Text color",
      `rgba(${data.color[0]}, ${data.color[1]}, ${data.color[2]}, ${
        data.color[3] / 100
      })`,
      "widget/table1::textColor"
    );

    cy.get(tableSelector.column(0))
      .eq(0)
      .invoke("attr", "class")
      .and("contain", "randomText");

    // selectColourFromColourPicker(`Text color`, data.color);
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(tableText.defaultWidgetName))
      .click()
      .find("tbody")
      .should(
        "have.css",
        "color",
        `rgba(${data.color[0]}, ${data.color[1]}, ${data.color[2]}, ${
          data.color[3] / 100
        })`
      );
  });

  it("should verify component specific codehinder", () => {});
});
