import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import {
  approvalSelector,
  executionsSelector,
} from "Selectors/platform/workflows";
import { humanText } from "Texts/platform/workflows";
import { cleanupWorkflows } from "Support/utils/workflows/workFlows";
import {
  createHumanWorkflow,
  runUntilWaiting,
  asUser,
  visitApprovals,
  visitExecutions,
  openApprovalRequest,
  chooseOutcomeInDialog,
  pickSelectOption,
} from "Support/utils/workflows/workflowApprovals";

// The shared instance is often busy; give API and page responses room.
const SLOW_API = {
  responseTimeout: 60000,
  requestTimeout: 60000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 45000,
};

const data = {};
const users = {
  listedBuilder: { role: "builder" },
  otherBuilder: { role: "builder" },
  endUser: { role: "end-user" },
};

const approversOf = (...userIds) => ({
  users: userIds,
  groups: [],
  dynamic: "",
  tokenBypass: true,
});

// Who sees the Approvals tab and who may resolve or cancel a request.
describe("Workflows - approvals access by role", SLOW_API, () => {
  before(() => {
    Object.entries(users).forEach(([key, user]) => {
      user.email = fake.email.toLowerCase();
      cy.apiLogin();
      cy.visit("/");
      cy.apiFullUserOnboarding(fake.firstName, user.email, user.role);
    });
    cy.apiLogin();
    Object.values(users).forEach((user) => {
      // Read from the database: the organisation-users list grows with every
      // run on a shared instance and is slow to page through.
      cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `SELECT id FROM users WHERE email = '${user.email}'`,
      }).then((result) => {
        user.id = result.rows[0].id;
      });
    });
  });

  // Cypress clears cookies between tests, so each one starts signed out.
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-hacc`;
  });

  afterEach(() => {
    cy.apiLogin();
    cy.visit("/");
    cleanupWorkflows([data.workflowName]);
  });

  it("An admin sees the Workflows, Approvals and Executions tabs and can open each", () => {
    cy.visit(`/${Cypress.env("workspaceId")}/workflows`);
    cy.get(approvalSelector.workflowsTab).should("be.visible");
    cy.get(approvalSelector.tab).should("be.visible");
    cy.get(approvalSelector.executionsTab).should("be.visible");

    cy.get(approvalSelector.tab).click();
    cy.url().should("include", "/workflows/approvals");
    cy.get(approvalSelector.page).should("be.visible");
    cy.get(approvalSelector.executionsTab).click();
    cy.url().should("include", "/workflows/executions");
  });

  it("An end user sees neither the Approvals nor the Executions tab and is redirected from a direct link", () => {
    asUser(users.endUser.email);
    cy.visit(`/${Cypress.env("workspaceId")}/workflows`);
    cy.get(approvalSelector.workflowsTab, { timeout: 30000 }).should("be.visible");
    cy.get(approvalSelector.tab).should("not.exist");
    cy.get(approvalSelector.executionsTab).should("not.exist");

    cy.visit(`/${Cypress.env("workspaceId")}/workflows/approvals`);
    cy.url().should("not.include", "/workflows/approvals");
    cy.get(approvalSelector.page).should("not.exist");
  });

  it("A listed approver resolves the request from the Approvals tab", () => {
    createHumanWorkflow(data.workflowName, {
      human: { approvers: approversOf(users.listedBuilder.id) },
    });
    runUntilWaiting().then((request) => {
      expect(request.canResolve, "admin").to.equal(true);
      asUser(users.listedBuilder.email);
      visitApprovals();
      openApprovalRequest(request.id);
      cy.get(approvalSelector.detailApprovers).should("not.be.empty");
      chooseOutcomeInDialog("approved")
        .its("response.statusCode")
        .should("equal", 201);
      cy.get(approvalSelector.row(request.id)).should("not.exist");

      cy.apiLogout();
      cy.apiLogin();
      cy.apiWaitForExecutionStatus("success");
    });
  });

  it("An admin who is not a listed approver can still resolve the request", () => {
    createHumanWorkflow(data.workflowName, {
      human: { approvers: approversOf(users.listedBuilder.id) },
    });
    runUntilWaiting().then((request) => {
      visitApprovals();
      openApprovalRequest(request.id);
      chooseOutcomeInDialog("rejected")
        .its("response.statusCode")
        .should("equal", 201);
      cy.get(approvalSelector.row(request.id)).should("not.exist");
      cy.apiWaitForExecutionStatus("success");
    });
  });

  it("A builder who is not a listed approver sees the request but cannot resolve it, and it stays pending", () => {
    createHumanWorkflow(data.workflowName, {
      human: { approvers: approversOf(users.listedBuilder.id) },
    });
    runUntilWaiting().then((request) => {
      asUser(users.otherBuilder.email);
      visitApprovals();
      openApprovalRequest(request.id);
      cy.get(approvalSelector.detailReadonly).should(
        "contain.text",
        humanText.notApprover
      );
      cy.get(approvalSelector.anyOutcomeButton).should("not.exist");
      cy.apiResolveApproval(request.id, "approved").then((res) => {
        expect(res.status).to.equal(403);
        expect(res.body.message).to.equal(humanText.notAuthorizedError);
      });

      cy.apiLogout();
      cy.apiLogin();
      cy.apiListApprovals({ status: "pending", app_id: Cypress.env("workflowId") })
        .its("body.requests")
        .should("have.length", 1);
    });
  });

  it("An end user cannot resolve a request or list approvals, and the request stays pending", () => {
    createHumanWorkflow(data.workflowName, {
      human: { approvers: approversOf(users.listedBuilder.id) },
    });
    runUntilWaiting().then((request) => {
      asUser(users.endUser.email);
      cy.apiResolveApproval(request.id, "approved")
        .its("status")
        .should("be.oneOf", [403, 404]);
      cy.apiListApprovals().its("status").should("be.oneOf", [200, 403]);
      cy.apiListApprovals().then((res) => {
        const ids = (res.body.requests || []).map((item) => item.id);
        expect(ids).to.not.include(request.id);
      });

      cy.apiLogout();
      cy.apiLogin();
      cy.apiListApprovals({ status: "pending", app_id: Cypress.env("workflowId") })
        .its("body.requests")
        .should("have.length", 1);
    });
  });

  it("A step with no approvers still pauses the run, only an admin can resolve it and others cannot", () => {
    createHumanWorkflow(data.workflowName);
    runUntilWaiting().then((request) => {
      cy.apiWaitForExecutionStatus("waiting");
      asUser(users.otherBuilder.email);
      cy.apiResolveApproval(request.id, "approved")
        .its("status")
        .should("equal", 403);

      cy.apiLogout();
      cy.apiLogin();
      visitApprovals();
      openApprovalRequest(request.id);
      cy.get(approvalSelector.detailApprovers).should("not.exist");
      cy.get(approvalSelector.detail).should("contain.text", "No approvers listed");
      chooseOutcomeInDialog("approved")
        .its("response.statusCode")
        .should("equal", 201);
      cy.apiWaitForExecutionStatus("success");
    });
  });

  it("Only an admin can cancel a request, and cancelling fails the run", () => {
    createHumanWorkflow(data.workflowName, {
      human: { approvers: approversOf(users.listedBuilder.id) },
    });
    runUntilWaiting().then((request) => {
      asUser(users.listedBuilder.email);
      visitApprovals();
      openApprovalRequest(request.id);
      cy.get(approvalSelector.cancel).should("not.exist");
      cy.apiCancelApproval(request.id).its("status").should("equal", 403);

      cy.apiLogout();
      cy.apiLogin();
      visitApprovals();
      openApprovalRequest(request.id);
      cy.intercept("POST", "/api/workflow-approvals/*/cancel").as("cancelRequest");
      cy.get(approvalSelector.cancel).click();
      cy.wait("@cancelRequest").its("response.statusCode").should("be.oneOf", [200, 201]);
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        humanText.requestCancelledToast,
        false
      );
      cy.get(approvalSelector.row(request.id)).should("not.exist");

      cy.apiWaitForExecutionStatus("failure");
      visitExecutions();
      cy.get(executionsSelector.row(request.executionId)).should(
        "contain.text",
        humanText.statusFailed
      );
    });
  });
});

// The link a notification carries: authorised by the token alone, no sign-in.
describe("Workflows - approval resolve link (token API)", SLOW_API, () => {
  const reasonField = {
    name: "reason",
    type: "text",
    label: "Reason",
    required: true,
    default: "",
  };

  const raiseRequest = (human = {}) => {
    createHumanWorkflow(data.workflowName, { human });
    return runUntilWaiting().then((request) =>
      cy.apiGetApprovalToken(request.id).then((token) => ({ request, token }))
    );
  };

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-htok`;
  });

  afterEach(() => {
    cy.apiLogin();
    cy.visit("/");
    cleanupWorkflows([data.workflowName]);
  });

  it("The link shows only the step's basic details, and resolving through it needs no sign-in", () => {
    raiseRequest({
      description: "Check the invoice",
      inputSchema: [{ ...reasonField, required: false }],
    }).then(({ request, token }) => {
      cy.apiGetApprovalByToken(token).then((res) => {
        expect(res.status).to.equal(200);
        expect(Object.keys(res.body).sort()).to.deep.equal(
          ["description", "expiresAt", "inputSchema", "nodeName", "outcomes", "status"].sort()
        );
        expect(res.body.nodeName).to.equal("human1");
        expect(res.body.description).to.equal("Check the invoice");
        expect(res.body.status).to.equal("pending");
        expect(res.body.outcomes.map((outcome) => outcome.key)).to.deep.equal([
          "approved",
          "rejected",
        ]);
      });

      cy.apiResolveApprovalByToken(token, { outcome: "approved", input: { reason: "ok" } }).then(
        (res) => {
          expect(res.status).to.equal(201);
          expect(res.body.status).to.equal("resolved");
        }
      );

      cy.apiLogin();
      cy.apiWaitForExecutionStatus("success");
      visitApprovals();
      pickSelectOption(
        `${approvalSelector.filterStatus} .react-select__control`,
        "Resolved"
      );
      cy.get(approvalSelector.row(request.id)).should("contain.text", "resolved");
    });
  });

  it("A request that was already resolved, an unknown outcome and invalid inputs are all refused with a clear message", () => {
    raiseRequest({
      inputSchema: [
        reasonField,
        { name: "amount", type: "number", label: "Amount", required: false, default: "" },
      ],
    }).then(({ request, token }) => {
      cy.apiResolveApprovalByToken(token, { outcome: "maybe", input: { reason: "x" } }).then((res) => {
        expect(res.status).to.equal(400);
        expect(res.body.message).to.equal(humanText.unknownOutcomeError("maybe"));
      });
      cy.apiResolveApprovalByToken(token, { outcome: "approved", input: {} }).then((res) => {
        expect(res.status).to.equal(400);
        expect(res.body.message).to.equal(humanText.missingInputError("reason"));
      });
      cy.apiResolveApprovalByToken(token, {
        outcome: "approved",
        input: { reason: "x", amount: "lots" },
      }).then((res) => {
        expect(res.status).to.equal(400);
        expect(res.body.message).to.equal('Input "amount" must be a number');
      });
      cy.apiResolveApprovalByToken("00000000-0000-4000-8000-000000000000", {
        outcome: "approved",
      }).then((res) => {
        expect(res.status).to.equal(404);
        expect(res.body.message).to.equal(humanText.notFoundError);
      });

      // None of the refusals touched the request.
      cy.apiLogin();
      visitApprovals();
      cy.get(approvalSelector.row(request.id)).should("contain.text", "pending");

      cy.apiResolveApprovalByToken(token, { outcome: "approved", input: { reason: "x" } })
        .its("status")
        .should("equal", 201);
      cy.apiResolveApprovalByToken(token, { outcome: "rejected", input: { reason: "y" } }).then((res) => {
        expect(res.status).to.equal(409);
        expect(res.body.message).to.equal(humanText.notPendingError);
      });
      cy.apiLogin();
      cy.apiWaitForExecutionStatus("success");
      cy.apiGetExecutionNode("response_approved")
        .its("executed")
        .should("equal", true);
      cy.apiGetExecutionNode("response_rejected")
        .its("executed")
        .should("equal", false);
    });
  });

  it("Input keys the step does not declare are dropped and defaults fill what was left out", () => {
    raiseRequest({
      inputSchema: [
        { name: "reason", type: "text", label: "Reason", required: false, default: "none given" },
        { name: "amount", type: "number", label: "Amount", required: false, default: "3" },
      ],
    }).then(({ token }) => {
      cy.apiResolveApprovalByToken(token, {
        outcome: "approved",
        input: { amount: 9, injected: "nope", reason: "" },
      })
        .its("status")
        .should("equal", 201);
      cy.apiLogin();
      cy.apiWaitForExecutionStatus("success");
      cy.apiGetExecutionNode("response_approved").then((node) => {
        expect(node.result.data.input).to.deep.equal({
          reason: "none given",
          amount: 9,
        });
        expect(node.result.data.resolvedBy ?? null).to.equal(null);
      });
    });
  });
});
