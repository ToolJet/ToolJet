// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// inspectorTree.js
//   openAndVerifyNode                exposed              → inspector
//   verifyNodes                      exposed              → inspector
//   openNode                         exposed              → inspector
//   openInspector                    -                    → inspector
//   openSubNode                      -                    → inspector
//   openSubNodeAndVerify             -                    → inspector
//   openStateFromComponent           -                    → inspector
//   verifyNodeData                   exposed              → inspector
//   deleteComponentFromInspector     -                    → inspector
//   navigateToInspectorNodes         -                    → inspector
//   verifyInspectorValue             -                    → inspector
//   verifyInspectorKeyValue          -                    → inspector
//   navigateAndVerifyInspector       -                    → inspector
//   verifyComponentValueFromInspector -                    → inspector
//   verifyMultipleComponentValuesFromInspector -                    → inspector
//   verifyComponentFromInspector     -                    → inspector
//   closeInspectorDetail             -                    → inspector
//   openExposedPath                  -                    → inspector
//   verifyExposedValue               -                    → inspector
// └──────────────────────────────────────────────────────────────────┘
/**
 * MODULE — appBuilder/inspectorTree: bottom-panel **component-state inspector** tree.
 * FOR AI: read a component's exposed values + functions (CSA) from the runtime panel's
 * Inspector tab — the reliable way to assert defaults / exposed values / functions:
 *   openNode('components') → openAndVerifyNode(W, exposedValues, verifyNodeData) → verifyNodes(functions, verifyNodeData).
 * NOT here: setting config → properties.js / styles.js · wiring events & CSA → events.js.
 */
import { commonWidgetSelector, inspectorSelectors } from "Selectors/common";

/**
 * @tjType   exposed
 * @tjBlock  inspector
 * @tjUsage  openAndVerifyNode('textinput1', nodes, verifyNodeData)
 * @tjDom    widget inspect-button → runtime panel Inspector → verify detail rows
 */
export const openAndVerifyNode = (nodeName, nodes, verificationFunction) => {
  openStateFromComponent(nodeName);
  verifyNodes(nodes, verificationFunction);
};

/**
 * @tjType   exposed
 * @tjBlock  inspector
 * @tjUsage  verifyNodes([{ key: 'value', type: 'string', value: 'hello' }], verifyNodeData)
 * @tjDom    inspector detail panel rows — key/type/value
 */
export const verifyNodes = (nodes, verificationFunction) => {
  nodes.forEach((node) =>
    verificationFunction(node.key, node.type, node.value)
  );
};

/**
 * @tjType   exposed
 * @tjBlock  inspector
 * @tjUsage  openNode('components', 0)
 * @tjDom    inspector-<node>-expand-button, clicked only while aria-expanded="false"
 */
// Groups start expanded and the header toggles, so click only a collapsed one.
export const openNode = (node, index = 0, time = 15000) => {
  cy.get(`[data-cy="inspector-${node.toLowerCase()}-expand-button"]`, {
    timeout: time,
  })
    .eq(index)
    .then(($button) => {
      if ($button.attr("aria-expanded") === "false") cy.wrap($button).click();
    });
};

// The Inspector tab toggles the runtime panel, and the panel's open state persists in
// localStorage, so click it only when the Inspector is not already showing.
/**
 * @tjBlock  inspector
 * @tjUsage  openInspector()
 * @tjDom    runtime-panel-tab-inspect, clicked only while runtime-inspector is absent
 */
export const openInspector = () => {
  cy.get("body").then(($body) => {
    if (!$body.find('[data-cy="runtime-inspector"]').length) {
      cy.get(commonWidgetSelector.sidebarinspector).click();
    }
  });
};

// --- list + detail inspector navigation helpers ----------------------------
// Current inspector (frontend/src/AppBuilder/QueryPanel/RuntimeInspector/RuntimeInspector.jsx),
// the Inspector tab of the bottom runtime panel:
//  - Category groups (Queries/Components/Globals/Variables/Page/Constants) toggle
//    via `inspector-<type>-expand-button` and start expanded.
//  - Their entries render a clickable subnode label
//    `inspector-<generateCypressDataCy(name)>-subnode-label`.
//  - Clicking an entry shows its values in the detail pane beside the list, whose
//    rows expose `inspector-<generateCypressDataCy(key)>-label` / `-value` (Row.jsx:82,91).
//    The list stays visible, so there is no back step.

