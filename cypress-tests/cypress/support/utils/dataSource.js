import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { cyParamName } from "Selectors/common";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { dataSourceSelector } from "Selectors/dataSource";
import { dataSourceText } from "Texts/dataSource";
import { navigateToAppEditor } from "Support/utils/common";


export const verifyCouldnotConnectWithAlert = (dangerText) => {
  cy.get(postgreSqlSelector.connectionFailedText, {
    timeout: 10000,
  }).verifyVisibleElement("have.text", postgreSqlText.couldNotConnect, {
    timeout: 5000,
  });
};

export const resizeQueryPanel = (height = "90") => {
  cy.get('[class="query-pane"]').invoke("css", "height", `calc(${height}%)`);
};

export const query = (operation) => {
  cy.get(`[data-cy="query-${operation}-button"]`).click();
};

export const verifypreview = (type, data) => {
  cy.get(`[data-cy="preview-tab-${type}"]`).click();
  cy.get(`[data-cy="preview-${type}-data-container"]`).verifyVisibleElement(
    "contain.text",
    data,
    [{ timeout: 15000 }]
  );
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
  // cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Deleted");
  // cy.get(commonSelectors.breadcrumbTitle).click()
  // cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
  //   "have.text",
  //   " Databases"
  // );
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

export const addQueryN = (queryName, query, dbName) => {
  cy.get("body").then(($body) => {
    if ($body.find('[data-cy="gds-querymanager-search-bar"]').length > 0) {
      cy.clearAndType('[data-cy="gds-querymanager-search-bar"]', `${dbName}`);
    }
  });
  cy.intercept("POST", "http://localhost:3000/api/data_queries").as(
    "createQuery"
  );

  cy.get(`[data-cy="${dbName}-add-query-card"] > .text-truncate`).click();
  cy.get('[data-cy="query-rename-input"]').clear().type(queryName);
  cy.forceClickOnCanvas();

  cy.wait("@createQuery").then((interception) => {
    const dataQueryId = interception.response.body.id;
    cy.visit("/my-workspace");
    cy.addQueryApi(queryName, query, dataQueryId);
    cy.openApp();
  });
};

export const addQuery = (queryName, query, dbName) => {
  cy.get('[data-cy="show-ds-popover-button"]').click();
  cy.get(".css-1rrkggf-Input").type(`${dbName}`);
  cy.intercept("POST", "http://localhost:3000/api/data_queries").as(
    "createQuery"
  );
  cy.contains(`[id*="react-select-"]`, dbName).click();

  cy.get('[data-cy="query-rename-input"]').clear().type(queryName);

  cy.wait("@createQuery").then((interception) => {
    const dataQueryId = interception.response.body.id;
    cy.visit("/my-workspace");
    cy.addQueryApi(queryName, query, dataQueryId);
    cy.openApp();
  });
};

export const addQueryAndOpenEditor = (queryName, query, dbName, appName) => {
  cy.get('[data-cy="show-ds-popover-button"]').click();
  cy.get(".css-1rrkggf-Input").type(`${dbName}`);
  cy.intercept("POST", "http://localhost:3000/api/data_queries").as(
    "createQuery"
  );
  cy.contains(`[id*="react-select-"]`, dbName).click();

  cy.get('[data-cy="query-rename-input"]').clear().type(queryName);

  cy.wait("@createQuery").then((interception) => {
    const dataQueryId = interception.response.body.id;
    cy.visit("/my-workspace");
    cy.addQueryApi(queryName, query, dataQueryId);
    navigateToAppEditor(appName);
    cy.wait(2000);
  });
};


export const verifyValueOnInspector = (queryName, value) => {
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
  cy.wait(500)
  cy.get(`[data-cy="${cyParamName(datasourceName)}-button"]`).click()
}