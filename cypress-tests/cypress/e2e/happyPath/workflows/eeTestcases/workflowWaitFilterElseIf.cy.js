import { fake } from "Fixtures/fake";
import {
  workflowSelector,
  inputsSelector,
  controlFlowSelector,
  executionsFilterSelector,
} from "Selectors/platform/workflows";
import { controlFlowText } from "Texts/platform/workflows";
import {
  wfStartNode,
  wfQueryNode,
  wfResponseNode,
  wfWaitNode,
  wfFilterNode,
  wfMultiIfNode,
  wfInput,
  wfEdge,
  workflowDefinition,
  createRunjsQueries,
  cleanupWorkflows,
  openLeftDrawer,
  runFromEditor,
  addNodeFromHandle,
  assertNodeRan,
} from "Support/utils/workflows/workFlows";
import {
  openWorkflowEditor,
  pickSelectOption,
  visitExecutionsOf,
} from "Support/utils/workflows/workflowApprovals";

const SLOW_API = {
  responseTimeout: 60000,
  requestTimeout: 60000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 45000,
};

const data = {};

const waitNodeData = () =>
  cy.apiGetWorkflowDefinition().then(
    (definition) =>
      definition.nodes.find((node) => node.data?.nodeType === "wait").data
  );

const seedWaitWorkflow = (durationSeconds) => {
  cy.apiCreateWorkflowApp(data.workflowName);
  cy.apiFetchWorkflowContext();
  cy.apiSaveWorkflowDefinition(
    workflowDefinition({
      nodes: [
        wfStartNode(),
        wfWaitNode("wait", durationSeconds),
        wfResponseNode("response", "return 'after the wait'"),
      ],
      edges: [wfEdge("start", "wait"), wfEdge("wait", "response")],
    })
  );
};

const waitForEditorRun = () =>
  cy.wait("@editorRun", { responseTimeout: 60000 }).then((interception) => {
    Cypress.env("executionId", interception.response.body.result?.executionId);
    return interception;
  });

const runWithOverrides = (overrides = {}) => {
  runFromEditor();
  cy.get(inputsSelector.runDialogTitle).should("be.visible");
  Object.entries(overrides).forEach(([key, value]) => {
    cy.contains(inputsSelector.overrideRow, key)
      .find(inputsSelector.overrideToggle)
      .check();
    cy.contains(inputsSelector.overrideRow, key)
      .find("> input")
      .clear()
      .type(value, { parseSpecialCharSequences: false });
  });
  cy.get(inputsSelector.runDialogConfirm).click();
  return waitForEditorRun();
};

const setDuration = (value, unit) => {
  cy.get(controlFlowSelector.waitDurationValue).clear().type(String(value));
  if (unit) {
    pickSelectOption(
      controlFlowSelector.waitDurationUnit,
      unit
    );
  }
};

const openNode = (name) =>
  cy.get(workflowSelector.nodeName(name)).click({ force: true });

