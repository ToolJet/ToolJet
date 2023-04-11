import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";

export const deleteInnerWidget = (widgetName, innerWidgetName) => {
  cy.get(commonSelectors.canvas).click({ force: true });
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).within(() => {
    cy.get(commonWidgetSelector.draggableWidget(innerWidgetName)).as(
      "innerWidget"
    );
    cy.get("@innerWidget").first().click();
    cy.get(`[data-cy="${innerWidgetName}-delete-button"]`)
      .realClick()
      .should("not.exist");
  });
};

export const dropWidgetToListview = (
  widgetName,
  positionX = 250,
  positionY = 45,
  listviewName
) => {
  const dataTransfer = new DataTransfer();

  cy.forceClickOnCanvas();
  cy.clearAndType(commonSelectors.searchField, widgetName);
  cy.get(commonWidgetSelector.widgetBox(widgetName)).trigger(
    "dragstart",
    { dataTransfer },
    { force: true }
  );
  cy.get(commonWidgetSelector.draggableWidget(listviewName)).within(() => {
    // .click({ force: true })
    cy.get(`[data-cy="${listviewName.toLowerCase()}-row-0"]`)
      .children(".real-canvas")
      .click()
      .trigger("mouseover")
      .trigger("mouseenter")
      .trigger("drop", positionX, positionY, {
        dataTransfer,
        force: true,
        scrollBehavior: top,
        delay: 2000,
      });
  });
  cy.get(`[data-cy="${listviewName.toLowerCase()}-row-0"]`).trigger("dragend");
  cy.waitForAutoSave();
};

export const verifyMultipleComponentValuesFromInspector = (
  listviewName,
  componentName,
  values = [],
  openStatus = "closed"
) => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  if (openStatus == "closed") {
    cy.get(commonWidgetSelector.inspectorNodeComponents).click();
    cy.get(commonWidgetSelector.nodeComponent(listviewName)).click();
    cy.get(commonWidgetSelector.nodeComponent("data")).click();
  }
  values.forEach((value, i) => {
    if (openStatus == "closed") {
      cy.get(commonWidgetSelector.nodeComponent(`${i}`)).click();
      cy.get(
        `${commonWidgetSelector.nodeComponent(componentName)}:eq(${i})`
      ).click();
    }
    cy.get(`${commonWidgetSelector.nodeComponentValue}:eq(${i})`).should(
      "contain.text",
      `${value}`
    );
  });
  cy.forceClickOnCanvas();
};

export const addDataToListViewInputs = (listviewName, childName, data) => {
  cy.get(commonWidgetSelector.draggableWidget(listviewName)).within(() => {
    cy.get(commonWidgetSelector.draggableWidget(childName)).each(
      ($element, i) => {
        cy.wrap($element).type(`{selectAll}${data[i]}`);
      }
    );
  });
};

export const verifyValuesOnList = (listviewName, childName, type, value) => {
  cy.get(commonWidgetSelector.draggableWidget(listviewName)).within(() => {
    cy.get(commonWidgetSelector.draggableWidget(childName)).each(
      ($element, i) => {
        cy.wrap($element).should(`have.${type}`, value[i]);
      }
    );
  });
};

export const verifyExposedValueByToast = (widgetName, datas) => {
  datas.forEach((data, i) => {
    cy.get(`[data-cy=${widgetName.toLowerCase()}-row-${i}]`).click();
    cy.verifyToastMessage(`${commonSelectors.toastMessage}:eq(0)`, data);
  });
};

export const textArrayOfLength = (index) => {
  const labels = [];
  for (let i = 0; i < index; i++) {
    labels.push(`${fake.firstName}`);
  }
  return labels;
};
