import { fake } from "Fixtures/fake";
import { schedulesSelector } from "Selectors/platform/workflows";
import { schedulesText } from "Texts/platform/workflows";
import {
  wfStartNode,
  wfResponseNode,
  wfEdge,
  wfInput,
  workflowDefinition,
  cleanupWorkflows,
} from "Support/utils/workflows/workFlows";
import { openWorkflowEditor } from "Support/utils/workflows/workflowApprovals";

const SLOW_API = {
  responseTimeout: 60000,
  requestTimeout: 60000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 45000,
};

const data = {};

const saveEchoDefinition = (workflowInputs = []) =>
  cy.apiSaveWorkflowDefinition(
    workflowDefinition({
      nodes: [wfStartNode(), wfResponseNode("response", "return startTrigger.params")],
      edges: [wfEdge("start", "response")],
      workflowInputs,
    })
  );

const uniqueName = (label) => `${label}-${Date.now()}-${Cypress._.random(999)}`;

const openSchedulesPanel = () => {
  cy.intercept("GET", "/api/workflow-schedules*").as("schedulesList");
  cy.get(schedulesSelector.icon).click();
  cy.get(schedulesSelector.drawer).should("be.visible");
  return cy.wait("@schedulesList");
};

const openNewScheduleForm = () => {
  cy.get(schedulesSelector.filterWrapper).eq(1).should("have.class", "active");
  cy.get(schedulesSelector.newButton).should("not.be.disabled").click();
  cy.get(schedulesSelector.editor).should("be.visible");
};

const openScheduleNamed = (name) => {
  cy.contains(schedulesSelector.item, name).click();
  cy.get(schedulesSelector.editor).should("be.visible");
};

const scheduleItem = (name) => cy.contains(schedulesSelector.item, name);

const typeName = (name) =>
  cy.get(schedulesSelector.name).clear().type(name, { delay: 0 });

const createEveryMinute = (overrides = {}) =>
  cy.apiCreateWorkflowSchedule({
    type: "interval",
    details: { frequency: "minute" },
    ...overrides,
  });

