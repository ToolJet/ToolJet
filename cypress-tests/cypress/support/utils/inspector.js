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

export const openNode = (node, index = 0, time = 15000) => {
  cy.get(`[data-cy="inspector-${node.toLowerCase()}-expand-button"]`, {
    timeout: time,
  })
    .eq(index)
    .click();
};

// --- 2-layer tree+detail inspector navigation helpers ---------------------
// Current inspector (frontend/src/AppBuilder/LeftSidebar/LeftSidebarInspector):
//  - Level-1 nodes (Queries/Components/Globals/Variables/Page/Constants) expand
//    via `inspector-<type>-expand-button` (Node.jsx:121).
//  - Their children render a clickable subnode label
//    `inspector-<generateCypressDataCy(name)>-subnode-label` (Node.jsx:149).
//  - Clicking a subnode whose metadata has a `type` (level !== 1) opens a
//    separate JSONViewer detail panel (Node.jsx:73-80 onSelect ->
//    JSONTreeViewerV2.jsx:198 JSONViewer) whose rows expose
//    `inspector-<generateCypressDataCy(key)>-label` / `-value` (Row.jsx:82,91).
//  - The detail panel header is exited via the breadcrumb
//    `inspector-detail-header-back` (TreeViewHeader.jsx:115).

// generateCypressDataCy mirror (frontend/src/modules/common/helpers/cypressHelpers.js)
const cyDataCy = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Click a tree subnode label to open its detail panel.
// `parentExpandType` (optional) ensures the owning level-1 node is expanded first.
export const openSubNode = (subNodeName, parentExpandType = null, time = 15000) => {
  if (parentExpandType) {
    openNode(parentExpandType, 0, time);
  }
  cy.get(`[data-cy="inspector-${cyDataCy(subNodeName)}-subnode-label"]`, {
    timeout: time,
  })
    .first()
    .click();
};

// Return from a detail panel back to the tree view.
export const backFromDetail = () => {
  cy.get('[data-cy="inspector-detail-header-back"]').click();
};

// Expand a level-1 node, open one of its subnodes' detail panel, verify the
// detail rows, then go back to the tree. Used for non-component nodes
// (globals/page/variables) where values live in the detail panel.
export const openSubNodeAndVerify = (
  parentExpandType,
  subNodeName,
  nodes,
  verificationFunction
) => {
  openSubNode(subNodeName, parentExpandType);
  verifyNodes(nodes, verificationFunction);
  backFromDetail();
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

export const verifyInspectorKeyValue = (key, value) => {
  const normalizeKey = (key) =>
    key.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-");

  const expectedLabelText = (key) => {
    if (/^[a-z]+[A-Z]/.test(key)) {
      return key;
    }
    return key;
  };

  const selectorKey = normalizeKey(key);
  const expectedLabel = expectedLabelText(key);

  cy.get(`${inspectorSelectors.inspectorNodeLabel(selectorKey)} > div`).should(
    "have.text",
    expectedLabel
  );

  const valueSelector = `${inspectorSelectors.inspectorNodeValue(selectorKey)} > .json-viewer-node-value > div`;

  let finalValue = value;
  if (value && /[`]/.test(value)) {
    finalValue = value.replace(/`/g, "");
  }
  if (
    finalValue != null &&
    finalValue !== "null" &&
    !finalValue.startsWith('"') &&
    !finalValue.startsWith("[") &&
    !finalValue.startsWith("{")
  ) {
    finalValue = `"${finalValue}"`;
  }
  cy.get(valueSelector).should("have.text", finalValue);
};

export const navigateAndVerifyInspector = (
  nodePath = [],
  keyValueDataList = [],
  expectedValue
) => {
  navigateToInspectorNodes(nodePath);

  if (expectedValue) {
    const lastNode = nodePath[nodePath.length - 1];
    verifyInspectorValue(lastNode, expectedValue);
  }
  // const toSnakeCase = (key) =>
  //   key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

  keyValueDataList.forEach(([key, value]) => {
    verifyInspectorKeyValue(key, value);
  });
};
