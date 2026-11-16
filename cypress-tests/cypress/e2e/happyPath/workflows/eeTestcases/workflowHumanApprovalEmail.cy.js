import { fake } from "Fixtures/fake";
import { approvalSelector } from "Selectors/platform/workflows";
import { humanText } from "Texts/platform/workflows";
import { smtpConfig } from "Constants/constants/whitelabel";
import { cleanupWorkflows } from "Support/utils/workflows/workFlows";
import { verifyInvitationEmail } from "Support/utils/whitelabel";
import {
  createHumanWorkflow,
  runUntilWaiting,
  asUser,
  visitApprovals,
  resolveInApprovalsTab,
  uniqueEmail,
  getUserIdByEmail,
  createApproverGroup,
  deleteApproverGroup,
  archiveApproverUser,
  deleteApproverUsers,
  approvalMailsFor,
  waitForApprovalMails,
  approvalMailBody,
  approvalMailLink,
} from "Support/utils/workflows/workflowApprovals";

const SLOW_API = {
  responseTimeout: 60000,
  requestTimeout: 60000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 45000,
};

const data = {};
const users = {
  listed: { role: "builder" },
  grouped: { role: "builder" },
  everyWay: { role: "builder" },
  archived: { role: "builder" },
};

const approversOf = ({ users: userIds = [], groups = [], dynamic = "" }) => ({
  users: userIds,
  groups,
  dynamic,
  tokenBypass: true,
});

const dynamicOf = (...emails) =>
  `{{ [${emails.map((email) => JSON.stringify(email)).join(", ")}] }}`;

describe("Workflows - Human approval email", SLOW_API, () => {
  before(() => {
    cy.apiLogin();
    cy.visit("/");
    cy.apiConfigureSmtp(smtpConfig);
    Object.entries(users).forEach(([key, user]) => {
      user.email = uniqueEmail(key.toLowerCase());
      cy.apiLogin();
      cy.visit("/");
      cy.apiFullUserOnboarding(fake.firstName, user.email, user.role);
    });
    cy.apiLogin();
    Object.values(users).forEach((user) => {
      getUserIdByEmail(user.email).then((id) => {
        user.id = id;
      });
    });
    cy.then(() =>
      createApproverGroup(`hitl-mail-${Date.now()}`, [
        users.grouped.id,
        users.everyWay.id,
        users.archived.id,
      ])
    ).then((groupId) => {
      data.groupId = groupId;
    });
    cy.then(() => archiveApproverUser(users.archived.email));
  });

  after(() => {
    cy.apiLogin();
    cy.apiConfigureSmtp(smtpConfig);
    cy.then(() => deleteApproverGroup(data.groupId));
    cy.then(() =>
      deleteApproverUsers(Object.values(users).map((user) => user.email))
    );
  });

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    cy.apiConfigureSmtp(smtpConfig);
    data.workflowName = `${fake.lastName.toLowerCase()}-hmail`;
  });

  afterEach(() => {
    cy.apiLogin();
    cy.visit("/");
    cy.apiConfigureSmtp(smtpConfig);
    cleanupWorkflows([data.workflowName]);
  });

  // Skipped: needs the own-MailHog setup in cypress-workflows.yml on the base branch.
  it.skip("Every approver gets exactly one email whether listed by user, by group or by dynamic expression, and an archived user gets none", () => {
    const dynamicOnlyA = uniqueEmail("dyna");
    const dynamicOnlyB = uniqueEmail("dynb");
    createHumanWorkflow(data.workflowName, {
      human: {
        approvers: approversOf({
          users: [users.listed.id, users.everyWay.id, users.archived.id],
          groups: [data.groupId],
          dynamic: dynamicOf(dynamicOnlyA, dynamicOnlyB, users.everyWay.email),
        }),
      },
    });
    runUntilWaiting().then((request) => {
      const expected = [
        users.listed.email,
        users.grouped.email,
        users.everyWay.email,
        dynamicOnlyA,
        dynamicOnlyB,
      ];
      expected.forEach((email) => waitForApprovalMails(email, data.workflowName));
      // Stability window so a delayed duplicate or archived-user email would arrive before counting.
      cy.wait(8000);
      expected.forEach((email) =>
        approvalMailsFor(email, data.workflowName).should("have.length", 1)
      );
      approvalMailsFor(users.archived.email, data.workflowName).should(
        "have.length",
        0
      );

      visitApprovals();
      resolveInApprovalsTab(request.id, "approved");
      cy.apiWaitForExecutionStatus("success");
    });
  });

  it.skip("The email names the workflow, the step and its description, and its button opens the Approvals tab", () => {
    const stepName = "manager_review";
    const description = "Review the quarterly invoice batch";
    createHumanWorkflow(data.workflowName, {
      human: {
        nodeName: stepName,
        description,
        approvers: approversOf({ users: [users.listed.id] }),
      },
    });
    runUntilWaiting().then(() => {
      waitForApprovalMails(users.listed.email, data.workflowName).then(
        (mails) => {
          const body = approvalMailBody(mails[0]);
          expect(body).to.include(data.workflowName);
          expect(body).to.include(stepName);
          expect(body).to.include(description);
          expect(body).to.include(humanText.approvalEmailCta);

          const link = approvalMailLink(body);
          expect(link, "approvals link").to.be.a("string");
          const { pathname } = new URL(link);
          expect(pathname).to.match(/^\/[^/]+\/workflows\/approvals$/);

          asUser(users.listed.email);
          cy.intercept("GET", "/api/workflow-approvals*").as("approvalsList");
          cy.visit(pathname);
          cy.wait("@approvalsList", { timeout: 90000 });
          cy.url().should("include", "/workflows/approvals");
          cy.get(approvalSelector.page, { timeout: 30000 }).should("be.visible");
        }
      );
    });
  });

  it.skip("With email switched off the run still pauses as Waiting with its request raised and can be resolved", () => {
    cy.apiConfigureSmtp({ ...smtpConfig, smtpEnabled: false });
    createHumanWorkflow(data.workflowName, {
      human: { approvers: approversOf({ users: [users.listed.id] }) },
    });
    runUntilWaiting().then((request) => {
      expect(request.id).to.be.a("string");
      cy.apiWaitForExecutionStatus("waiting");
      approvalMailsFor(users.listed.email, data.workflowName).should(
        "have.length",
        0
      );

      visitApprovals();
      resolveInApprovalsTab(request.id, "approved");
      cy.apiWaitForExecutionStatus("success");
    });
  });

  it.skip("The invitation email still arrives for a newly invited user", () => {
    const invitee = uniqueEmail("invitee");
    cy.apiUserInvite(fake.firstName, invitee, "end-user", {}, []);
    verifyInvitationEmail(invitee);
  });
});
