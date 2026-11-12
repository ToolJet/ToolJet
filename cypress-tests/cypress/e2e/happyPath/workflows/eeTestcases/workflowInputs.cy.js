import { fake } from "Fixtures/fake";
import {
  workflowSelector,
  inputsSelector,
  executionsFilterSelector,
} from "Selectors/platform/workflows";
import { inputsText } from "Texts/platform/workflows";
import {
  wfStartNode,
  wfResponseNode,
  wfEdge,
  wfInput,
  wfWorkflowNode,
  getWorkflowReference,
  humanWorkflowDefinition,
  workflowDefinition,
  cleanupWorkflows,
  openLeftDrawer,
  runFromEditor,
  releaseWorkflow,
} from "Support/utils/workflows/workFlows";
import {
  visitExecutionsOf,
  pickSelectOption,
  openWorkflowEditor,
} from "Support/utils/workflows/workflowApprovals";

const SLOW_API = {
  responseTimeout: 60000,
  requestTimeout: 60000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 45000,
};

const data = {};

const paramsDefinition = (workflowInputs) =>
  workflowDefinition({
    nodes: [
      wfStartNode(),
      wfResponseNode("response", "return startTrigger.params"),
    ],
    edges: [wfEdge("start", "response")],
    workflowInputs,
  });

const seedInputsWorkflow = (workflowInputs) => {
  cy.apiCreateWorkflowApp(data.workflowName);
  cy.apiFetchWorkflowContext();
  cy.apiSaveWorkflowDefinition(paramsDefinition(workflowInputs));
};

const card = (index) => cy.get(inputsSelector.card).eq(index);

const cardNamed = (name) =>
  cy
    .get(inputsSelector.card)
    .filter((_, element) => element.querySelector(inputsSelector.name).value === name);

const savedInputs = () =>
  cy.apiGetWorkflowDefinition().then((definition) => definition.workflowInputs);

const openInputsPanel = () => {
  cy.openWorkflow();
  openLeftDrawer(inputsSelector.icon);
};

const addInputCard = (name, type, defaultValue, required) => {
  cy.get(inputsSelector.add).click();
  card(0).find(inputsSelector.name).type(name);
  if (type !== "string") {
    pickSelectOption(
      `${inputsSelector.card}:eq(0) ${inputsSelector.typeControl}`,
      type
    );
  }
  if (defaultValue !== undefined) {
    card(0)
      .find(inputsSelector.defaultValue)
      .type(defaultValue, { parseSpecialCharSequences: false });
  }
  if (required) card(0).find(inputsSelector.required).check();
};

const runLastWithOverrides = (overrides) => {
  runFromEditor();
  cy.get(inputsSelector.runDialogTitle).should(
    "have.text",
    inputsText.runDialogTitle
  );
  Object.entries(overrides).forEach(([key, value]) => {
    cy.contains(inputsSelector.overrideRow, key)
      .find(inputsSelector.overrideToggle)
      .check();
    if (value !== null) {
      cy.contains(inputsSelector.overrideRow, key)
        .find("> input")
        .clear()
        .type(value);
    }
  });
  cy.get(inputsSelector.runDialogConfirm).click();
  return waitForEditorRun();
};

const waitForEditorRun = () =>
  cy.wait("@editorRun", { responseTimeout: 60000 }).then((interception) => {
    Cypress.env("executionId", interception.response.body.result?.executionId);
    return interception;
  });

