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

// `fixture` is a path or an in-memory file — anything cy.selectFile accepts.
// `beforeImport` runs once the file is picked, while the import modal is open.
export const importWorkflowApp = (
  workflowName,
  fixture = "cypress/fixtures/exportedApp.json",
  { beforeImport } = {}
) => {
  cy.get(workflowSelector.importWorkFlowsOption).click();
  cy.get(workflowSelector.importWorkFlowsLabel).click();
  cy.get('input[type="file"]').first().selectFile(fixture, { force: true });
  cy.wait(2000);
  cy.get(workflowSelector.workFlowNameInputField).clear().type(workflowName);
  if (beforeImport) beforeImport();

  // Import navigates into the editor client-side, so nothing otherwise waits
  // for the imported app's version data to arrive before a caller interacts
  // with the canvas — a Run click straight after import can fire before the
  // version is loaded and get a 400 from the trigger endpoint.
  cy.intercept("GET", "/api/apps/*/versions").as("importedVersionsLoaded");
  cy.get(workflowSelector.importWorkFlowsButton).click();
  cy.wait("@importedVersionsLoaded", { timeout: 20000 });
  // The network response resolving doesn't guarantee the store has committed
  // and re-rendered yet, so a settle buffer follows it.
  cy.wait(1500);
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

// Rename from the card menu. The shared rename modal derives its hooks from the
// app type, so on the workflows dashboard the input is `workflow-name-input` and
// the submit is `rename-workflow` — not the app-typed `app-name-input` /
// `rename-app`. The submit stays disabled until the name actually changes.
export const renameWorkflowFromCard = (currentName, newName) => {
  viewAppCardOptions(currentName);
  cy.get(commonSelectors.appCardOptions(workflowsText.renameWorkflowOption)).click();
  cy.get(commonSelectors.modalComponent).should("be.visible");
  cy.get(workflowSelector.workFlowNameInputField).type(
    `{selectAll}{backspace}${newName}`,
    { force: true }
  );
  cy.get(workflowSelector.renameWorkflowButton).should("be.enabled").click();
  cy.get(commonSelectors.modalComponent).should("not.exist");
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
// Teardown
//
// For afterEach hooks, so a test that fails part-way still cleans up — otherwise
// what it created leaks into every later test on the same instance.
// These helpers are deliberately tolerant: a test may already have deleted or
// renamed what it created, and a hook that throws on "not found" would turn a
// passing test red. cy.apiDeleteWorkflow throws in exactly that case, so it is
// not usable here.
// ---------------------------------------------------------------------------

const withAuthHeaders = (fn) => {
  cy.getCookie("tj_auth_token", { log: false }).then((cookie) => {
    // No session means nothing this test could have created is reachable.
    if (!cookie) return;
    fn({
      "Tj-Workspace-Id": Cypress.env("workspaceId"),
      Cookie: `tj_auth_token=${cookie.value}`,
    });
  });
};

// Deletes each named app of the given type ("workflow" or "front-end") if it
// still exists.
const cleanupAppsOfType = (names, type) => {
  withAuthHeaders((headers) => {
    names.filter(Boolean).forEach((name) => {
      cy.request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/apps?page=1&type=${type}&searchKey=${encodeURIComponent(name)}`,
        headers,
        failOnStatusCode: false,
        log: false,
      }).then((res) => {
        (res.body?.apps || [])
          .filter((app) => app.name === name)
          .forEach((app) =>
            cy.request({
              method: "DELETE",
              url: `${Cypress.env("server_host")}/api/apps/${app.id}`,
              headers,
              failOnStatusCode: false,
              log: false,
            })
          );
      });
    });
  });
};

export const cleanupWorkflows = (names = []) => cleanupAppsOfType(names, "workflow");
export const cleanupApps = (names = []) => cleanupAppsOfType(names, "front-end");

// Deletes each named folder if it still exists. `types` matters: folder names
// are unique per type, so a workflow folder and an app folder can share a name.
export const cleanupFolders = (names = [], types = ["workflow"]) => {
  withAuthHeaders((headers) => {
    types.forEach((type) => {
      cy.request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/folder-apps?searchKey=&type=${type}`,
        headers,
        failOnStatusCode: false,
        log: false,
      }).then((res) => {
        (res.body?.folders || [])
          .filter((folder) => names.includes(folder.name))
          .forEach((folder) =>
            cy.request({
              method: "DELETE",
              url: `${Cypress.env("server_host")}/api/folders/${folder.id}`,
              headers,
              failOnStatusCode: false,
              log: false,
            })
          );
      });
    });
  });
};