// generateCypressDataCy mirror (frontend/src/modules/common/helpers/cypressHelpers.js)
const cyDataCy = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Click a tree subnode label to open its detail panel.
// `parentExpandType` (optional) ensures the owning level-1 node is expanded first.
/**
 * @tjBlock  inspector
 * @tjUsage  openSubNode('textinput1', 'components')
 * @tjDom    inspector-<subnode>-subnode-label click to open detail panel
 */
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

// Expand a level-1 node, open one of its subnodes' detail panel and verify the
// detail rows. Used for non-component nodes (globals/page/variables) where values
// live in the detail panel.
/**
 * @tjBlock  inspector
 * @tjUsage  openSubNodeAndVerify('globals', 'currentUser', nodes, verifyNodeData)
 * @tjDom    inspector level-1 expand → subnode label → detail rows
 */
export const openSubNodeAndVerify = (
  parentExpandType,
  subNodeName,
  nodes,
  verificationFunction
) => {
  openSubNode(subNodeName, parentExpandType);
  verifyNodes(nodes, verificationFunction);
};

/**
 * @tjBlock  inspector
 * @tjUsage  openStateFromComponent('textinput1')
 * @tjDom    widget hover → inspect-button realClick → runtime panel Inspector
 */
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

/**
 * @tjType   exposed
 * @tjBlock  inspector
 * @tjUsage  verifyNodeData('value', 'string', 'hello', 0)
 * @tjDom    inspector-<node>-label + inspector-<node>-value text assertions
 */
export const verifyNodeData = (node, type, value, index = 0) => {
  cy.get(`[data-cy="inspector-${node.toLowerCase()}-label"]`)
    .eq(index)
    .realHover()
    .verifyVisibleElement("have.text", `${node}`);

  cy.get(`[data-cy="inspector-${node.toLowerCase()}-value"]`)
    .eq(index)
    .verifyVisibleElement("have.text", type == "Function" ? "function" : value);
};

/**
 * @tjBlock  inspector
 * @tjUsage  deleteComponentFromInspector('textinput1')
 * @tjDom    components → <node> subnode → inspector-delete-component-action
 */
export const deleteComponentFromInspector = (node) => {
  openSubNode(node, "components");
  cy.get('[data-cy="inspector-delete-component-action"]').click();
};

/**
 * @tjBlock  inspector
 * @tjUsage  navigateToInspectorNodes(['globals', 'currentUser', 'email'])
 * @tjDom    runtime panel Inspector tab → node expand → subnode click → label visibility
 */