describe("Workflows - Wait step", SLOW_API, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-wait`;
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("A new Wait step defaults to 5 seconds and accepts anything from 1 second to 30 days in any unit", () => {
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
    cy.openWorkflow();
    openLeftDrawer(controlFlowSelector.nodesIcon);
    cy.get(controlFlowSelector.sidebarWait).click();

    openNode("wait1");
    cy.get(controlFlowSelector.waitDurationValue).should("have.value", "5");
    cy.get(controlFlowSelector.waitDurationUnit).should("contain.text", "Seconds");
    cy.get(controlFlowSelector.waitInvalid).should("not.exist");
    cy.apiWaitForWorkflowDefinition(
      (definition) => definition.nodes.some((node) => node.data?.nodeType === "wait"),
      "the added Wait step to be saved"
    );
    waitNodeData().its("durationSeconds").should("equal", 5);

    [
      { value: 1, unit: "Seconds", seconds: 1 },
      { value: 10, unit: "Minutes", seconds: 600 },
      { value: 2, unit: "Hours", seconds: 7200 },
      { value: 30, unit: "Days", seconds: 2592000 },
    ].forEach(({ value, unit, seconds }) => {
      setDuration(value, unit);
      cy.get(controlFlowSelector.waitInvalid).should("not.exist");
      cy.apiWaitForWorkflowDefinition(
        (definition) =>
          definition.nodes.find((node) => node.data?.nodeType === "wait").data
            .durationSeconds === seconds,
        `${value} ${unit} to be saved as ${seconds} seconds`
      );
    });
    cy.get(controlFlowSelector.waitDurationUnit).should("contain.text", "Days");
  });

  it("Wait values outside 1 second to 30 days are refused in the editor and the last valid value is kept", () => {
    seedWaitWorkflow(60);
    cy.openWorkflow();
    openNode("wait1");
    cy.get(controlFlowSelector.waitDurationValue).should("have.value", "1");
    cy.get(controlFlowSelector.waitDurationUnit).should("contain.text", "Minutes");

    setDuration(0);
    cy.get(controlFlowSelector.waitInvalid).should("exist");
    cy.get(controlFlowSelector.waitError).should(
      "contain.text",
      controlFlowText.waitRangeError
    );

    setDuration(31, "Days");
    cy.get(controlFlowSelector.waitError).should(
      "contain.text",
      controlFlowText.waitRangeError
    );
    waitNodeData().its("durationSeconds").should("be.at.most", 2592000);

    setDuration(30);
    cy.get(controlFlowSelector.waitInvalid).should("not.exist");
    cy.apiWaitForWorkflowDefinition(
      (definition) =>
        definition.nodes.find((node) => node.data?.nodeType === "wait").data
          .durationSeconds === 2592000,
      "the valid 30 day value to be saved"
    );
  });

  it("A Wait value that is out of range in the saved workflow fails the run with a clear message", () => {
    seedWaitWorkflow(3000000);
    openWorkflowEditor();
    runFromEditor();
    waitForEditorRun();

    cy.get(workflowSelector.workflowLogErrorRow, { timeout: 30000 }).should(
      "contain.text",
      controlFlowText.waitServerRangeError
    );
    assertNodeRan("response1", false);
  });

  it("A run shows Waiting during the pause, keeps waiting through a page reload and continues downstream afterwards", () => {
    seedWaitWorkflow(40);
    openWorkflowEditor();
    runFromEditor();
    waitForEditorRun();

    cy.get(workflowSelector.workflowLogs)
      .first()
      .should("contain.text", controlFlowText.waitingRunLabel);
    cy.get(controlFlowSelector.nodeColumnItem("wait1")).click();
    cy.get('[data-cy="hitl-waiting-banner"]').should(
      "contain.text",
      controlFlowText.waitingBanner
    );

    cy.reload();
    cy.get(workflowSelector.startNode, { timeout: 30000 }).should("exist");
    visitExecutionsOf(data.workflowName);
    cy.get(executionsFilterSelector.anyRow)
      .first()
      .should("contain.text", controlFlowText.waitingRunLabel);

    cy.apiWaitForExecutionStatus("success");
    cy.apiGetExecutionNode("response1").then((node) => {
      expect(node.executed).to.equal(true);
      expect(node.result.data).to.equal("after the wait");
    });
    cy.get(executionsFilterSelector.refresh).click();
    cy.get(executionsFilterSelector.anyRow).first().should("contain.text", "Success");
  });
});

describe("Workflows - Filter step", SLOW_API, () => {
  const items = [5, 1, 4, 2, 3, 9, 8];

  const filterWorkflow = ({
    input = "startTrigger.params.items",
    predicate = "value % 2 === 1",
    inputs = [wfInput("items", "array", { defaultValue: items })],
    extraEdges = [],
    extraNodes = [],
    queryIds = [],
  } = {}) =>
    cy.apiSaveWorkflowDefinition(
      workflowDefinition({
        nodes: [
          wfStartNode(),
          wfFilterNode("filter", input, predicate),
          wfResponseNode("response", "return filter1.data"),
          ...extraNodes,
        ],
        edges: [
          wfEdge("start", "filter"),
          wfEdge("filter", "response"),
          ...extraEdges,
        ],
        queryIds,
        workflowInputs: inputs,
      })
    );

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-filt`;
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("A Filter step added from the Start handle connects to it automatically", () => {
    cy.openWorkflow();
    cy.get(workflowSelector.canvasEdge).should("not.exist");

    addNodeFromHandle(workflowSelector.startNodeHandleRight, "Filter");

    cy.get(workflowSelector.nodeName("filter1")).should("exist");
    cy.get(workflowSelector.canvasEdge).should("have.length", 1);
    cy.get(controlFlowSelector.nodeHandleLeft("filter1")).should(
      "have.class",
      "react-flow__handle-connected"
    );
    cy.get(workflowSelector.startNodeHandleRight).should(
      "have.class",
      "react-flow__handle-connected"
    );
    cy.apiWaitForWorkflowDefinition(
      (definition) =>
        definition.nodes.some((node) => node.data?.nodeType === "filter") &&
        definition.edges.length === 1,
      "the Filter step and its connection to be saved"
    );
    cy.apiGetWorkflowDefinition().then((definition) => {
      const filter = definition.nodes.find((node) => node.data?.nodeType === "filter");
      const start = definition.nodes.find((node) => node.data?.nodeType === "start");
      expect(definition.edges[0].source).to.equal(start.id);
      expect(definition.edges[0].target).to.equal(filter.id);
    });
  });

  it("Preview shows how many items went in and how many came out", () => {
    filterWorkflow({ predicate: "value > 3" });
    cy.openWorkflow();
    openNode("filter1");

    cy.get(controlFlowSelector.nodeResultBody).should(
      "contain.text",
      controlFlowText.filterEmptyPreview
    );
    cy.get(controlFlowSelector.nodePreviewButton).first().click();
    cy.get(controlFlowSelector.nodeResultBody)
      .should("contain.text", "inputCount")
      .and("contain.text", "outputCount");
    cy.get(controlFlowSelector.nodeResultBody).invoke("text").should("match", /inputCount\D*7/);
    cy.get(controlFlowSelector.nodeResultBody).invoke("text").should("match", /outputCount\D*4/);
  });

  it("A Filter run keeps only the matching items in their original order", () => {
    filterWorkflow();
    openWorkflowEditor();
    runWithOverrides();

    assertNodeRan("filter1");
    assertNodeRan("response1");
    cy.get(workflowSelector.workflowLogErrorRow).should("not.exist");
    cy.apiGetExecutionNode("filter1").then((node) => {
      expect(node.result.data).to.deep.equal([5, 1, 3, 9]);
    });
  });

  it("A Filter that matches nothing returns an empty list and the run is not an error", () => {
    filterWorkflow({ predicate: "value > 100" });
    openWorkflowEditor();
    runWithOverrides();

    assertNodeRan("response1");
    cy.get(workflowSelector.workflowLogErrorRow).should("not.exist");
    cy.apiGetExecutionNode("filter1").then((node) => {
      expect(node.result.data).to.deep.equal([]);
    });
    cy.apiWaitForExecutionStatus("success");
  });

  it("A Filter whose input is not a list fails the run with a clear message", () => {
    filterWorkflow({
      input: "startTrigger.params.label",
      inputs: [wfInput("label", "string", { defaultValue: "not a list" })],
    });
    openWorkflowEditor();
    runWithOverrides();

    cy.get(workflowSelector.workflowLogErrorRow, { timeout: 30000 }).should(
      "contain.text",
      controlFlowText.filterNotArray
    );
    assertNodeRan("response1", false);
  });

  it("A Filter with an empty condition fails the run with a clear message", () => {
    filterWorkflow({ predicate: "" });
    openWorkflowEditor();
    runWithOverrides();

    cy.get(workflowSelector.workflowLogErrorRow, { timeout: 30000 }).should(
      "contain.text",
      controlFlowText.filterEmptyCondition
    );
    assertNodeRan("response1", false);
  });

  it("A Filter whose condition throws fails the run instead of returning a result", () => {
    filterWorkflow({ predicate: "value.missing.deeper > 1" });
    openWorkflowEditor();
    runWithOverrides();

    cy.get(workflowSelector.workflowLogErrorRow, { timeout: 30000 }).should("be.visible");
    assertNodeRan("response1", false);
    cy.apiWaitForExecutionStatus("failure");
  });

  it("A Filter with two incoming connections is flagged in its settings and fails the run", () => {
    createRunjsQueries({ pong: "return [1, 2]" }).then((ids) => {
      filterWorkflow({
        extraNodes: [wfQueryNode("pong-node", ids.pong)],
        extraEdges: [wfEdge("pong-node", "filter", "success")],
        queryIds: [ids.pong],
      });
    });
    openWorkflowEditor();
    openNode("filter1");
    cy.get(controlFlowSelector.filterError).should(
      "contain.text",
      controlFlowText.filterTwoConnectionsHint
    );
    cy.get("body").click(20, 20);

    runWithOverrides();
    cy.get(workflowSelector.workflowLogErrorRow, { timeout: 30000 }).should(
      "contain.text",
      controlFlowText.filterManyInputs
    );
  });
});

