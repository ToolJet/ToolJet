import { commonSelectors, cyParamName } from "Selectors/common";
import { dataSourceSelector } from "Selectors/marketplace/dataSource";
import { postgreSqlSelector } from "Selectors/marketplace/postgreSql";
import { verifyAppDelete } from "Support/utils/dashboard";
import { postgreSqlText } from "Texts/marketplace/postgreSql";

// Datasource CONNECTION helpers only. Query-panel / query-manager operations
// (query, addQuery*, createDataQuery, createRestAPIQuery, verifypreview,
// verifyPreviewData) moved to appBuilder/querymanager/queries.js.

export const verifyCouldnotConnectWithAlert = (alertText) => {
  cy.get(postgreSqlSelector.connectionFailedText, {
    timeout: 10000,
  }).verifyVisibleElement("have.text", postgreSqlText.couldNotConnect, {
    timeout: 5000,
  });
  cy.get(dataSourceSelector.connectionAlertText).verifyVisibleElement(
    "contain",
    alertText
  );
};

export const deleteWorkflowAndDS = (appName, datasourceName) => {
  cy.deleteWorkflow(appName);
  deleteDatasource(datasourceName);
};

export const addInput = (field, data) => {
  cy.get(
    `[data-cy="${field.toLowerCase()}-input-field"]`
  ).clearAndTypeOnCodeMirror(data);
};

export const deleteDatasource = (datasourceName) => {
  cy.get(commonSelectors.globalDataSourceIcon).click();
  cy.get("body").then(($body) => {
    if ($body.find(".tooltip-inner").length > 0) {
      cy.get(".tooltip-inner").invoke("hide");
    }
  });
  cy.get(dataSourceSelector.addedDsSearchIcon).click();
  cy.clearAndType(dataSourceSelector.AddedDsSearchBar, datasourceName);
  cy.get(`[data-cy="${cyParamName(datasourceName)}-button"]`)
    .parent()
    .within(() => {
      cy.get(dataSourceSelector.deleteDSButton(datasourceName)).invoke("click");
    });
  cy.get('[data-cy="yes-button"]').click();
};

export const deleteAppandDatasourceAfterExecution = (
  appName,
  datasourceName
) => {
  cy.backToApps();
  cy.deleteApp(appName);
  verifyAppDelete(appName);
  deleteDatasource(datasourceName);
};

export const closeDSModal = () => {
  cy.get("body").then(($body) => {
    cy.wait(500);
    if (
      $body.find('[data-cy="button-close-ds-connection-modal"]> img').length > 0
    ) {
      cy.get('[data-cy="button-close-ds-connection-modal"]').realClick();
      closeDSModal();
    }
  });
};

export const verifyValueOnInspector = (queryName, value) => {
  cy.get('[data-cy="left-sidebar-inspector-button"]').click();
  cy.hideTooltip();
  cy.get('[data-cy="inspector-node-queries"]')
    .parent()
    .within(() => {
      cy.get("span").first().scrollIntoView().contains("queries").click();
    });
  cy.get("body").then(($body) => {
    if (
      $body.find(`[data-cy="inspector-node-${queryName}"] > .node-key`).length >
      0
    ) {
      cy.get(`[data-cy="inspector-node-${queryName}"] > .node-key`).click();
      cy.get('[data-cy="inspector-node-data"] > .fs-9').verifyVisibleElement(
        "have.text",
        value
      );
    }
  });
};

export const selectDatasource = (datasourceName) => {
  cy.get(dataSourceSelector.addedDsSearchIcon).click();
  cy.clearAndType(dataSourceSelector.AddedDsSearchBar, datasourceName);
  cy.wait(500);
  cy.get(`[data-cy="${cyParamName(datasourceName)}-button"]`).click();
};
