import { fake } from "Fixtures/fake";
import {
  executionsSelector,
  executionsFilterSelector,
  upcomingSelector,
  usedBySelector,
} from "Selectors/platform/workflows";
import { executionsText } from "Texts/platform/workflows";
import {
  wfStartNode,
  wfResponseNode,
  wfWaitNode,
  wfEdge,
  workflowDefinition,
  cleanupWorkflows,
  cleanupFolders,
  openLeftDrawer,
} from "Support/utils/workflows/workFlows";
import {
  visitExecutions,
  pickSelectOption,
  filterExecutionsByWorkflow,
  openWorkflowEditor,
} from "Support/utils/workflows/workflowApprovals";

const SLOW_API = {
  responseTimeout: 60000,
  requestTimeout: 60000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 45000,
};

const names = [];
const data = {};

const newWorkflow = (label, definitionNodes, edges) => {
  const name = `${fake.lastName.toLowerCase()}-${label}`;
  names.push(name);
  cy.apiCreateWorkflowApp(name);
  cy.apiFetchWorkflowContext();
  cy.apiSaveWorkflowDefinition(
    workflowDefinition({ nodes: definitionNodes, edges })
  );
  return cy.then(() => ({
    name,
    id: Cypress.env("workflowId"),
    versionId: Cypress.env("editingVersionId"),
  }));
};

const okWorkflow = (label) =>
  newWorkflow(
    label,
    [wfStartNode(), wfResponseNode("response", "return 'ok'")],
    [wfEdge("start", "response")]
  );

const failingWorkflow = (label) =>
  newWorkflow(
    label,
    [wfStartNode(), wfResponseNode("response", "throw new Error('boom')")],
    [wfEdge("start", "response")]
  );

const waitWorkflow = (label, seconds) =>
  newWorkflow(
    label,
    [
      wfStartNode(),
      wfWaitNode("wait", seconds),
      wfResponseNode("response", "return 'done'"),
    ],
    [wfEdge("start", "wait"), wfEdge("wait", "response")]
  );

const runOf = (workflow, status) => {
  cy.apiRunWorkflow({ appVersionId: workflow.versionId }).then((response) => {
    expect(response.status).to.equal(201);
    const executionId = response.body.workflowExecution.id;
    cy.then(() => {
      workflow.executionId = executionId;
    });
    if (status) cy.apiWaitForExecutionStatus(status, executionId);
  });
};

const useWorkflowContext = (workflow) => {
  Cypress.env("workflowId", workflow.id);
  Cypress.env("editingVersionId", workflow.versionId);
};

const applyFilter = (open) => {
  cy.get(executionsFilterSelector.trigger).click();
  open();
  cy.get(executionsFilterSelector.apply).click();
};

const filterByStatus = (value) =>
  applyFilter(() => cy.get(executionsFilterSelector.status(value)).click());

const filterByTrigger = (value) =>
  applyFilter(() => {
    cy.get(executionsFilterSelector.category("trigger")).click();
    cy.get(executionsFilterSelector.triggerType(value)).click();
  });

const rowOf = (workflow) => cy.contains(executionsFilterSelector.anyRow, workflow.name);

const stopOf = (workflow) => rowOf(workflow).find('[data-cy^="executions-stop-"]');

const everyMinute = (workflow, name) => {
  useWorkflowContext(workflow);
  return cy
    .apiCreateWorkflowSchedule({
      type: "interval",
      details: { frequency: "minute" },
      name,
      appVersionId: workflow.versionId,
    })
    .then((response) => {
      expect(response.status).to.equal(201);
      workflow.scheduleId = response.body.id;
      return response.body.id;
    });
};

