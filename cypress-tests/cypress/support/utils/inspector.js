import { commonWidgetSelector } from "Selectors/common";

export const openAndVerifyNode = (nodeName, nodes, verificationFunction) => {
  openStateFromComponent(nodeName);
  verifyNodes(nodes, verificationFunction);
};

export const verifyNodes = (nodes, verificationFunction) => {
  nodes.forEach(node => verificationFunction(node.key, node.type, node.value));
};

export const openNode = (node, index = 0, time = 1000) => {
  cy.get(`[data-cy="inspector-${node.toLowerCase()}-expand-button"]`, { timeout: time })
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
}

export const verifyNodeData = (node, type, value, index = 0) => {
  cy.get(
    `[data-cy="inspector-${node.toLowerCase()}-label"]`
  )
    .eq(index)
    .realHover()
    .verifyVisibleElement("have.text", `${node}`);

  cy.get(`[data-cy="inspector-${node.toLowerCase()}-value"]`)
    .eq(index)
    .verifyVisibleElement("have.text", type == 'Function' ? 'function' : value);
};

export const deleteComponentFromInspector = (node) => {
  cy.get('[data-cy="inspector-menu-icon"]').click();
  cy.get(`[data-cy="inspector-delete-component-action"`).realHover().parent().find('[style="height: 13px; width: 13px;"] > img').last().click();
};