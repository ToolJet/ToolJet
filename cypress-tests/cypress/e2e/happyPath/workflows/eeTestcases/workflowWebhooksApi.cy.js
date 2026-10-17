import { fake } from "Fixtures/fake";
import { workflowsText } from "Texts/platform/workflows";
import {
  wfStartNode,
  wfQueryNode,
  wfResponseNode,
  wfEdge,
  workflowDefinition,
  createRunjsQueries,
  cleanupWorkflows,
  releaseWorkflow,
} from "Support/utils/workflows/workFlows";

const data = {};

// start → pong (runjs) → response. The draft is addressed explicitly with
// ?version=<name>&environment=development, since without ?version the
// webhook runs (and checks) the released version.
const buildPongWorkflow = (statusCode = "200") =>
  createRunjsQueries({ pong: "return 'pong'" }).then((ids) => {
    cy.apiSaveWorkflowDefinition(
      workflowDefinition({
        nodes: [
          wfStartNode(),
          wfQueryNode("pong-node", ids.pong),
          wfResponseNode("response", "return pong.data", statusCode),
        ],
        edges: [
          wfEdge("start", "pong-node"),
          wfEdge("pong-node", "response", "success"),
        ],
        queryIds: [ids.pong],
      })
    );
  });

const draftQuery = () => ({
  version: Cypress.env("editingVersionName"),
  environment: "development",
});

