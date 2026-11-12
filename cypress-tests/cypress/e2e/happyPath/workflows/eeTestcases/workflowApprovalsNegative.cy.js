import { fake } from "Fixtures/fake";
import { humanText } from "Texts/platform/workflows";
import { cleanupWorkflows } from "Support/utils/workflows/workFlows";
import {
  createHumanWorkflow,
  runUntilWaiting,
  asUser,
  deleteApproverUsers,
} from "Support/utils/workflows/workflowApprovals";

const SLOW_API = {
  responseTimeout: 60000,
  requestTimeout: 60000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 45000,
};

const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";

const data = {};

describe("Workflows - approvals API negatives", SLOW_API, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-aneg`;
    data.email = null;
  });

  afterEach(() => {
    cy.apiLogout();
    cy.apiLogin();
    cy.visit("/");
    cleanupWorkflows([data.workflowName]);
    if (data.email) deleteApproverUsers([data.email]);
  });

  it("A malformed request id is refused with 400 on resolve and on cancel", () => {
    cy.apiResolveApproval("not-a-uuid", "approved").its("status").should("equal", 400);
    cy.apiCancelApproval("not-a-uuid").its("status").should("equal", 400);
  });

  it("An unknown request id is refused with 404 and a clear message on resolve and on cancel", () => {
    cy.apiResolveApproval(UNKNOWN_ID, "approved").then((res) => {
      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal(humanText.requestNotFoundError);
    });
    cy.apiCancelApproval(UNKNOWN_ID).then((res) => {
      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal(humanText.requestNotFoundError);
    });
  });

  it("A user who is not an approver gets 403 when resolving or cancelling someone else's request, and it stays pending", () => {
    data.email = fake.email.toLowerCase();
    cy.apiFullUserOnboarding(fake.firstName, data.email, "end-user");
    cy.apiLogin();
    createHumanWorkflow(data.workflowName, {
      human: {
        approvers: {
          users: [Cypress.env("user_id")],
          groups: [],
          dynamic: "",
          tokenBypass: true,
        },
      },
    });
    runUntilWaiting().then((request) => {
      asUser(data.email);
      cy.apiResolveApproval(request.id, "approved").then((res) => {
        expect(res.status).to.equal(403);
        expect(res.body.message).to.equal(humanText.notAuthorizedError);
      });
      cy.apiCancelApproval(request.id).then((res) => {
        expect(res.status).to.equal(403);
        expect(res.body.message).to.equal(humanText.notAuthorizedToCancelError);
      });

      cy.apiLogout();
      cy.apiLogin();
      cy.apiListApprovals({ status: "pending", app_id: Cypress.env("workflowId") })
        .its("body.requests")
        .should("have.length", 1);
    });
  });

  it("Resolving a request whose run was stopped is refused with 409", () => {
    createHumanWorkflow(data.workflowName);
    runUntilWaiting().then((request) => {
      cy.apiTerminateExecution(request.executionId).its("status").should("be.within", 200, 204);
      cy.apiResolveApproval(request.id, "approved").then((res) => {
        expect(res.status).to.equal(409);
        expect(res.body.message).to.be.oneOf([
          humanText.requestNotPendingError,
          "Workflow execution was terminated",
        ]);
      });
    });
  });

  it("The approvals list refuses invalid filter and paging values with 400", () => {
    [
      { app_id: "not-a-uuid" },
      { folder_id: "not-a-uuid" },
      { environment_id: "not-a-uuid" },
      { from: "2026-09" },
      { to: "not-a-date" },
      { page: 0 },
      { per_page: 101 },
      { per_page: "abc" },
    ].forEach((query) => {
      cy.apiListApprovals(query).then((res) => {
        expect(res.status, JSON.stringify(query)).to.equal(400);
      });
    });
  });

  // Suspected bug: status is not validated against the known statuses, so an unknown value returns 200 with an empty list.
  it("The approvals list refuses an unknown status value with 400", () => {
    cy.apiListApprovals({ status: "not-a-status" }).its("status").should("equal", 400);
  });
});