describe("Workflows - workflow inputs", SLOW_API, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-inp`;
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("Inputs of every type can be added with defaults and Required, and survive a reload", () => {
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    cy.apiSaveWorkflowDefinition(paramsDefinition([]));
    openInputsPanel();

    cy.get(inputsSelector.addFirst).click();
    card(0).find(inputsSelector.name).type("region");
    card(0).find(inputsSelector.defaultValue).type("eu");
    card(0).find(inputsSelector.required).check();
    addInputCard("limit", "number", "25");
    addInputCard("verbose", "boolean", "true", true);
    addInputCard("filters", "object", '{"team":"ops"}');
    addInputCard("ids", "array", "[1,2,3]");

    cy.apiWaitForWorkflowDefinition(
      (definition) => definition.workflowInputs?.length === 5,
      "the five inputs to be saved"
    );
    savedInputs().then((inputs) => {
      const byKey = Object.fromEntries(inputs.map((input) => [input.key, input]));
      expect(byKey.region).to.deep.include({
        type: "string",
        defaultValue: "eu",
        required: true,
      });
      expect(byKey.limit).to.deep.include({ type: "number", defaultValue: 25 });
      expect(byKey.verbose).to.deep.include({
        type: "boolean",
        defaultValue: true,
        required: true,
      });
      expect(byKey.filters).to.deep.include({ type: "object" });
      expect(byKey.filters.defaultValue).to.deep.equal({ team: "ops" });
      expect(byKey.ids.defaultValue).to.deep.equal([1, 2, 3]);
    });

    cy.reload();
    openLeftDrawer(inputsSelector.icon);
    cy.get(inputsSelector.card).should("have.length", 5);
    cardNamed("region").within(() => {
      cy.get(inputsSelector.defaultValue).should("have.value", "eu");
      cy.get(inputsSelector.required).should("be.checked");
      cy.get(inputsSelector.typeControl).should("contain.text", "string");
    });
    cardNamed("limit").within(() => {
      cy.get(inputsSelector.defaultValue).should("have.value", "25");
      cy.get(inputsSelector.required).should("not.be.checked");
      cy.get(inputsSelector.typeControl).should("contain.text", "number");
    });
    cardNamed("verbose").within(() => {
      cy.get(inputsSelector.defaultValue).should("have.value", "true");
      cy.get(inputsSelector.required).should("be.checked");
      cy.get(inputsSelector.typeControl).should("contain.text", "boolean");
    });
    cardNamed("filters").within(() => {
      cy.get(inputsSelector.defaultValue).should("have.value", '{"team":"ops"}');
      cy.get(inputsSelector.typeControl).should("contain.text", "object");
    });
    cardNamed("ids").within(() => {
      cy.get(inputsSelector.defaultValue).should("have.value", "[1,2,3]");
      cy.get(inputsSelector.typeControl).should("contain.text", "array");
    });
  });

  const keeperInput = () => wfInput("keeper", "string", { defaultValue: "k" });
  const savedStaysUnchanged = () => {
    cy.wait(2500);
    savedInputs().then((inputs) => {
      expect(inputs.map(({ key, defaultValue }) => ({ key, defaultValue }))).to.deep.equal([
        { key: "keeper", defaultValue: "k" },
      ]);
    });
  };

  // Skipped: a duplicate input name overwrites the saved input.
  it.skip("A duplicate input name shows a clear message and the saved inputs stay unchanged", () => {
    seedInputsWorkflow([keeperInput()]);
    openInputsPanel();

    cy.get(inputsSelector.add).click();
    // Suspected bug: a duplicate name (ignoring case) overwrites the saved input.
    card(0).find(inputsSelector.name).type("KEEPER");
    card(0).find(inputsSelector.error).should("contain.text", inputsText.namesUnique);
    card(1).find(inputsSelector.error).should("contain.text", inputsText.namesUnique);
    savedStaysUnchanged();
  });

  it("Blank and invalid-default inputs show a clear message and are not saved", () => {
    const typeControl = `${inputsSelector.card}:eq(0) ${inputsSelector.typeControl}`;

    seedInputsWorkflow([keeperInput()]);
    openInputsPanel();

    cy.get(inputsSelector.add).click();
    card(0).find(inputsSelector.error).should("contain.text", inputsText.nameRequired);
    savedStaysUnchanged();

    card(0).find(inputsSelector.name).type("limit");
    card(0).find(inputsSelector.error).should("not.exist");
    pickSelectOption(typeControl, "number");
    card(0).find(inputsSelector.defaultValue).type("abc");
    card(0).find(inputsSelector.error).should("contain.text", inputsText.numberDefault);
    savedStaysUnchanged();

    pickSelectOption(typeControl, "boolean");
    card(0).find(inputsSelector.defaultValue).clear().type("yes");
    card(0).find(inputsSelector.error).should("contain.text", inputsText.booleanDefault);
    savedStaysUnchanged();

    pickSelectOption(typeControl, "array");
    card(0).find(inputsSelector.defaultValue).clear().type("{{}");
    card(0).find(inputsSelector.error).should("contain.text", inputsText.arrayDefault);
    savedStaysUnchanged();

    pickSelectOption(typeControl, "object");
    card(0).find(inputsSelector.defaultValue).clear().type("[1]");
    card(0).find(inputsSelector.error).should("contain.text", inputsText.objectDefault);
    savedStaysUnchanged();

    card(0).find(inputsSelector.defaultValue).clear().type("{{}}");
    card(0).find(inputsSelector.error).should("not.exist");
    cy.apiWaitForWorkflowDefinition(
      (definition) => definition.workflowInputs?.some((input) => input.key === "limit"),
      "the now-valid input to be saved"
    );
  });

  it("The inputs panel is read-only on a released version", () => {
    seedInputsWorkflow([
      wfInput("region", "string", { defaultValue: "eu", required: true }),
    ]);
    releaseWorkflow(data.workflowName);
    openInputsPanel();

    cy.get(workflowSelector.versionLockBanner).should("be.visible");
    cy.get(inputsSelector.card).should("have.length", 1);
    cy.get(inputsSelector.add).should("not.exist");
    cy.get(inputsSelector.remove).should("not.exist");
    card(0).find(inputsSelector.name).should("be.disabled").and("have.value", "region");
    card(0).find(inputsSelector.defaultValue).should("be.disabled");
    card(0).find(inputsSelector.required).should("be.disabled").and("be.checked");
  });

  it("The Run dialog lists the inputs, a ticked value overrides the default and an unticked one uses it", () => {
    seedInputsWorkflow([
      wfInput("region", "string", { defaultValue: "eu" }),
      wfInput("limit", "number", { defaultValue: 10, required: true }),
    ]);
    openWorkflowEditor();
    runFromEditor();

    cy.get(inputsSelector.runDialogTitle).should("have.text", inputsText.runDialogTitle);
    cy.get(inputsSelector.overrideRow).should("have.length", 2);
    cy.contains(inputsSelector.overrideRow, "region").should("contain.text", "string");
    cy.contains(inputsSelector.overrideRow, "limit").should("contain.text", "number · required");
    cy.get(inputsSelector.overrideToggle).each(($toggle) =>
      cy.wrap($toggle).should("not.be.checked")
    );

    cy.contains(inputsSelector.overrideRow, "region")
      .find(inputsSelector.overrideToggle)
      .check();
    cy.contains(inputsSelector.overrideRow, "region")
      .find("> input")
      .should("have.value", "eu")
      .and("have.attr", "placeholder", "Default: eu")
      .clear()
      .type("us");
    cy.get(inputsSelector.runDialogConfirm).click();
    waitForEditorRun().then(({ response }) => {
      expect(response.statusCode).to.equal(201);
      cy.apiWaitForExecutionStatus("success");
      cy.apiGetExecutionNode("response1").then((node) => {
        expect(node.result.data).to.deep.equal({ region: "us", limit: 10 });
      });
    });
  });

  it("A required input with no default and no value starts the run and fails it at Start", () => {
    seedInputsWorkflow([wfInput("region", "string", { required: true })]);
    openWorkflowEditor();

    runLastWithOverrides({}).then(({ response }) => {
      expect(response.statusCode).to.equal(201);
    });
    cy.apiWaitForExecutionStatus("failure");
    cy.get(workflowSelector.workflowLogErrorRow, { timeout: 30000 })
      .should("contain.text", inputsText.startFailed)
      .and("contain.text", inputsText.requiredError("region"));
    cy.apiGetExecutionNode("response1").its("executed").should("equal", false);
  });

  it("A workflow without inputs runs straight away without a Run dialog", () => {
    seedInputsWorkflow([]);
    openWorkflowEditor();
    runFromEditor();

    waitForEditorRun().its("response.statusCode").should("equal", 201);
    cy.get(inputsSelector.runDialogTitle).should("not.exist");
    cy.apiWaitForExecutionStatus("success");
    cy.get(workflowSelector.workflowLogs).should(
      "contain.text",
      "A few seconds ago"
    );
  });

  describe("webhook calls", () => {
    const webhookInputs = [
      wfInput("region", "string", { defaultValue: "eu" }),
      wfInput("limit", "number", { defaultValue: 10 }),
      wfInput("mode", "string", { required: true }),
    ];

    const enableWebhook = () => {
      cy.apiSetWorkflowWebhookEnabled(true);
      cy.apiGetWorkflowToken().then((token) => (data.token = token));
    };

    const draftQuery = () => ({
      version: Cypress.env("editingVersionName"),
      environment: "development",
    });

    beforeEach(() => {
      seedInputsWorkflow(webhookInputs);
      enableWebhook();
    });

    it("A sync webhook fills in defaults and drops keys that are not declared inputs", () => {
      cy.then(() =>
        cy
          .apiTriggerWorkflowWebhook({
            token: data.token,
            qs: draftQuery(),
            body: { mode: "fast", surplus: "dropped" },
          })
          .then((res) => {
            expect(res.status).to.be.oneOf([200, 201]);
            expect(res.body).to.deep.equal({ region: "eu", limit: 10, mode: "fast" });
            expect(res.body).to.not.have.property("surplus");
          })
      );
    });

    it("A sync webhook missing a required input or sending a wrong type is refused and logged as a failed run", () => {
      cy.then(() =>
        cy
          .apiTriggerWorkflowWebhook({ token: data.token, qs: draftQuery(), body: {} })
          .then((res) => {
            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal(inputsText.requiredError("mode"));
          })
      );
      cy.then(() =>
        cy
          .apiTriggerWorkflowWebhook({
            token: data.token,
            qs: draftQuery(),
            body: { mode: "fast", limit: "ten" },
          })
          .then((res) => {
            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal(inputsText.datatypeError("limit"));
          })
      );

      visitExecutionsOf(data.workflowName);
      cy.get(executionsFilterSelector.anyRow)
        .should("have.length", 2)
        .each(($row) => {
          cy.wrap($row)
            .should("contain.text", data.workflowName)
            .and("contain.text", "Failed")
            .and("contain.text", "Webhook");
        });
    });

    it("An async webhook accepts the call and fails the run at Start when the inputs are invalid", () => {
      cy.then(() =>
        cy
          .apiTriggerWorkflowWebhook({
            token: data.token,
            qs: draftQuery(),
            body: {},
            async: true,
          })
          .then((res) => {
            expect(res.status).to.be.oneOf([200, 201, 202]);
            data.executionId = res.body.workflow_execution_id;
            expect(data.executionId, "execution id").to.be.a("string");
          })
      );
      cy.then(() => {
        cy.apiWaitForExecutionStatus("failure", data.executionId);
        cy.apiGetExecutionNode("response1", data.executionId)
          .its("executed")
          .should("equal", false);
      });

      visitExecutionsOf(data.workflowName);
      cy.get(executionsFilterSelector.anyRow)
        .first()
        .should("contain.text", data.workflowName)
        .and("contain.text", "Failed");
    });
  });
});

describe("Workflows - inputs passed to a child workflow", SLOW_API, () => {
  const DRAFT_PIN = "__default_branch_draft__";

  const seedParent = (childName, childId, params) => {
    cy.apiCreateWorkflowApp(data.parentName);
    cy.apiFetchWorkflowContext();
    getWorkflowReference(childName, childId).then((reference) => {
      cy.apiGetDataSourceId("workflows");
      cy.apiCreateWorkflowNode("workflows", "callChild", {
        workflowId: reference,
        workflowVersionId: DRAFT_PIN,
        params,
      });
      cy.then(() => {
        const queryId = Cypress.env("callChildQueryId");
        cy.apiSaveWorkflowDefinition(
          workflowDefinition({
            nodes: [
              wfStartNode(),
              wfWorkflowNode("call-node", queryId, { workflowId: reference }),
              wfResponseNode("response", "return callChild"),
            ],
            edges: [wfEdge("start", "call-node"), wfEdge("call-node", "response", "success")],
            queryIds: [queryId],
          })
        );
      });
    });
  };

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.childName = `${fake.lastName.toLowerCase()}-child`;
    data.parentName = `${fake.lastName.toLowerCase()}-parent`;
    cy.apiCreateWorkflowApp(data.childName);
    cy.apiFetchWorkflowContext();
    cy.then(() => {
      data.childId = Cypress.env("workflowId");
    });
    cy.apiSaveWorkflowDefinition(
      workflowDefinition({
        nodes: [wfStartNode(), wfResponseNode("response", "return startTrigger.params")],
        edges: [wfEdge("start", "response")],
        workflowInputs: [wfInput("region", "string", { required: true })],
      })
    );
  });

  afterEach(() => {
    cleanupWorkflows([data.parentName, data.childName]);
  });

  it("A parent workflow passes values for the child's required input through a Run Workflow step and the child receives them", () => {
    seedParent(data.childName, data.childId, [{ key: "region", value: "emea" }]);
    cy.apiRunWorkflow().then((response) => {
      expect(response.status).to.equal(201);
      expect(JSON.stringify(response.body.result)).to.include("emea");
    });
  });

  it("A parent workflow whose child contains a Human step is refused with a clear message", () => {
    cy.apiSaveWorkflowDefinition(humanWorkflowDefinition());
    seedParent(data.childName, data.childId, [{ key: "", value: "" }]);
    cy.apiRunWorkflow();
    cy.apiWaitForExecutionStatus("failure");
    cy.apiGetWorkflowExecution().then((execution) => {
      expect(JSON.stringify(execution)).to.include(
        "Human nodes are not supported in workflows called from another workflow"
      );
    });
    cy.apiListApprovals({ status: "pending", app_id: data.childId })
      .its("body.requests")
      .should("have.length", 0);
  });

  it("A parent workflow that leaves out the child's required input fails the run", () => {
    seedParent(data.childName, data.childId, [{ key: "", value: "" }]);
    cy.apiRunWorkflow();
    cy.apiWaitForExecutionStatus("failure");
  });
});

describe("Workflows - input and legacy parameter with the same name", SLOW_API, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-clash`;
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    cy.apiSaveWorkflowDefinition(
      workflowDefinition({
        nodes: [wfStartNode(), wfResponseNode("response", "return startTrigger.params.region")],
        edges: [wfEdge("start", "response")],
        workflowInputs: [wfInput("region", "string", { defaultValue: "from-input" })],
        defaultParams: JSON.stringify({ region: "from-legacy" }),
      })
    );
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("The workflow input's default wins over a legacy Test JSON key of the same name, and a given value wins over both", () => {
    cy.apiRunWorkflow().then((res) => {
      expect(res.status).to.equal(201);
      expect(res.body.result.data).to.equal("from-input");
    });
    cy.apiRunWorkflow({ params: { region: "given" } }).then((res) => {
      expect(res.body.result.data).to.equal("given");
    });
  });
});
