import { fake } from "Fixtures/fake";
import { workflowSelector, webhookPanelSelector } from "Selectors/platform/workflows";
import { workflowsText } from "Texts/platform/workflows";
import {
  wfStartNode,
  wfResponseNode,
  wfEdge,
  wfInput,
  workflowDefinition,
  cleanupWorkflows,
  revealWorkflowToken,
} from "Support/utils/workflows/workFlows";
import { openWorkflowEditor } from "Support/utils/workflows/workflowApprovals";

const SLOW_API = {
  responseTimeout: 60000,
  requestTimeout: 60000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 45000,
};

const data = {};

const echoDefinition = ({ workflowInputs, webhookParams } = {}) =>
  workflowDefinition({
    nodes: [wfStartNode(), wfResponseNode("response", "return startTrigger.params")],
    edges: [wfEdge("start", "response")],
    workflowInputs,
    webhookParams,
  });

const inputs = () => [
  wfInput("region", "string", { defaultValue: "eu" }),
  wfInput("limit", "number", { defaultValue: 10 }),
];

const draftQuery = () => ({
  version: Cypress.env("editingVersionName"),
  environment: "development",
});

const openWebhooksPanel = () => {
  openWorkflowEditor();
  cy.get(workflowSelector.workflowWebhookIcon).click();
  cy.get(workflowSelector.workflowEndpointUrl).should("be.visible");
};

const stubClipboard = () =>
  cy.window().then((win) => cy.stub(win.navigator.clipboard, "writeText").as("clipboard").resolves());

const enableWebhook = () => cy.get(workflowSelector.workflowWebhookToggle).click();

const copiedValue = () => cy.get("@clipboard").its("lastCall.args.0");