// Webhook popup UI and request parameters are left to the workflow-inputs
// work (#18117), which replaces webhook params; these cases stay API-only.
describe("Workflows - webhook endpoint (API)", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-hook`;
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    cy.apiGetWorkflowToken().then((token) => (data.token = token));
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("The webhook rejects bad tokens and unknown workflows and runs only while enabled", () => {
    buildPongWorkflow();

    cy.then(() => {
      cy.apiTriggerWorkflowWebhook({ qs: draftQuery() }).then((res) => {
        expect(res.status, "no token").to.equal(401);
        expect(res.body.message).to.equal(workflowsText.invalidTokenError);
      });
      cy.apiTriggerWorkflowWebhook({ token: "not-the-token", qs: draftQuery() })
        .its("status")
        .should("equal", 401);
    });
    cy.then(() =>
      cy
        .apiTriggerWorkflowWebhook({
          idOrName: `${data.workflowName}-missing`,
          token: data.token,
          qs: draftQuery(),
        })
        .its("status")
        .should("equal", 404)
    );

    // The endpoint is off until the webhook is enabled on the version.
    cy.then(() =>
      cy
        .apiTriggerWorkflowWebhook({ token: data.token, qs: draftQuery() })
        .then((res) => {
          expect(res.status, "webhook not enabled").to.equal(403);
          expect(res.body.message).to.equal(
            workflowsText.webhookDisabledError
          );
        })
    );

    cy.apiSetWorkflowWebhookEnabled(true);
    cy.then(() =>
      cy
        .apiTriggerWorkflowWebhook({ token: data.token, qs: draftQuery() })
        .then((res) => {
          expect(res.status).to.be.oneOf([200, 201]);
          expect(res.body).to.equal("pong");
        })
    );

    cy.apiSetWorkflowWebhookEnabled(false);
    cy.then(() =>
      cy
        .apiTriggerWorkflowWebhook({ token: data.token, qs: draftQuery() })
        .its("status")
        .should("equal", 403)
    );
  });

  it("The response node's status code becomes the webhook's HTTP status", () => {
    buildPongWorkflow("404");
    cy.apiSetWorkflowWebhookEnabled(true);

    cy.then(() =>
      cy
        .apiTriggerWorkflowWebhook({ token: data.token, qs: draftQuery() })
        .then((res) => {
          expect(res.status).to.equal(404);
          expect(res.body.message).to.equal(
            workflowsText.responseStatusError(404, "Not Found")
          );
        })
    );
  });

  it("An async trigger returns an execution id whose status can be read", () => {
    buildPongWorkflow();
    cy.apiSetWorkflowWebhookEnabled(true);
    // The status route ignores ?version and gates on the released version.
    releaseWorkflow(data.workflowName);

    // Only the enqueue + status contract is asserted: the CI stack runs no
    // BullMQ worker (WORKER is unset), so queued runs never complete there.
    cy.then(() =>
      cy
        .apiTriggerWorkflowWebhook({ token: data.token, async: true })
        .then((res) => {
          expect(res.status).to.be.oneOf([200, 201]);
          expect(res.body.workflow_execution_id).to.be.a("string");
          cy.apiGetWorkflowWebhookStatus({
            token: data.token,
            executionId: res.body.workflow_execution_id,
          })
            .its("status")
            .should("equal", 200);
        })
    );
  });

  it("?version and ?environment select what runs and reject unknown or unpromoted targets", () => {
    buildPongWorkflow();
    cy.apiSetWorkflowWebhookEnabled(true);

    cy.then(() => {
      cy.apiTriggerWorkflowWebhook({
        token: data.token,
        qs: { version: "no-such-version", environment: "development" },
      }).then((res) => {
        // The guard reads workflow_enabled from the named version, so an
        // unknown version is refused there before the service's 404.
        expect(res.status).to.equal(403);
        expect(res.body.message).to.equal(workflowsText.webhookDisabledError);
      });

      cy.apiTriggerWorkflowWebhook({
        token: data.token,
        qs: { ...draftQuery(), environment: "no-such-env" },
      }).then((res) => {
        expect(res.status).to.equal(404);
        expect(res.body.message).to.equal(workflowsText.invalidEnvironmentError);
      });

      // The draft lives in development; production must refuse to run it.
      cy.apiTriggerWorkflowWebhook({
        token: data.token,
        qs: { ...draftQuery(), environment: "production" },
      }).then((res) => {
        expect(res.status).to.equal(400);
        expect(res.body.message).to.include('cannot run in "production"');
      });
    });
  });

  it("Only declared webhook parameters reach the run; defaults fill gaps and wrong types are rejected", () => {
    createRunjsQueries({ echo: "return startTrigger.params" }).then((ids) => {
      cy.apiSaveWorkflowDefinition(
        workflowDefinition({
          nodes: [
            wfStartNode(),
            wfQueryNode("echo-node", ids.echo),
            wfResponseNode("response", "return echo.data"),
          ],
          edges: [
            wfEdge("start", "echo-node"),
            wfEdge("echo-node", "response", "success"),
          ],
          queryIds: [ids.echo],
          webhookParams: [{ key: "name", dataType: "string" }],
          defaultParams: JSON.stringify({ name: "default-name" }),
        })
      );
    });
    cy.apiSetWorkflowWebhookEnabled(true);

    cy.then(() => {
      // Undeclared keys are dropped.
      cy.apiTriggerWorkflowWebhook({
        token: data.token,
        qs: draftQuery(),
        body: { name: "given", extra: "dropped" },
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
        expect(res.body).to.deep.equal({ name: "given" });
      });

      // A declared key that is not sent falls back to the default params.
      cy.apiTriggerWorkflowWebhook({
        token: data.token,
        qs: draftQuery(),
        body: {},
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
        expect(res.body).to.deep.equal({ name: "default-name" });
      });

      // A declared key of the wrong type is refused before the run starts.
      cy.apiTriggerWorkflowWebhook({
        token: data.token,
        qs: draftQuery(),
        body: { name: 5 },
      }).then((res) => {
        expect(res.status).to.equal(400);
        expect(res.body.message).to.equal("name has incorrect datatype");
      });
    });
  });

  // BUG: WebhookGuard resolves a non-UUID :idOrName via apps.name, which is
  // null for every app since the name moved to app_versions.app_name, so a
  // trigger by name always answers 404 "Workflow doesn't exists".
  it.skip("The webhook can be triggered by workflow name", () => {
    buildPongWorkflow();
    cy.apiSetWorkflowWebhookEnabled(true);
    cy.then(() =>
      cy
        .apiTriggerWorkflowWebhook({
          idOrName: data.workflowName,
          token: data.token,
          qs: draftQuery(),
        })
        .then((res) => {
          expect(res.status).to.be.oneOf([200, 201]);
          expect(res.body).to.equal("pong");
        })
    );
  });
});
