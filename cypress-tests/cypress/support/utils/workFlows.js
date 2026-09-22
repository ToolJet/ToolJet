import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { workflowsText } from "Texts/platform/workflows";
import { workflowSelector } from "Selectors/platform/workflows";
import { dashboardSelector } from "Selectors/platform/dashboard";
import { dataSourceSelector } from "Selectors/marketplace/dataSource";
import { postgreSqlSelector } from "Selectors/marketplace/postgreSql";
import { postgreSqlText } from "Texts/marketplace/postgreSql";
import { viewAppCardOptions } from "Support/utils/common";

export const enterJsonInputInStartNode = (jsonValue) => {
  cy.get(workflowSelector.startNode).click({ force: true });
  cy.get(workflowSelector.parametersInputField)
    .click()
    .realType("{")
    .realType('"')
    .realType(workflowsText.jsonKeyPlaceholder)
    .realType('"')
    .realType(":")
    .realType('"')
    .realType(jsonValue || workflowsText.jsonValuePlaceholder)
    .realType('"')
    .realType("}");

  cy.wait(500);
  cy.get("body").click(50, 50);
  cy.wait(500);
};

export const navigateBackToWorkflowsDashboard = () => {
  cy.get(commonSelectors.pageLogo).click();
  cy.get(commonSelectors.backToAppOption).click();
};

export const revealWorkflowToken = (selectors) => {
  cy.get(selectors.workflowTokenField)
    .invoke("text")
    .then((tokenText) => {
      if (tokenText.includes("*")) {
        cy.get(selectors.workflowTokenEyeIcon).click({ force: true });
        cy.wait(300);
        revealWorkflowToken(selectors);
      }
    });
};

export const importWorkflowApp = (
  workflowName,
  fixturePath = "cypress/fixtures/exportedApp.json"
) => {
  cy.get(workflowSelector.importWorkFlowsOption).click();
  cy.get(workflowSelector.importWorkFlowsLabel).click();
  cy.get('input[type="file"]').first().selectFile(fixturePath, { force: true });
  cy.wait(2000);
  cy.get(workflowSelector.workFlowNameInputField).clear().type(workflowName);
  cy.get(workflowSelector.importWorkFlowsButton).click();
};

export const deleteAppandWorkflowAfterExecution = (workflowName, appName) => {
  cy.backToApps();
  cy.deleteApp(appName);
  cy.get(workflowSelector.globalWorkFlowsIcon).click();
  cy.intercept("DELETE", "/api/apps/*").as("appDeleted");
  cy.get(commonSelectors.appCard(workflowName))
    .realHover()
    .find(commonSelectors.appCardOptionsButton)
    .realHover()
    .click();
  cy.get(workflowSelector.deleteWorkFlowOption).click();
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  cy.wait("@appDeleted");
};

export const verifyPreviewOutputText = (expectedOutput) => {
  cy.get('[data-cy="preview-button"]').click();
  cy.wait(2000);
  cy.get('[data-cy="inspector-node-data"]')
    .parents(".json-node-element")
    .find(".json-tree-node-icon")
    .click({ force: true });

  cy.get('[data-cy="inspector-node-key"] .json-tree-valuetype', {
    timeout: 5000,
  })
    .invoke("text")
    .should("include", expectedOutput);
};

// ---------------------------------------------------------------------------
// Workflows dashboard
//
// The workflows dashboard renders the same dashboard surface as apps, in a
// workflow mode. Observable consequence: the apps dashboard helpers in
// Support/utils/common.js (createFolder, deleteFolder, viewAppCardOptions,
// viewFolderCardOptions, verifyModal, cancelModal, closeModal) and their
// data-cy hooks all apply here unchanged. Only the route, the create flow and
// the card-menu copy differ.
// ---------------------------------------------------------------------------

export const openWorkflowsDashboard = () => {
  cy.get(workflowSelector.globalWorkFlowsIcon).click();
  cy.wait(2000);
};

export const createWorkflowFromDashboard = (workflowName) => {
  cy.get(workflowSelector.workflowsCreateButton).click();
  cy.get(workflowSelector.workFlowNameInputField).clear().type(workflowName);
  cy.get(workflowSelector.createWorkFlowsButton).click();
  cy.wait(3000);
};