describe("Workflows - Executions tab", SLOW_API, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    names.length = 0;
    data.folderName = `${fake.lastName.toLowerCase()}-exfolder`;
  });

  afterEach(() => {
    cleanupWorkflows(names);
    cleanupFolders([data.folderName]);
  });

  it("The Executions list filters by environment, workflow, status, trigger, date and folder", () => {
    okWorkflow("exok").then((ok) => {
      failingWorkflow("exfail").then((failing) => {
        runOf(ok, "success");
        runOf(failing, "failure");
        cy.apiCreateFolder(data.folderName, "workflow").then((folder) => {
          cy.apiAddAppToFolder(folder.id, ok.id);
        });

        visitExecutions();
        filterExecutionsByWorkflow(ok.name);
        rowOf(ok).should("contain.text", ok.name);
        rowOf(failing).should("not.exist");

        pickSelectOption(
          `${executionsFilterSelector.workflow} .react-select__control`,
          failing.name
        );
        rowOf(failing).should("contain.text", executionsText.statusFailed);

        pickSelectOption(
          `${executionsFilterSelector.workflow} .react-select__control`,
          executionsText.allWorkflows
        );
        filterByStatus("failed");
        rowOf(failing).should("exist");
        rowOf(ok).should("not.exist");
        cy.get(executionsFilterSelector.trigger).click();
        cy.get(executionsFilterSelector.reset).click();
        cy.get(executionsFilterSelector.apply).click();
        rowOf(ok).should("exist");

        filterByTrigger("manual");
        rowOf(ok).should("exist");
        filterByTrigger("manual");
        filterByTrigger("schedule");
        rowOf(ok).should("not.exist");
        cy.get(executionsFilterSelector.empty).should("be.visible");
        cy.get(executionsFilterSelector.trigger).click();
        cy.get(executionsFilterSelector.reset).click();
        cy.get(executionsFilterSelector.apply).click();

        const tomorrow = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
        applyFilter(() => {
          cy.get(executionsFilterSelector.category("date")).click();
          cy.get(executionsFilterSelector.from).type(tomorrow);
        });
        rowOf(ok).should("not.exist");
        cy.get(executionsFilterSelector.empty).should("be.visible");
        cy.get(executionsFilterSelector.trigger).click();
        cy.get(executionsFilterSelector.reset).click();
        cy.get(executionsFilterSelector.apply).click();
        rowOf(ok).should("exist");

        pickSelectOption(
          `${executionsFilterSelector.environment} .react-select__control`,
          "development"
        );
        rowOf(ok).should("exist");
        pickSelectOption(
          `${executionsFilterSelector.environment} .react-select__control`,
          "staging"
        );
        rowOf(ok).should("not.exist");

        cy.visit(
          `/${Cypress.env("workspaceId")}/workflows/executions?folder=${data.folderName}`
        );
        cy.get(executionsSelector.page).should("be.visible");
        rowOf(ok).should("exist");
        rowOf(failing).should("not.exist");
      });
    });
  });

  it("The folder filter is kept in the link across tabs, the Filter button shows a count badge, and an empty result shows a clear message", () => {
    okWorkflow("exfolderok").then((ok) => {
      runOf(ok, "success");
      cy.apiCreateFolder(data.folderName, "workflow").then((folder) => {
        cy.apiAddAppToFolder(folder.id, ok.id);
      });

      cy.visit(
        `/${Cypress.env("workspaceId")}/workflows/executions?folder=${data.folderName}`
      );
      cy.get(executionsSelector.page).should("be.visible");
      rowOf(ok).should("exist");

      cy.get('[data-cy="workflows-tab"]').click();
      cy.location("search").should("include", `folder=${data.folderName}`);
      cy.get('[data-cy="executions-tab"]').click();
      cy.location("search").should("include", `folder=${data.folderName}`);
      cy.get(executionsSelector.page).should("be.visible");

      cy.get(executionsFilterSelector.count).should("not.exist");
      filterByStatus("success");
      cy.get(executionsFilterSelector.count).should("have.text", "1");
      filterByTrigger("schedule");
      cy.get(executionsFilterSelector.count).should("have.text", "2");
      cy.get(executionsFilterSelector.empty).should("contain.text", executionsText.noMatch);
    });
  });

  it("Each run shows workflow name, status (including Waiting), trigger, schedule, start time, duration including waiting time, version and environment", () => {
    waitWorkflow("exwait", 12).then((waiting) => {
      runOf(waiting);
      visitExecutions();
      filterExecutionsByWorkflow(waiting.name);
      rowOf(waiting)
        .should("contain.text", waiting.name)
        .and("contain.text", executionsText.statusWaiting)
        .and("contain.text", "Manual")
        .and("contain.text", "development");
      rowOf(waiting).find("td").then(($cells) => {
        expect($cells).to.have.length(9);
        expect($cells.eq(3).text().trim()).to.equal("—");
        expect($cells.eq(4).text().trim()).to.not.equal("—");
        expect($cells.eq(6).text().trim()).to.not.equal("—");
      });

      cy.then(() => cy.apiWaitForExecutionStatus("success", waiting.executionId));
      cy.get(executionsSelector.refresh).click();
      rowOf(waiting).should("contain.text", executionsText.statusSuccess);
      rowOf(waiting).find("td").eq(5).invoke("text").should("match", /\d/);
      cy.then(() => cy.apiGetWorkflowExecution(waiting.executionId)).then((execution) => {
        const startedAt = new Date(execution.startedAt || execution.started_at);
        const finishedAt = new Date(execution.finishedAt || execution.finished_at);
        expect(finishedAt - startedAt).to.be.at.least(12000);
      });
    });
  });

  it("Stop works on running and waiting runs from the Executions tab: a Wait run never resumes and the stop time is kept", () => {
    waitWorkflow("exstopwait", 20).then((waiting) => {
      runOf(waiting);
      visitExecutions();
      filterExecutionsByWorkflow(waiting.name);
      rowOf(waiting).should("contain.text", executionsText.statusWaiting);
      stopOf(waiting).click();
      rowOf(waiting).should("contain.text", executionsText.statusStopped);
      stopOf(waiting).should("not.exist");

      cy.then(() => cy.apiGetWorkflowExecution(waiting.executionId)).then((stopped) => {
        const stopTime = stopped.finishedAt || stopped.finished_at;
        expect(stopTime, "stop time").to.be.ok;
        cy.wait(25000);
        cy.then(() => cy.apiGetWorkflowExecution(waiting.executionId)).then((later) => {
          expect(later.status).to.equal("terminated");
          expect(later.finishedAt || later.finished_at).to.equal(stopTime);
        });
      });
      cy.get(executionsSelector.refresh).click();
      rowOf(waiting).should("contain.text", executionsText.statusStopped);
    });
  });

  it("Upcoming runs lists active schedules of enabled workflows with their next three run times", () => {
    okWorkflow("exupactive").then((active) => {
      okWorkflow("exupidle").then((idle) => {
        everyMinute(active, "tab-active").then((id) => cy.apiActivateWorkflowSchedule(id, true));
        everyMinute(idle, "tab-idle");

        visitExecutions();
        cy.get(upcomingSelector.panel).should("contain.text", active.name);
        cy.get(upcomingSelector.panel).should("not.contain.text", idle.name);
        cy.contains(upcomingSelector.row, active.name)
          .find(upcomingSelector.time)
          .should("have.length", 3);
        cy.get(upcomingSelector.count).should("exist");
      });
    });
  });

  it("Upcoming runs follows the environment, workflow and folder selection", () => {
    okWorkflow("exupone").then((first) => {
      okWorkflow("exuptwo").then((second) => {
        everyMinute(first, "tab-one").then((id) => cy.apiActivateWorkflowSchedule(id, true));
        everyMinute(second, "tab-two").then((id) => cy.apiActivateWorkflowSchedule(id, true));
        cy.apiCreateFolder(data.folderName, "workflow").then((folder) => {
          cy.apiAddAppToFolder(folder.id, first.id);
        });

        visitExecutions();
        cy.get(upcomingSelector.panel)
          .should("contain.text", first.name)
          .and("contain.text", second.name);

        filterExecutionsByWorkflow(first.name);
        cy.get(upcomingSelector.panel)
          .should("contain.text", first.name)
          .and("not.contain.text", second.name);

        pickSelectOption(
          `${executionsFilterSelector.environment} .react-select__control`,
          "staging"
        );
        cy.get(upcomingSelector.empty).should("contain.text", executionsText.noSchedulesScoped);

        cy.visit(
          `/${Cypress.env("workspaceId")}/workflows/executions?folder=${data.folderName}`
        );
        cy.get(upcomingSelector.panel)
          .should("contain.text", first.name)
          .and("not.contain.text", second.name);
      });
    });
  });

});