describe("Workflows - schedules panel", SLOW_API, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-schui`;
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    saveEchoDefinition();
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName, data.withInputsName].filter(Boolean));
    data.withInputsName = undefined;
  });

  it("The Schedules panel loads only when opened and starts filtered to the current environment and version", () => {
    cy.intercept("GET", "/api/workflow-schedules*").as("schedulesList");
    openWorkflowEditor();
    cy.get("@schedulesList.all").should("have.length", 0);

    cy.get(schedulesSelector.icon).click();
    cy.wait("@schedulesList").its("request.url").should((url) => {
      expect(url).to.include(`environment_id=${Cypress.env("environmentId")}`);
      expect(url).to.include(`workflow_id=${Cypress.env("editingVersionId")}`);
    });
    cy.get(schedulesSelector.title).should("contain.text", schedulesText.panelTitle);
    cy.get(schedulesSelector.filterWrapper).eq(0).should("have.attr", "title", "development");
    cy.get(schedulesSelector.filterWrapper)
      .eq(1)
      .should("have.class", "active")
      .and("not.have.attr", "title", "All versions");
  });

  it("The Schedules panel filters can be cleared, and search and paging work", () => {
    const names = Cypress._.range(9).map((index) => uniqueName(`bulk${index}`));
    names.forEach((name) => createEveryMinute({ name }));
    openWorkflowEditor();
    openSchedulesPanel();

    cy.get(schedulesSelector.item).should("have.length", 8);
    cy.get(schedulesSelector.pagination).should("contain.text", "of 9");
    cy.get(schedulesSelector.pageNext).click();
    cy.get(schedulesSelector.item).should("have.length", 1);
    cy.get(schedulesSelector.pagePrev).click();
    cy.get(schedulesSelector.item).should("have.length", 8);

    cy.get(schedulesSelector.search).type(names[4], { delay: 0 });
    cy.get(schedulesSelector.item).should("have.length", 1);
    cy.get(schedulesSelector.search).clear().type("no-such-schedule", { delay: 0 });
    cy.get(schedulesSelector.noResults).should("contain.text", schedulesText.noMatch);
    cy.get(schedulesSelector.search).clear();
    cy.get(schedulesSelector.item).should("have.length", 8);

    cy.get(`${schedulesSelector.filterWrapper} .react-select__control`).eq(0).click();
    cy.contains(".react-select__option", "All environments").click();
    cy.get(schedulesSelector.filterWrapper).eq(0).should("have.attr", "title", "All environments");
    cy.get(`${schedulesSelector.filterWrapper} .react-select__control`).eq(1).click();
    cy.contains(".react-select__option", "All versions").click();
    cy.get(schedulesSelector.filterWrapper).eq(1).should("have.attr", "title", "All versions");
    cy.get(schedulesSelector.item).should("have.length", 8);
  });

  it("A new schedule form shows Name, Environment, Version, Input overrides, then Schedule type", () => {
    saveEchoDefinition([wfInput("limit", "number")]);
    openWorkflowEditor();
    openSchedulesPanel();
    openNewScheduleForm();

    cy.get(schedulesSelector.fieldLabels).should(($labels) => {
      const labels = [...$labels].map((label) => label.textContent.replace(/\s*\*$/, "").trim());
      expect(labels).to.deep.equal(schedulesText.fieldOrder);
    });
  });

  it("Input overrides appear only for versions that have inputs", () => {
    openWorkflowEditor();
    openSchedulesPanel();
    openNewScheduleForm();
    cy.get(schedulesSelector.name).should("be.visible");
    cy.get(schedulesSelector.fieldLabels).should("have.length", 4);
    cy.contains(schedulesSelector.fieldLabels, "Input overrides").should("not.exist");

    data.withInputsName = `${data.workflowName}-inputs`;
    cy.apiCreateWorkflowApp(data.withInputsName);
    cy.apiFetchWorkflowContext();
    saveEchoDefinition([wfInput("limit", "number")]);
    openWorkflowEditor();
    openSchedulesPanel();
    openNewScheduleForm();
    cy.contains(schedulesSelector.fieldLabels, "Input overrides").should("be.visible");
  });

  it("A new schedule defaults to every minute on the current version in development and is created inactive", () => {
    const name = uniqueName("defaults");
    openWorkflowEditor();
    openSchedulesPanel();
    cy.get(schedulesSelector.item).should("not.exist");
    cy.get(schedulesSelector.noResults).should("contain.text", schedulesText.noMatch);
    openNewScheduleForm();

    cy.get(schedulesSelector.environmentDropdown).should("contain.text", "Development");
    cy.contains(".schedule-environment", "Version").should("contain.text", "v1").and("not.contain.text", "No versions found");
    cy.get(schedulesSelector.editor).should("contain.text", "Set to run on every minute");

    cy.intercept("POST", "/api/workflow-schedules").as("createSchedule");
    typeName(name);
    cy.get(schedulesSelector.createButton).should("not.be.disabled").click();
    cy.wait("@createSchedule").then(({ request, response }) => {
      expect(response.statusCode).to.equal(201);
      expect(response.body.active).to.equal(false);
      expect(request.body.workflowId).to.equal(Cypress.env("editingVersionId"));
      expect(request.body.environmentId).to.equal(Cypress.env("environmentId"));
      expect(request.body.details.frequency).to.equal("minute");
    });
    scheduleItem(name)
      .should("contain.text", schedulesText.everyMinute)
      .find("input[type='checkbox']")
      .should("not.be.checked");
  });

  it("Schedule names are required, unique in any letter case, and capped at 100 characters", () => {
    const existing = uniqueName("Daily-Report");
    createEveryMinute({ name: existing });
    openWorkflowEditor();
    openSchedulesPanel();
    openNewScheduleForm();

    cy.get(schedulesSelector.createButton).should("be.disabled");

    typeName(existing.toLowerCase());
    cy.get(schedulesSelector.fieldError).should("contain.text", schedulesText.duplicateName);
    cy.get(schedulesSelector.createButton).should("be.disabled");

    typeName("a".repeat(101));
    cy.get(schedulesSelector.fieldError).should("contain.text", schedulesText.nameTooLong);
    cy.get(schedulesSelector.createButton).should("be.disabled");

    typeName("a".repeat(100));
    cy.get(schedulesSelector.fieldError).should("not.exist");
    cy.get(schedulesSelector.createButton).should("not.be.disabled");
  });

  it("Save is enabled only on a real change when editing a schedule", () => {
    const name = uniqueName("editable");
    createEveryMinute({ name });
    openWorkflowEditor();
    openSchedulesPanel();
    openScheduleNamed(name);

    cy.get(schedulesSelector.saveButton).should("be.disabled");
    typeName(`${name}-x`);
    cy.get(schedulesSelector.saveButton).should("not.be.disabled");
    typeName(name);
    cy.get(schedulesSelector.saveButton).should("be.disabled");

    typeName(`${name}-renamed`);
    cy.intercept("PUT", "/api/workflow-schedules/*").as("updateSchedule");
    cy.get(schedulesSelector.saveButton).click();
    cy.wait("@updateSchedule").its("response.statusCode").should("be.oneOf", [200, 201]);
    cy.get(schedulesSelector.saveButton).should("be.disabled");
  });

  it("The icon-only delete removes the schedule, and a failed on/off toggle shows an error", () => {
    const doomed = uniqueName("doomed");
    const kept = uniqueName("kept");
    createEveryMinute({ name: doomed });
    createEveryMinute({ name: kept });
    openWorkflowEditor();
    openSchedulesPanel();

    cy.intercept("PUT", "/api/workflow-schedules/activate/*", {
      statusCode: 500,
      body: { statusCode: 500, error: "Forced toggle failure", message: "Forced toggle failure" },
    }).as("failedToggle");
    scheduleItem(kept).find("input[type='checkbox']").click({ force: true });
    cy.wait("@failedToggle");
    cy.contains("Forced toggle failure").should("be.visible");
    scheduleItem(kept).find("input[type='checkbox']").should("not.be.checked");

    openScheduleNamed(doomed);
    cy.get(schedulesSelector.deleteButton).should("be.visible").click();
    cy.get(schedulesSelector.item).should("have.length", 1);
    scheduleItem(doomed).should("not.exist");
    cy.apiListWorkflowSchedules().then((schedules) => {
      expect(schedules.map((schedule) => schedule.name)).to.deep.equal([kept]);
    });
  });
});

describe("Workflows - schedules firing", SLOW_API, () => {
  const runsOf = () =>
    cy.getAuthHeaders().then((headers) =>
      cy
        .request({
          url: `${Cypress.env("server_host")}/api/workflow_executions?appVersionId=${Cypress.env("editingVersionId")}&page=1&per_page=20`,
          headers,
          log: false,
        })
        .its("body")
    );

  const waitForRunCount = (predicate, description, attempt = 0) =>
    runsOf().then((body) => {
      const runs = body.workflowExecutions || body.data || body;
      if (predicate(runs)) return runs;
      if (attempt >= 30) throw new Error(`Timed out waiting for ${description}`);
      cy.wait(5000, { log: false });
      return waitForRunCount(predicate, description, attempt + 1);
    });

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-schrun`;
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    saveEchoDefinition([wfInput("limit", "number")]);
  });

  afterEach(() => {
    cy.apiListWorkflowSchedules().then((schedules) =>
      schedules.forEach((schedule) => cy.apiActivateWorkflowSchedule(schedule.id, false))
    );
    cleanupWorkflows([data.workflowName]);
  });

  it("A schedule runs its pinned version with its input overrides, and an inactive schedule never fires", () => {
    createEveryMinute({ name: uniqueName("active"), params: { limit: 42 } }).then((res) => {
      expect(res.status).to.equal(201);
      cy.apiActivateWorkflowSchedule(res.body.id, true);
    });
    createEveryMinute({ name: uniqueName("inactive"), params: { limit: 7 } }).then((res) => {
      expect(res.status).to.equal(201);
      expect(res.body.active).to.equal(false);
    });

    waitForRunCount((runs) => runs.length > 0, "the active schedule to fire").then((runs) => {
      cy.wait(65000, { log: false });
      runsOf().then((body) => {
        const later = body.workflowExecutions || body.data || body;
        expect(later.length).to.be.greaterThan(0);
        later.forEach((run) => {
          expect(run.appVersionId || run.app_version_id).to.equal(Cypress.env("editingVersionId"));
        });
        const ids = later.map((run) => run.id);
        cy.wrap(ids).as("runIds");
      });
    });

    cy.get("@runIds").then((ids) => {
      ids.forEach((id) =>
        cy.getAuthHeaders().then((headers) =>
          cy
            .request({
              url: `${Cypress.env("server_host")}/api/workflow_executions/${id}`,
              headers,
              log: false,
            })
            .its("body")
            .then((run) => {
              expect(JSON.stringify(run)).to.include("42");
              expect(JSON.stringify(run.params ?? {})).to.not.include('"limit":7');
            })
        )
      );
    });
  });
});
