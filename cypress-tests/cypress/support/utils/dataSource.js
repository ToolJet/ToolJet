import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { cyParamName } from "../../constants/selectors/common";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

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
  cy.reload();
  cy.get(`[data-cy="${cyParamName(datasourceName)}-button"]`)
    .parent()
    .within(() => {
      cy.get(`[data-cy="${cyParamName(datasourceName)}-delete-button"]`).invoke(
        "click"
      );
    });
  cy.get('[data-cy="yes-button"]').click();

  cy.wait(1000);
  cy.get("body").then(($body) => {
    if (
      $body.find(`[data-cy="${cyParamName(datasourceName)}-button"]`).length > 0
    ) {
      cy.get(`[data-cy="${cyParamName(datasourceName)}-button"]`)
        .parent()
        .within(() => {
          cy.get(
            `[data-cy="${cyParamName(datasourceName)}-delete-button"]`
          ).invoke("click");
        });
      cy.get('[data-cy="yes-button"]').click();
    }
  });
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