describe("Workflows - If step with Else if branches", SLOW_API, () => {
  const branchNames = ["resp_if", "resp_elseif1", "resp_elseif2", "resp_else"];

  const multiIfWorkflow = ({
    codes = [
      "startTrigger.params.n > 3",
      "startTrigger.params.n > 1",
      "startTrigger.params.n === 0",
    ],
    elseEnabled = true,
    connectBranches = true,
  } = {}) => {
    const ifNode = wfMultiIfNode("if", codes, { elseEnabled });
    const handles = codes.map((_, index) => (index === 0 ? "true" : `else-if-${index}`));
    const targets = [
      ...handles.map((handle, index) => ({ handle, name: branchNames[index] })),
      ...(elseEnabled ? [{ handle: "false", name: branchNames[3] }] : []),
    ];
    cy.apiSaveWorkflowDefinition(
      workflowDefinition({
        nodes: [
          wfStartNode(),
          ifNode,
          ...targets.map(({ name }, index) => ({
            ...wfResponseNode(`r-${name}`, `return '${name}'`, "200", name),
            position: { x: 800, y: 80 + index * 120 },
          })),
        ],
        edges: [
          wfEdge("start", "if"),
          ...(connectBranches
            ? targets.map(({ handle, name }) => wfEdge("if", `r-${name}`, handle))
            : []),
        ],
        workflowInputs: [wfInput("n", "number", { defaultValue: 0 })],
      })
    );
  };

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-elif`;
    cy.apiCreateWorkflowApp(data.workflowName);
    cy.apiFetchWorkflowContext();
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  it("An If step can take several Else if branches and each one gets its own connection point", () => {
    cy.openWorkflow();
    openLeftDrawer(controlFlowSelector.nodesIcon);
    cy.get(controlFlowSelector.sidebarIf).click();

    openNode("ifCondition1");
    cy.get(controlFlowSelector.ifModal).should("be.visible");
    cy.get(controlFlowSelector.ifBranch).should("have.length", 2);

    cy.contains(controlFlowSelector.ifAddElseIf, controlFlowText.addElseIf).click();
    cy.contains(controlFlowSelector.ifAddElseIf, controlFlowText.addElseIf).click();
    cy.get(controlFlowSelector.ifBranch).should("have.length", 4);
    cy.get(controlFlowSelector.ifCondition(2)).should("exist");

    cy.get(controlFlowSelector.anyIfHandle("ifCondition1")).should("have.length", 4);
    ["true", "else-if-1", "else-if-2", "false"].forEach((branchId) =>
      cy.get(controlFlowSelector.ifHandle("ifCondition1", branchId)).should("exist")
    );
    cy.get(controlFlowSelector.ifHandleLabel).then(($labels) => {
      expect([...$labels].map((label) => label.textContent)).to.deep.equal([
        "If",
        "Else if 1",
        "Else if 2",
        "Else",
      ]);
    });
    cy.apiWaitForWorkflowDefinition(
      (definition) =>
        definition.nodes.find((node) => node.type === "if-condition")?.data.conditions
          ?.length === 3,
      "the Else if branches to be saved"
    );
  });

  it("Only the first matching branch runs, Else runs when nothing matches and nothing runs when nothing matches without an Else", () => {
    multiIfWorkflow();
    openWorkflowEditor();

    runWithOverrides({ n: "5" });
    assertNodeRan("resp-if");
    assertNodeRan("resp-elseif1", false);
    assertNodeRan("resp-elseif2", false);
    assertNodeRan("resp-else", false);

    runWithOverrides({ n: "2" });
    assertNodeRan("resp-if", false);
    assertNodeRan("resp-elseif1");
    assertNodeRan("resp-else", false);

    runWithOverrides({ n: "-1" });
    assertNodeRan("resp-if", false);
    assertNodeRan("resp-elseif1", false);
    assertNodeRan("resp-elseif2", false);
    assertNodeRan("resp-else");
    cy.get(workflowSelector.workflowLogErrorRow).should("not.exist");
  });

  it("With no Else, a run where nothing matches finishes without running any branch", () => {
    multiIfWorkflow({ elseEnabled: false });
    openWorkflowEditor();

    runWithOverrides({ n: "-1" });
    cy.get(controlFlowSelector.nodeColumnItem("ifCondition1"), { timeout: 30000 }).should("exist");
    ["resp-if", "resp-elseif1", "resp-elseif2"].forEach((name) =>
      assertNodeRan(name, false)
    );
    cy.get(workflowSelector.workflowLogErrorRow).should("not.exist");
    cy.apiWaitForExecutionStatus("success");
  });

  it("An If with an empty condition fails the run and names the branch", () => {
    multiIfWorkflow({ codes: ["startTrigger.params.n > 3", ""] });
    openWorkflowEditor();
    runWithOverrides({ n: "1" });

    cy.get(workflowSelector.workflowLogErrorRow, { timeout: 30000 }).should(
      "contain.text",
      controlFlowText.ifEmptyCondition("Else if 1")
    );
    assertNodeRan("resp-if", false);
  });

  it("An If whose condition throws fails the run instead of choosing a branch", () => {
    multiIfWorkflow({ codes: ["startTrigger.params.n.missing.deeper > 3"] });
    openWorkflowEditor();
    runWithOverrides({ n: "1" });

    cy.get(workflowSelector.workflowLogErrorRow, { timeout: 30000 }).should("be.visible");
    assertNodeRan("resp-if", false);
    cy.apiWaitForExecutionStatus("failure");
  });

  it("Removing a connected Else if branch asks first, keeps it on cancel and renumbers the rest on confirm", () => {
    multiIfWorkflow({
      codes: ["1 > 2", "2 > 3", "3 > 4"],
    });
    cy.openWorkflow();
    cy.get(workflowSelector.canvasEdge).should("have.length", 5);
    openNode("ifCondition1");

    const removeButton = (index) => cy.get(controlFlowSelector.ifBranchRemove).eq(index);

    cy.once("window:confirm", (message) => {
      expect(message).to.equal(controlFlowText.removeElseIfConfirm("Else if 1", 1));
      return false;
    });
    removeButton(0).click();
    cy.get(controlFlowSelector.ifBranch).should("have.length", 4);
    cy.get(workflowSelector.canvasEdge).should("have.length", 5);

    cy.once("window:confirm", () => true);
    removeButton(0).click();
    cy.get(controlFlowSelector.ifBranch).should("have.length", 3);
    cy.get(controlFlowSelector.ifHandleLabel).then(($labels) => {
      expect([...$labels].map((label) => label.textContent)).to.deep.equal([
        "If",
        "Else if 1",
        "Else",
      ]);
    });
    cy.get(controlFlowSelector.ifHandle("ifCondition1", "else-if-1")).should("not.exist");
    cy.get(controlFlowSelector.ifHandle("ifCondition1", "else-if-2")).should("exist");
    cy.get(workflowSelector.canvasEdge).should("have.length", 4);
    cy.apiWaitForWorkflowDefinition(
      (definition) =>
        definition.nodes.find((node) => node.type === "if-condition")?.data.conditions
          ?.length === 2,
      "the removed Else if to be saved"
    );
    cy.apiGetWorkflowDefinition().then((definition) => {
      const labels = definition.nodes
        .find((node) => node.type === "if-condition")
        .data.conditions.map((condition) => condition.label);
      expect(labels).to.deep.equal(["If", "Else if 1"]);
    });
  });

  it("If Preview shows the result and the branch it chose", () => {
    multiIfWorkflow({ codes: ["1 > 2", "2 > 1", "3 > 2"], connectBranches: false });
    cy.openWorkflow();
    openNode("ifCondition1");

    cy.get(controlFlowSelector.nodePreviewButton).first().click();
    cy.get(controlFlowSelector.nodeResultBody)
      .should("contain.text", "selectedBranch")
      .and("contain.text", "Else if 1");

    multiIfWorkflow({ codes: ["1 > 2", "2 > 3", "3 > 4"], connectBranches: false });
    cy.openWorkflow();
    openNode("ifCondition1");
    cy.get(controlFlowSelector.nodePreviewButton).first().click();
    cy.get(controlFlowSelector.nodeResultBody).should("contain.text", "Else");
    cy.get(controlFlowSelector.nodeResultBody).should("not.contain.text", "Else if");
  });
});
