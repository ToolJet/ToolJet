import { commonWidgetSelector, inspectorSelectors } from "Selectors/common";

export const openAndVerifyNode = (nodeName, nodes, verificationFunction) => {
  openStateFromComponent(nodeName);
  verifyNodes(nodes, verificationFunction);
};

export const verifyNodes = (nodes, verificationFunction) => {
  nodes.forEach((node) =>
    verificationFunction(node.key, node.type, node.value)
  );
};

export const openNode = (node, index = 0, time = 1000) => {
  cy.get(`[data-cy="inspector-${node.toLowerCase()}-expand-button"]`, {
    timeout: time,
  })
    .eq(index)
    .click();
};

export const openStateFromComponent = (widgetName) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .realHover()
    .realHover();

  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .realHover()
    .then(() => {
      cy.get(`[data-cy="${widgetName}-inspect-button"]`)
        .realHover({ position: "topRight" })
        .last()
        .realClick();
    });
};

export const verifyNodeData = (node, type, value, index = 0) => {
  cy.get(`[data-cy="inspector-${node.toLowerCase()}-label"]`)
    .eq(index)
    .realHover()
    .verifyVisibleElement("have.text", `${node}`);

  cy.get(`[data-cy="inspector-${node.toLowerCase()}-value"]`)
    .eq(index)
    .verifyVisibleElement("have.text", type == "Function" ? "function" : value);
};

export const deleteComponentFromInspector = (node) => {
  cy.get('[data-cy="inspector-menu-icon"]').click();
  cy.get(`[data-cy="inspector-delete-component-action"`)
    .realHover()
    .parent()
    .find('[style="height: 13px; width: 13px;"] > img')
    .last()
    .click();
};

export const navigateToInspectorNodes = ([node, subNode, label]) => {
  cy.get('[data-cy="left-sidebar-inspector"] [aria-label="Inspector"]')
    .should("be.visible")
    .click();
  cy.get(".tooltip-inner").invoke("hide");
  cy.get(inspectorSelectors.inspectorNode(node)).should("be.visible");
  cy.get(inspectorSelectors.inspectorGlobalsExpandButton(node))
    .should("be.visible")
    .click();
  cy.get(inspectorSelectors.inspectorSubNode(subNode))
    .should("be.visible")
    .click();
  if (label) {
    cy.get(inspectorSelectors.inspectorNodeLabel(label))
      .should("be.visible")
      .click();
  } else {
    cy.get(inspectorSelectors.inspectorNodeLabel(label)).should("not.exist");
  }
};

export const verifyInspectorValue = (node, expectedValue) => {
  cy.get(
    `${inspectorSelectors.inspectorNodeValue(node)} > .json-viewer-node-value > div`
  )
    .should("be.visible")
    .and("have.text", expectedValue);
};
export const navigateAndVerifyInspector = (
  nodePath = [],
  keyValueDataList = [],
  expectedValue
) => {
  navigateToInspectorNodes(nodePath); //
  if (expectedValue) {
    const lastNode = nodePath[nodePath.length - 1];
    verifyInspectorValue(lastNode, expectedValue);
  }
  if (keyValueDataList.length) {
    keyValueDataList.forEach(([key, value]) => {
      cy.get(
        `${inspectorSelectors.inspectorNodeLabel(
          key
            .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
            .replace(/[^a-zA-Z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
        )} > div`
      ).should(
        "have.text",
        key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase()
      );
      cy.get(
        `${inspectorSelectors.inspectorNodeValue(
          key
            .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
            .replace(/[^a-zA-Z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
        )} > .json-viewer-node-value > div`
      ).should("have.text", `"${value}"`);
    });
  }
};