// Run after cleanupWorkflows: a data source still used by a workflow query
// can't be deleted.
export const cleanupDataSources = (names = []) => {
  withAuthHeaders((headers) => {
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/data-sources/${Cypress.env("workspaceId")}`,
      headers,
      failOnStatusCode: false,
      log: false,
    }).then((res) => {
      (res.body?.data_sources || [])
        .filter((dataSource) => names.includes(dataSource.name))
        .forEach((dataSource) =>
          cy.request({
            method: "DELETE",
            url: `${Cypress.env("server_host")}/api/data-sources/${dataSource.id}`,
            headers,
            failOnStatusCode: false,
            log: false,
          })
        );
    });
  });
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

// Opens the data source and waits for its connection test to pass before any
// workflow is built on it — otherwise a connection failure surfaces later as a
// confusing empty query result.
export const verifyDataSourceConnection = (dataSourceName) => {
  // The data source list scrolls, so a new entry can sit below its fold.
  cy.get(dataSourceSelector.dataSourceNameButton(dataSourceName))
    .scrollIntoView()
    .should("be.visible")
    .click();
  testDataSourceConnection();
  cy.reload();
};

// The result arrives as a toast. A failed test reads "Test connection could not
// be verified", which then shows up in the assertion message.
export const testDataSourceConnection = () => {
  cy.get(postgreSqlSelector.buttonTestConnection).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    postgreSqlText.toastConnectionVerified
  );
};

// ---------------------------------------------------------------------------
// Importing and running exported workflows
// ---------------------------------------------------------------------------

// Import reuses any global data source with the same name and kind, so the
// export's data source is renamed per run to keep each import on its own.
export const workflowImportFile = (fixturePath, dataSourceKind, dataSourceName) =>
  cy.readFile(fixturePath).then((exported) => {
    exported.app[0].definition.appV2.dataSources
      .filter((dataSource) => dataSource.kind === dataSourceKind)
      .forEach((dataSource) => {
        dataSource.name = dataSourceName;
      });
    return {
      contents: Cypress.Buffer.from(JSON.stringify(exported)),
      fileName: fixturePath.split("/").pop(),
      mimeType: "application/json",
    };
  });

export const isPluginInstalled = (pluginId) =>
  cy.getAuthHeaders().then((headers) =>
    cy
      .request({ url: `${Cypress.env("server_host")}/api/plugins`, headers, log: false })
      .then(({ body }) => body.some((plugin) => plugin.pluginId === pluginId))
  );

// Not cy.apiSetDataSourceCredentials: a failed request there dumps the request
// body, key included, into the run log. Here only the status is asserted.
export const setOpenAiApiKey = (dataSourceName, apiKey) =>
  cy.apiGetEnvironments().then((environments) => {
    const development = environments.find((env) => env.name === "development");
    cy.apiGetDataSourceIdByName(dataSourceName).then((dataSourceId) =>
      cy.getAuthHeaders().then((headers) =>
        cy
          .request({
            method: "PUT",
            url: `${Cypress.env("server_host")}/api/data-sources/${dataSourceId}?environment_id=${development.id}`,
            headers,
            body: {
              name: dataSourceName,
              options: [{ key: "apiKey", value: apiKey, encrypted: true }],
            },
            failOnStatusCode: false,
            log: false,
          })
          .its("status", { log: false })
          .should("equal", 200)
      )
    );
  });

// The editor runs workflows synchronously: the trigger request resolves only
// once the run has finished, so waiting on it also covers slow agent runs.
export const runWorkflowFromEditor = (timeout = 120000) => {
  cy.intercept("POST", "/api/workflow_executions/*/trigger").as("workflowRun");
  cy.get(workflowSelector.workflowRunButton).should("not.be.disabled").click();
  return cy
    .wait("@workflowRun", { responseTimeout: timeout })
    .its("response.body.result");
};

// An app's workflow query triggers the run the same synchronous way, so the
// trigger response carries the workflow's result.
export const previewWorkflowQueryInApp = (expectedText, timeout = 60000) => {
  cy.intercept("POST", "/api/workflow_executions/*/trigger").as("appWorkflowRun");
  cy.get(dataSourceSelector.queryPreviewButton).click();
  cy.wait("@appWorkflowRun", { responseTimeout: timeout })
    .its("response.body.result")
    .as("appWorkflowResult");
  cy.get(dataSourceSelector.previewTabRaw).click();
  cy.get(dataSourceSelector.previewTabRawContainer).should(
    "contain.text",
    expectedText
  );
  return cy.get("@appWorkflowResult");
};

export const getWorkflowExecution = (executionId) =>
  cy.getAuthHeaders().then((headers) =>
    cy
      .request({
        url: `${Cypress.env("server_host")}/api/workflow_executions/${executionId}`,
        headers,
        log: false,
      })
      .its("body")
  );

export const getWorkflowQueries = (workflowId) =>
  cy.getAuthHeaders().then((headers) =>
    cy
      .request({ url: `${Cypress.env("server_host")}/api/apps/${workflowId}`, headers, log: false })
      .its("body.data_queries")
  );

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