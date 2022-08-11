import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonWidgetText, commonText } from "Texts/common";

export const openAccordion = (accordionName, index = "0") => {
  cy.get(commonWidgetSelector.accordion(accordionName, index))
    .should("be.visible")
    .and("have.text", accordionName)
    .then(($accordion) => {
      if ($accordion.hasClass("collapsed")) {
        cy.get(commonWidgetSelector.accordion(accordionName, index)).click();
      }
    });
};

export const verifyAndModifyParameter = (paramName, value) => {
  cy.get(commonWidgetSelector.parameterLabel(paramName)).should(
    "have.text",
    paramName
  );
  cy.get(
    commonWidgetSelector.parameterInputField(paramName)
  ).clearAndTypeOnCodeMirror(value);
};

export const openEditorSidebar = (widgetName = "") => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).trigger("mouseover");
  cy.get(commonWidgetSelector.widgetConfigHandle(widgetName)).click();
};

export const verifyAndModifyToggleFx = (
  paramName,
  defaultValue,
  toggleModification = true
) => {
  cy.get(commonWidgetSelector.parameterLabel(paramName)).should(
    "have.text",
    paramName
  );
  cy.get(
    commonWidgetSelector.parameterFxButton(
      paramName,
      "[class*='fx-button  unselectable']"
    )
  )
    .should("have.text", "Fx")
    .click();
  if (defaultValue)
    cy.get(commonWidgetSelector.parameterInputField(paramName))
      .find("pre.CodeMirror-line")
      .should("have.text", defaultValue);
  cy.get(commonWidgetSelector.parameterFxButton(paramName)).click();
  if (toggleModification == true)
    cy.get(commonWidgetSelector.parameterTogglebutton(paramName)).click();
};

export const addDefaultEventHandler = (message) => {
  cy.get(commonWidgetSelector.addEventHandlerLink)
    .should("have.text", commonWidgetText.addEventHandlerLink)
    .click();
  cy.get(commonWidgetSelector.eventHandlerCard).click();
  cy.get(commonWidgetSelector.alertMessageInputField)
    .find('[data-cy*="-input-field"]')
    .clearAndTypeOnCodeMirror(message);
};

export const addAndVerifyTooltip = (widgetSelector, message) => {
  cy.get(commonWidgetSelector.tooltipInputField).clearAndTypeOnCodeMirror(
    message
  );
  cy.forceClickOnCanvas();
  cy.get(widgetSelector)
    .trigger("mouseover")
    .then(() => {
      cy.get(commonWidgetSelector.tooltipLabel).should("have.text", message);
    });
};

export const editAndVerifyWidgetName = (name) => {
  cy.get(commonWidgetSelector.WidgetNameInputField).clear().type(name);
  cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();

  cy.get(commonWidgetSelector.draggableWidget(name)).trigger("mouseover");
  cy.get(commonWidgetSelector.widgetConfigHandle(name))
    .click()
    .should("have.text", name);
};

export const verifyComponentValueFromInspector = (
  componentName,
  value,
  openStatus = "closed"
) => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  if (openStatus == "closed") {
    cy.get(commonWidgetSelector.inspectorNodeComponents).click();
    cy.get(commonWidgetSelector.nodeComponent(componentName)).click();
  }
  cy.get(commonWidgetSelector.nodeComponentValue).contains(value);
};

export const verifyMultipleComponentValuesFromInspector = (
  componentName,
  values = [],
  openStatus = "closed"
) => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  if (openStatus == "closed") {
    cy.get(commonWidgetSelector.inspectorNodeComponents).click();
    cy.get(commonWidgetSelector.nodeComponent(componentName)).click();
    cy.get(commonWidgetSelector.nodeComponentValues).click();
  }
  values.forEach((value, i) =>
    cy
      .get(`[data-cy="inspector-node-${i}"] > .mx-2`)
      .should("have.text", `${value}`)
  );
  cy.forceClickOnCanvas();
};

export const selectColourFromColourPicker = (parentElement, colour) => {
  cy.get(parentElement).within(() => {
    colour.forEach((value, i) =>
      cy
        .get(commonWidgetSelector.colourPickerInput(i + 1))
        .click()
        .clear()
        .type(value)
        .then(($input) => {
          if (!$input.val(value)) {
            cy.get(commonWidgetSelector.colourPickerInput(i + 1))
              .click()
              .clear()
              .type(value);
          }
        })
    );
  });
  cy.get(commonSelectors.autoSave, { timeout: 10000 }).should(
    "have.text",
    commonText.autoSave
  );
};

export const fillBoxShadowParams = (paramLabels, values) => {
  paramLabels.forEach((label, i) =>
    cy
      .get(commonWidgetSelector.boxShadowParamInput(label))
      .click()
      .clear()
      .type(values[i])
      .then(($input) => {
        if (!$input.val(values[i])) {
          cy.get(commonWidgetSelector.boxShadowParamInput(label))
            .click()
            .clear()
            .type(values[i]);
        }
      })
  );
};

export const verifyBoxShadowCss = (widgetName, color, shadowParam) => {
  cy.forceClickOnCanvas();
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .parent()
    .should(
      "have.css",
      "box-shadow",
      `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 100}) ${
        shadowParam[0]
      }px ${shadowParam[1]}px ${shadowParam[2]}px ${shadowParam[3]}px`
    );
};
