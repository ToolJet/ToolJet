import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { listviewSelector } from "Selectors/listview";

export const deleteInnerWidget = (widgetName, innerWidgetName) => {
  cy.get(commonSelectors.canvas).click({ force: true });
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).within(() => {
    cy.get(commonWidgetSelector.draggableWidget(innerWidgetName)).as(
      "innerWidget"
    );
    cy.get("@innerWidget").first().click();
    cy.get(`[data-cy="${innerWidgetName}-delete-button"]`)
      .click()
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
    cy.get(commonWidgetSelector.inspectorNodeComponents).click(); //components
    cy.get(commonWidgetSelector.nodeComponent(listviewName)).click(); //listview
    cy.get(commonWidgetSelector.nodeComponent("data")).click(); //data

    // cy.get(commonWidgetSelector.nodeComponentValues).click();
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
        cy.wrap($element).type(data[i]);
      }
    );
  });
};
