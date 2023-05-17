export const verifyNodeData = (node, type, children) => {
  cy.get(
    `[data-cy="inspector-node-${node.toLowerCase()}"] > .node-length-color`
  )
    .realHover()
    .verifyVisibleElement("have.text", `${children}`);
  cy.get(
    `[data-cy="inspector-node-${node.toLowerCase()}"] > .node-key`
  ).verifyVisibleElement("have.text", node);
  cy.get(
    `[data-cy="inspector-node-${node.toLowerCase()}"] > .node-type`
  ).verifyVisibleElement("have.text", type);
};

export const openNode = (node, index = 0) => {
  cy.get(`[data-cy="inspector-node-${node.toLowerCase()}"] > .node-key`)
    .eq(index)
    .click();
};

export const verifyValue = (node, type, children) => {
  cy.get(`[data-cy="inspector-node-${node.toLowerCase()}"] > .mx-2`)
    .realHover()
    .verifyVisibleElement("have.text", `${children}`);
  cy.get(
    `[data-cy="inspector-node-${node.toLowerCase()}"] > .node-key`
  ).verifyVisibleElement("have.text", node);
  cy.get(
    `[data-cy="inspector-node-${node.toLowerCase()}"] > .mx-1`
  ).verifyVisibleElement("have.text", type);
};