export const navigateToInspectorNodes = ([node, subNode, label]) => {
  openInspector();
  cy.hideTooltip();
  openNode(node);
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

/**
 * @tjBlock  inspector
 * @tjUsage  verifyInspectorValue('currentUser', 'admin')
 * @tjDom    inspector node value → json-viewer-node-value div text
 */
export const verifyInspectorValue = (node, expectedValue) => {
  cy.get(
    `${inspectorSelectors.inspectorNodeValue(node)} > .json-viewer-node-value > div`
  )
    .should("be.visible")
    .and("have.text", expectedValue);
};

/**
 * @tjBlock  inspector
 * @tjUsage  verifyInspectorKeyValue('isValid', 'true')
 * @tjDom    inspector-<key>-label + inspector-<key>-value text assertions
 */
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

/**
 * @tjBlock  inspector
 * @tjUsage  navigateAndVerifyInspector(['globals','currentUser','firstName'], [['firstName','Admin']])
 * @tjDom    inspector sidebar full navigation + key/value assertion sequence
 */
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

// ── Three inspector-flavoured helpers from commonWidget.js ────────────────────

/**
 * @tjBlock  inspector
 * @tjUsage  verifyComponentValueFromInspector('textinput1', 'hello')
 * @tjDom    sidebar inspector → components node → component value text
 */
export const verifyComponentValueFromInspector = (
  componentName,
  value,
  openStatus = "closed"
) => {
  cy.wait(3000);
  cy.get(commonWidgetSelector.sidebarinspector).click();
  if (openStatus == "closed") {
    cy.get(commonWidgetSelector.inspectorNodeComponents).click();
    cy.get(commonWidgetSelector.nodeComponent(componentName)).click();
  }
  cy.get(commonWidgetSelector.nodeComponentValue).contains(value);
};

/**
 * @tjBlock  inspector
 * @tjUsage  verifyMultipleComponentValuesFromInspector('select1', ['opt1', 'opt2'])
 * @tjDom    sidebar inspector → components node → values list
 */
export const verifyMultipleComponentValuesFromInspector = (
  componentName,
  values = [],
  openStatus = "closed"
) => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  if (openStatus == "closed") {
    cy.wait(100);
    cy.get(commonWidgetSelector.inspectorNodeComponents).realClick();
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

/**
 * @tjBlock  inspector
 * @tjUsage  verifyComponentFromInspector('textinput1')
 * @tjDom    sidebar inspector → components node → component name label
 */
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

// Closes the runtime panel (clicking the active Inspector tab toggles it shut) so the
// next call starts from a known state.
/**
 * @tjBlock  inspector
 * @tjUsage  closeInspectorDetail()
 * @tjDom    active runtime-panel-tab-inspect click
 */
export const closeInspectorDetail = () => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  // The panel content unmounts only after its exit animation; wait it out so the
  // next openInspector() sees the Inspector as closed.
  cy.get('[data-cy="runtime-inspector"]').should("not.exist");
};


// Matches the PRODUCT's derivation (generateCypressDataCy, cypressHelpers.js) — NOT the
// test-side cyParamName, which only replaces whitespace and so diverges on any key
// containing `_` or `.`.
const inspectorKey = (key) =>
  String(key)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Each hop is scoped to its parent's `.json-viewer-children`: `label` and `value` recur at
// multiple depths with the SAME data-cy, so a global lookup returns whichever comes first.
/**
 * @tjBlock  inspector
 * @tjUsage  openExposedPath('dropdown1', ['selectedOption', 'label'])
 * @tjDom    components node -> widget subnode -> one label click per hop, parent-scoped
 */
export const openExposedPath = (widgetName, path) => {
  openInspector();
  cy.hideTooltip();
  openNode("components");
  openSubNode(widgetName);
  path.forEach((key, i) => {
    const sel = `[data-cy="inspector-${inspectorKey(key)}-label"]`;
    // Hop 0 must exclude nested rows: a top-level label has no `.json-viewer-children`
    // ancestor, and without this the same global-ambiguity bug this helper exists to fix
    // would sit in its own first step.
    if (i === 0)
      cy.get(sel)
        .filter((_i, el) => !el.closest(".json-viewer-children"))
        .first()
        .as(`tjRow${i}`);
    else cy.get(`@tjKids${i - 1}`).find(sel).first().as(`tjRow${i}`);
    // Expand every hop except the leaf, and capture its children as the next scope.
    if (i < path.length - 1) {
      cy.get(`@tjRow${i}`).click();
      cy.get(`@tjRow${i}`)
        .closest(".json-viewer-row-container")
        .parent()
        .children(".json-viewer-children")
        .as(`tjKids${i}`);
    }
  });
};


// Flat key or path — a flat key IS a path of length 1, so both take one walk. widgetName is
// REQUIRED: a default would let a caller who omits it assert against the wrong widget and pass.
// Collapses in reverse and closes, so a second call in one test starts from a known state.
/**
 * @tjBlock  inspector
 * @tjUsage  verifyExposedValue('isLoading', 'Boolean', 'true', 'textinput1')
 * @tjDom    components node -> widget subnode -> parent-scoped label clicks -> leaf value
 */
export const verifyExposedValue = (keyOrPath, type, value, widgetName) => {
  const path = Array.isArray(keyOrPath) ? keyOrPath : [keyOrPath];
  openExposedPath(widgetName, path);
  const leaf = path.length - 1;
  cy.get(`@tjRow${leaf}`).realHover().verifyVisibleElement("have.text", `${path[leaf]}`);
  cy.get(`@tjRow${leaf}`)
    .closest(".json-viewer-row-container")
    .find('[data-cy$="-value"]')
    .first()
    .verifyVisibleElement("have.text", type === "Function" ? "function" : value);
  for (let i = path.length - 2; i >= 0; i--) cy.get(`@tjRow${i}`).click();
  closeInspectorDetail();
};