// Rename from the card menu. It opens the shared rename modal, whose input is
// `app-name-input`; the submit label differs for workflows, so the modal's
// primary action is targeted by text rather than a hardcoded app-only data-cy.
export const renameWorkflowFromCard = (currentName, newName) => {
  viewAppCardOptions(currentName);
  cy.get(commonSelectors.appCardOptions(workflowsText.renameWorkflowOption)).click();
  cy.get(commonSelectors.modalComponent).should("be.visible");
  cy.get(commonSelectors.appNameInput).type(
    `{selectAll}{backspace}${newName}`,
    { force: true }
  );
  cy.get(commonSelectors.modalComponent)
    .find("button")
    .contains(new RegExp(`^${workflowsText.renameWorkflowOption}$`, "i"))
    .click();
  cy.wait(2000);
};

// Moves a workflow into a folder through the shared Add-to-folder modal, the
// same flow the apps dashboard spec exercises.
export const moveWorkflowToFolder = (workflowName, folderName) => {
  viewAppCardOptions(workflowName);
  cy.get(commonSelectors.appCardOptions(commonText.addToFolderOption)).click();
  cy.get(dashboardSelector.selectFolder).click();
  cy.get(commonSelectors.folderList).contains(folderName).click();
  cy.get(dashboardSelector.addToFolderButton).click();
  cy.wait(2000);
};

// Remove from folder only renders while a folder is open, so the caller must
// already be inside the folder.
export const removeWorkflowFromFolder = (workflowName) => {
  viewAppCardOptions(workflowName);
  cy.get(
    commonSelectors.appCardOptions(commonText.removeFromFolderOption)
  ).click();
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  cy.wait(2000);
};

// ---------------------------------------------------------------------------
// Building workflows
//
// Nearly every workflow case has the same shape: start trigger → one datasource
// node → response node. Only the block, the input field, the query text and the
// response return statement vary. buildLinearWorkflow captures that shape so a
// spec reads as the guarantee it makes rather than thirty lines of wiring.
// ---------------------------------------------------------------------------

export const buildLinearWorkflow = ({
  blockLabel,
  nodeName,
  inputField,
  query,
  responseReturn,
  startJson,
  // Postgres/REST/HarperDB inputs come pre-populated, so they need clearing
  // before typing; the RunJS editor starts empty.
  clearBeforeTyping = false,
  // The large-dataset case types a payload containing sequences CodeMirror would
  // otherwise interpret, and types it with no delay because it is very long.
  typeOptions = { delay: 50 },
  // The REST URL field renders more than one matching input.
  fieldIndex = null,
}) => {
  enterJsonInputInStartNode(startJson);
  cy.connectDataSourceNode(blockLabel);

  cy.get(workflowSelector.nodeName(nodeName)).click({ force: true });

  let field = cy.get(workflowSelector.inputField(inputField));
  if (fieldIndex !== null) field = field.eq(fieldIndex);
  field = field.click({ force: true });
  if (clearBeforeTyping) field = field.clearAndTypeOnCodeMirror("");
  field.realType(query, typeOptions);

  cy.get("body").click(50, 50);
  cy.wait(500);

  cy.connectNodeToResponseNode(nodeName, responseReturn);
};

// ---------------------------------------------------------------------------
// Data sources used by workflow specs
//
// These blocks were duplicated verbatim across three specs. They live here so a
// change to the connection shape is made once.
// ---------------------------------------------------------------------------

export const createPostgresDataSource = (dataSourceName) => {
  cy.get(commonSelectors.globalDataSourceIcon).click();
  cy.apiCreateDataSource(
    `${Cypress.env("server_host")}/api/data-sources`,
    dataSourceName,
    "postgresql",
    [
      { key: "connection_type", value: "manual", encrypted: false },
      { key: "host", value: Cypress.env("pg_host"), encrypted: false },
      { key: "port", value: 5432, encrypted: false },
      { key: "ssl_enabled", value: false, encrypted: false },
      { key: "database", value: "postgres", encrypted: false },
      { key: "ssl_certificate", value: "none", encrypted: false },
      { key: "username", value: Cypress.env("pg_user"), encrypted: false },
      { key: "password", value: Cypress.env("pg_password"), encrypted: false },
      { key: "ca_cert", value: null, encrypted: true },
      { key: "client_key", value: null, encrypted: true },
      { key: "client_cert", value: null, encrypted: true },
      { key: "root_cert", value: null, encrypted: true },
      { key: "connection_string", value: null, encrypted: true },
    ]
  );

  verifyDataSourceConnection(dataSourceName);
};

