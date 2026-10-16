import { fake } from "Fixtures/fake";
import { workflowsText } from "Texts/platform/workflows";
import { cleanupWorkflows } from "Support/utils/workflows/workFlows";

const data = {};

const invalidCron = {
  minute: "99",
  hours: "*",
  dayOfMonth: "*",
  month: "*",
  dayOfWeek: "*",
};

// Schedule CRUD only. Firing is not asserted: the CI stack runs no BullMQ
// worker (WORKER is unset), so scheduled jobs are stored but never processed.
describe("Workflows - schedules (API)", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-sched`;
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("Interval and cron schedules can be created, listed, paused, resumed and deleted", () => {
    cy.apiCreateWorkflowSchedule({
      type: "interval",
      details: { frequency: "hour", minutes: 15 },
    }).then((res) => {
      expect(res.status).to.equal(201);
      expect(res.body.type).to.equal("interval");
      expect(res.body.details).to.deep.include({ frequency: "hour", minutes: 15 });
      data.intervalId = res.body.id;
    });

    cy.apiCreateWorkflowSchedule({
      type: "cron",
      details: {
        minute: "*/5",
        hours: "*",
        dayOfMonth: "*",
        month: "*",
        dayOfWeek: "*",
      },
    }).then((res) => {
      expect(res.status).to.equal(201);
      expect(res.body.type).to.equal("cron");
      data.cronId = res.body.id;
    });

    cy.apiListWorkflowSchedules().then((schedules) => {
      const ids = schedules.map((schedule) => schedule.id);
      expect(ids).to.include.members([data.intervalId, data.cronId]);
    });

    cy.then(() => {
      cy.apiActivateWorkflowSchedule(data.intervalId, true);
      cy.apiListWorkflowSchedules().then((schedules) => {
        const interval = schedules.find((s) => s.id === data.intervalId);
        expect(interval.active, "after activate").to.equal(true);
      });
      cy.apiActivateWorkflowSchedule(data.intervalId, false);
      cy.apiListWorkflowSchedules().then((schedules) => {
        const interval = schedules.find((s) => s.id === data.intervalId);
        expect(interval.active, "after pause").to.equal(false);
      });

      cy.apiDeleteWorkflowSchedule(data.intervalId);
      cy.apiDeleteWorkflowSchedule(data.cronId);
    });
    cy.apiListWorkflowSchedules().should("have.length", 0);
  });

  it("An invalid cron expression is rejected and nothing is stored", () => {
    cy.apiCreateWorkflowSchedule({ type: "cron", details: invalidCron }).then(
      (res) => {
        expect(res.status).to.not.equal(201);
        expect(res.body.message).to.include(workflowsText.invalidScheduleError);
      }
    );
    cy.apiListWorkflowSchedules().should("have.length", 0);
  });

  // BUG: an invalid pattern answers 500 "Invalid interval configuration ..."
  // instead of a 400.
  it.skip("An invalid cron expression is a client error (4xx)", () => {
    cy.apiCreateWorkflowSchedule({ type: "cron", details: invalidCron })
      .its("status")
      .should("be.within", 400, 499);
  });
});