describe("Workflows - Webhooks panel", SLOW_API, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-whpanel`;
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    cy.apiGetWorkflowToken().then((token) => (data.token = token));
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("The Webhooks switch turns webhook calls off and on again", () => {
    cy.apiSaveWorkflowDefinition(echoDefinition({ workflowInputs: inputs() }));
    openWebhooksPanel();

    cy.get(workflowSelector.workflowWebhookToggle).find("input").should("not.be.checked");
    cy.get(webhookPanelSelector.copyUrl).should("be.disabled");
    cy.then(() =>
      cy.apiTriggerWorkflowWebhook({ token: data.token, qs: draftQuery() }).then((res) => {
        expect(res.status).to.equal(403);
        expect(res.body.message).to.equal(workflowsText.webhookDisabledError);
      })
    );

    enableWebhook();
    cy.get(workflowSelector.workflowWebhookToggle).find("input").should("be.checked");
    cy.get(webhookPanelSelector.copyUrl).should("not.be.disabled");
    cy.then(() =>
      cy
        .apiTriggerWorkflowWebhook({ token: data.token, qs: draftQuery() })
        .its("status")
        .should("be.oneOf", [200, 201])
    );

    enableWebhook();
    cy.get(workflowSelector.workflowWebhookToggle).find("input").should("not.be.checked");
    cy.get(webhookPanelSelector.copyUrl).should("be.disabled");
    cy.then(() =>
      cy
        .apiTriggerWorkflowWebhook({ token: data.token, qs: draftQuery() })
        .its("status")
        .should("equal", 403)
    );
  });

  it("The environment picker changes the webhook URL and the version defaults to the editor's current version", () => {
    cy.apiSaveWorkflowDefinition(echoDefinition({ workflowInputs: inputs() }));
    cy.apiSetWorkflowWebhookEnabled(true);
    openWebhooksPanel();

    cy.get(workflowSelector.workflowEndpointUrl)
      .should("contain.text", `/v2/webhooks/workflows/${Cypress.env("workflowId")}/trigger`)
      .and("contain.text", "environment=development")
      .and("contain.text", `version=${Cypress.env("editingVersionName")}`);
    cy.get(webhookPanelSelector.versionToggle).should(
      "contain.text",
      Cypress.env("editingVersionName")
    );

    cy.get(webhookPanelSelector.environmentToggle).click();
    cy.get(webhookPanelSelector.environmentOption("Released")).click();
    cy.get(workflowSelector.workflowEndpointUrl)
      .should("not.contain.text", "environment=")
      .and("not.contain.text", "version=");
    cy.get(webhookPanelSelector.versionToggle).should("not.exist");

    cy.get(webhookPanelSelector.environmentToggle).click();
    cy.get(webhookPanelSelector.environmentOption("development")).click();
    cy.get(workflowSelector.workflowEndpointUrl)
      .should("contain.text", "environment=development")
      .and("contain.text", `version=${Cypress.env("editingVersionName")}`);
  });

  it("The API token stays hidden until revealed, and the token and URL copy buttons copy the shown values", () => {
    cy.apiSaveWorkflowDefinition(echoDefinition({ workflowInputs: inputs() }));
    cy.apiSetWorkflowWebhookEnabled(true);
    openWebhooksPanel();
    stubClipboard();

    cy.get(workflowSelector.workflowTokenField).should("contain.text", "****");
    cy.get(workflowSelector.workflowTokenField).should("not.contain.text", data.token);

    revealWorkflowToken(workflowSelector);
    cy.get(workflowSelector.workflowTokenField).should("have.text", data.token);

    cy.get(webhookPanelSelector.copyToken).click();
    copiedValue().should("equal", data.token);

    cy.get(workflowSelector.workflowEndpointUrl)
      .invoke("text")
      .then((url) => {
        cy.get(webhookPanelSelector.copyUrl).click();
        copiedValue().should("equal", url.trim());
      });
  });

  it("The request body is built from the version's inputs, can be edited and reset, and rejects invalid JSON", () => {
    cy.apiSaveWorkflowDefinition(echoDefinition({ workflowInputs: inputs() }));
    cy.apiSetWorkflowWebhookEnabled(true);
    openWebhooksPanel();
    stubClipboard();

    cy.get(webhookPanelSelector.requestBody)
      .invoke("val")
      .then((body) => expect(JSON.parse(body)).to.deep.equal({ region: "eu", limit: 10 }));

    cy.get(webhookPanelSelector.requestBody)
      .clear()
      .type('{"region":"us","limit":3}', { parseSpecialCharSequences: false });
    cy.get(webhookPanelSelector.copyJson).click();
    copiedValue().then((copied) =>
      expect(JSON.parse(copied)).to.deep.equal({ region: "us", limit: 3 })
    );

    cy.get(webhookPanelSelector.requestBody)
      .clear()
      .type("{not json", { parseSpecialCharSequences: false });
    cy.get(webhookPanelSelector.bodyError).should("contain.text", "Invalid JSON syntax");
    cy.get(webhookPanelSelector.copyJson).should("be.disabled");
    cy.contains("button", "Copy cURL").should("be.disabled");

    cy.get(webhookPanelSelector.resetBody).click();
    cy.get(webhookPanelSelector.bodyError).should("not.exist");
    cy.get(webhookPanelSelector.requestBody)
      .invoke("val")
      .then((body) => expect(JSON.parse(body)).to.deep.equal({ region: "eu", limit: 10 }));
  });

  it("Copy cURL builds a call from the webhook URL, token and body, and the same call returns the workflow's response", () => {
    cy.apiSaveWorkflowDefinition(echoDefinition({ workflowInputs: inputs() }));
    cy.apiSetWorkflowWebhookEnabled(true);
    openWebhooksPanel();
    stubClipboard();

    cy.get(workflowSelector.workflowEndpointUrl)
      .invoke("text")
      .then((rawUrl) => {
        const url = rawUrl.trim();
        cy.contains("button", "Copy cURL").click();
        copiedValue().then((curl) => {
          expect(curl).to.include(`--url "${url}"`);
          expect(curl).to.include(`Authorization: Bearer ${data.token}`);
          const payload = curl.match(/--data '(.*)'$/)[1];
          expect(JSON.parse(payload)).to.deep.equal({ region: "eu", limit: 10 });
          cy.apiTriggerWorkflowWebhook({
            token: data.token,
            qs: draftQuery(),
            body: JSON.parse(payload),
          }).then((res) => {
            expect(res.status).to.be.oneOf([200, 201]);
            expect(res.body).to.deep.equal({ region: "eu", limit: 10 });
          });
        });
      });
  });

  it("The Webhooks panel marks Parameter and Test JSON parameters as Legacy, and the Start node's Test JSON does not", () => {
    cy.apiSaveWorkflowDefinition(
      echoDefinition({ webhookParams: [{ key: "city", dataType: "string" }] })
    );
    openWebhooksPanel();

    cy.get(webhookPanelSelector.legacyLabel).should("have.length", 2);
    cy.contains(webhookPanelSelector.legacyLabel, "Parameter")
      .find(webhookPanelSelector.legacyTag)
      .should("have.text", "Legacy");
    cy.contains(webhookPanelSelector.legacyLabel, "Test JSON parameters")
      .find(webhookPanelSelector.legacyTag)
      .should("have.text", "Legacy");

    cy.get(workflowSelector.workflowWebhookIcon).click();
    cy.get(workflowSelector.workflowEndpointUrl).should("not.exist");
    cy.get(workflowSelector.startNode).click({ force: true });
    cy.get(webhookPanelSelector.testJsonBlock)
      .should("be.visible")
      .and("contain.text", "Test JSON parameters");
    cy.get(webhookPanelSelector.testJsonBlock)
      .find(webhookPanelSelector.legacyTag)
      .should("not.exist");
  });

  it("A webhook URL that names an unknown version returns a clear version-not-found error", () => {
    cy.apiSaveWorkflowDefinition(echoDefinition({ workflowInputs: inputs() }));
    cy.apiSetWorkflowWebhookEnabled(true);

    cy.then(() =>
      cy
        .apiTriggerWorkflowWebhook({
          token: data.token,
          qs: { version: "no-such-version", environment: "development" },
        })
        .then((res) => {
          expect(res.status).to.equal(404);
          expect(res.body.message).to.include('Version "no-such-version" not found');
        })
    );
  });
});