export const createRestApiDataSource = (dataSourceName) => {
  cy.apiCreateDataSource(
    `${Cypress.env("server_host")}/api/data-sources`,
    dataSourceName,
    "restapi",
    [
      { key: "url", value: "https://jsonplaceholder.typicode.com" },
      { key: "auth_type", value: "none" },
      { key: "grant_type", value: "authorization_code" },
      { key: "add_token_to", value: "header" },
      { key: "header_prefix", value: "Bearer " },
      { key: "access_token_url", value: "" },
      { key: "client_id", value: "" },
      { key: "client_secret", value: "", encrypted: true },
      { key: "audience", value: "" },
      { key: "scopes", value: "read, write" },
      { key: "username", value: "", encrypted: false },
      { key: "password", value: "", encrypted: true },
      { key: "bearer_token", value: "", encrypted: true },
      { key: "auth_url", value: "" },
      { key: "client_auth", value: "header" },
      { key: "headers", value: [["", ""]] },
      { key: "custom_query_params", value: [["", ""]], encrypted: false },
      { key: "custom_auth_params", value: [["", ""]] },
      { key: "access_token_custom_headers", value: [["", ""]], encrypted: false },
      { key: "multiple_auth_enabled", value: false, encrypted: false },
      { key: "ssl_certificate", value: "none", encrypted: false },
      { key: "retry_network_errors", value: true, encrypted: false },
    ]
  );
  cy.reload();
};

// Opens the data source and waits for "connection verified" before any workflow
// is built on it — otherwise a connection failure surfaces later as a confusing
// empty query result.
export const verifyDataSourceConnection = (dataSourceName) => {
  cy.get(dataSourceSelector.dataSourceNameButton(dataSourceName))
    .should("be.visible")
    .click();
  cy.get(postgreSqlSelector.buttonTestConnection).click();
  cy.get(postgreSqlSelector.textConnectionVerified, { timeout: 10000 }).should(
    "have.text",
    postgreSqlText.labelConnectionVerified
  );
  cy.reload();
};

export const verifyTextInResponseOutputLimited = (expectedText, limit = 5) => {
  cy.get(workflowSelector.workflowRunButton).click();
  cy.get(workflowSelector.workflowLogs).should(
    "have.text",
    workflowsText.workflowRunhelperText
  );

  cy.get('[data-cy="response1-node-name"]').click();
  cy.wait(500);
  cy.get('[data-cy="tab-output"]').click();
  cy.wait(500);
  cy.get("body").then(($body) => {
    if (
      $body
        .find("span.node-key")
        .filter((_, el) => el.innerText === workflowsText.responseNodeKey)
        .length
    ) {
      cy.contains("span.node-key", workflowsText.responseNodeKey, {
        timeout: 3000,
      })
        .click({ force: true })
        .wait(300);
    }
  });
  cy.get("body").then(($body) => {
    if ($body.find('[data-cy="inspector-node-data"]').length) {
      cy.get('[data-cy="inspector-node-data"]')
        .parent()
        .find('.json-tree-node-icon')
        .first()
        .then(($icon) => {
          if ($icon[0].style.transform === "rotate(0deg)") {
            cy.wrap($icon).click({ force: true }).wait(300);
          }
        });
    }
  });
  cy.get("body").then(($body) => {
    const icons = $body.find("span.json-tree-node-icon");
    if (icons.length > 0) {
      cy.wrap(icons.slice(0, limit)).each(($el) => {
        if ($el[0].style.transform === "rotate(0deg)") {
          cy.wrap($el).click({ force: true }).wait(200);
        }
      });
    }
  });
  cy.get(".json-tree-valuetype", { timeout: 3000 }).then(($vals) => {
    const texts = [...$vals].map((el) => el.innerText.trim());
    const match = texts.some((txt) => txt.includes(expectedText));
    expect(
      match,
      `Expected some value to include "${expectedText}", but got:\n\n${texts.join("\n")}`
    ).to.be.true;
  });
};