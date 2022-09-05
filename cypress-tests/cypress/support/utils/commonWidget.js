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
  verifyTooltip(widgetSelector, message);
};

export const verifyTooltip = (widgetSelector, message) => {
  cy.forceClickOnCanvas();
  cy.get(widgetSelector)
    .trigger("mouseover")
    .then(() => {
      cy.get(commonWidgetSelector.tooltipLabel).should("have.text", message);
    });
};

export const editAndVerifyWidgetName = (name) => {
  cy.clearAndType(commonWidgetSelector.WidgetNameInputField, name);
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

export const selectColourFromColourPicker = (paramName, colour) => {
  cy.get(commonWidgetSelector.stylePicker(paramName)).click();
  cy.get(commonWidgetSelector.colourPickerParent).within(() => {
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
  cy.waitForAutoSave();
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
    .parents('[role = "Box"]')
    .should(
      "have.css",
      "box-shadow",
      `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 100}) ${
        shadowParam[0]
      }px ${shadowParam[1]}px ${shadowParam[2]}px ${shadowParam[3]}px`
    );
};

export const verifyComponentFromInspector = (
  componentName,
  openStatus = "closed"
) => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  if (openStatus == "closed") {
    cy.get(commonWidgetSelector.inspectorNodeComponents).click();
    cy.get(
      commonWidgetSelector.nodeComponent(componentName)
    ).verifyVisibleElement("have.text", componentName);
  }
};

export const verifyAndModifyStylePickerFx = (
  paramName,
  defaultValue,
  value,
) => {
  cy.get(commonWidgetSelector.parameterLabel(paramName)).should(
    "have.text",
    paramName
  );
  cy.get(commonWidgetSelector.stylePicker(paramName)).should("be.visible");
  cy.get(commonWidgetSelector.stylePickerValueIcon(paramName)).should(
    "be.visible"
  );

  cy.get(commonWidgetSelector.stylePickerValue(paramName))
    .should("be.visible")
    .verifyVisibleElement("have.text", defaultValue);
  cy.get(
    commonWidgetSelector.parameterFxButton(
      paramName,
      "[class*='fx-button  unselectable']"
    )
  )
    .should("have.text", "Fx")
    .click();

  cy.get(commonWidgetSelector.stylePickerFxInput(paramName)).within(() => {
    cy.get(".CodeMirror-line")
      .should("be.visible")
      .and("have.text", defaultValue);
  });

  cy.get(
    commonWidgetSelector.stylePickerFxInput(paramName)
  ).clearAndTypeOnCodeMirror(value)

  cy.get(commonWidgetSelector.stylePickerFxInput(paramName)).within(() => {
    cy.get(".CodeMirror-line").should("be.visible").and("have.text", value);
  });
};

export const verifyWidgetColorCss = (widgetName, cssProperty, color) => {
  cy.forceClickOnCanvas();
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should(
    "have.css",
    cssProperty,
    `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 100})`
  );
};

export const verifyLoaderColor = (widgetName, color) => {
  cy.forceClickOnCanvas();
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .should("attr", "style")
    .and(
      "contains",
      `--loader-color:rgba(${color[0]}, ${color[1]}, ${color[2]}, ${
        color[3] / 100
      })`
    );
};

export const verifyLayout = (widgetName) => {
  openEditorSidebar(widgetName);
  openAccordion(commonWidgetText.accordionLayout)
  verifyAndModifyToggleFx(
    commonWidgetText.parameterShowOnDesktop,
    commonWidgetText.codeMirrorLabelTrue
  );
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should("not.exist");

  verifyAndModifyToggleFx(
    commonWidgetText.parameterShowOnMobile,
    commonWidgetText.codeMirrorLabelFalse
  );
  cy.get(commonWidgetSelector.changeLayoutButton).click();
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should("exist");
};