describe("Workflows - Used by", SLOW_API, () => {
  const callerQuery = (caller, target, queryName = "callTarget") => {
    useWorkflowContext(caller);
    cy.apiGetDataSourceId("workflows");
    cy.apiCreateWorkflowNode("workflows", queryName, {
      workflowId: target.id,
      params: "{}",
    });
  };

  const openUsedBy = () => {
    cy.intercept("GET", "/api/workflows/*/consumers").as("consumers");
    openLeftDrawer(usedByIcon);
    return cy.wait("@consumers");
  };

  const usedByIcon = usedBySelector.icon;

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    names.length = 0;
  });

  afterEach(() => {
    cleanupWorkflows(names);
  });

  it("Used by lists every app, module and workflow that calls this workflow, grouped with counts and opening in a new tab", () => {
    okWorkflow("ubtarget").then((target) => {
      okWorkflow("ubcaller").then((caller) => {
        callerQuery(caller, target);
        useWorkflowContext(target);
        openWorkflowEditor();
        openUsedBy();
        cy.get(usedBySelector.drawer).should("be.visible");
        cy.get(usedBySelector.group("workflow"))
          .should("contain.text", "Workflows")
          .and("contain.text", caller.name)
          .and("contain.text", "1");
        cy.get(usedBySelector.group("front-end")).should("not.exist");
        cy.get(usedBySelector.item)
          .contains(caller.name)
          .closest("a")
          .should("have.attr", "target", "_blank");
      });
    });
  });

  it("Used by includes new callers, updates after renames, and excludes itself", () => {
    okWorkflow("ubtarget2").then((target) => {
      okWorkflow("ubfirst").then((first) => {
        callerQuery(first, target);
        callerQuery(target, target, "callSelf");
        useWorkflowContext(target);
        openWorkflowEditor();
        openUsedBy();
        cy.get(usedBySelector.item).should("have.length", 1).and("contain.text", first.name);
        cy.get(usedBySelector.drawer).should("not.contain.text", target.name);

        okWorkflow("ubsecond").then((second) => {
          callerQuery(second, target);
          useWorkflowContext(target);
          openWorkflowEditor();
          openUsedBy();
          cy.get(usedBySelector.item).should("have.length", 2);
          cy.get(usedBySelector.drawer).should("contain.text", second.name);

          const renamed = `${second.name}-renamed`;
          names.push(renamed);
          cy.getAuthHeaders().then((headers) =>
            cy
              .request({
                method: "PUT",
                url: `${Cypress.env("server_host")}/api/apps/${second.id}`,
                headers,
                body: { app: { name: renamed } },
              })
              .its("status")
              .should("equal", 200)
          );
          useWorkflowContext(target);
          openWorkflowEditor();
          openUsedBy();
          cy.get(usedBySelector.drawer).should("contain.text", renamed);
        });
      });
    });
  });

  it("Used by shows an empty message when nothing calls the workflow, and \"Couldn't load\" when the request fails", () => {
    okWorkflow("ubalone").then((alone) => {
      useWorkflowContext(alone);
      openWorkflowEditor();
      openUsedBy();
      cy.get(usedBySelector.drawer).should("contain.text", executionsText.usedByEmpty);

      cy.intercept("GET", "/api/workflows/*/consumers", {
        statusCode: 500,
        body: { statusCode: 500, message: "forced failure" },
      }).as("consumersFailing");
      cy.get(usedBySelector.drawer).find("[data-cy='used-by-header']").should("exist");
      openLeftDrawer(usedByIcon);
      openLeftDrawer(usedByIcon);
      cy.wait("@consumersFailing");
      cy.get(usedBySelector.drawer).should("contain.text", executionsText.usedByLoadFailed);
    });
  });
});
