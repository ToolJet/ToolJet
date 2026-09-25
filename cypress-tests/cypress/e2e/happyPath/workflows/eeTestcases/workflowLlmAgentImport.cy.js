import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { workflowsText } from "Texts/platform/workflows";
import { workflowSelector } from "Selectors/platform/workflows";
import {
  openWorkflowsDashboard,
  importWorkflowApp,
  workflowImportFile,
  isPluginInstalled,
  setOpenAiApiKey,
  runWorkflowFromEditor,
  getWorkflowExecution,
  getWorkflowQueries,
  cleanupWorkflows,
  cleanupDataSources,
} from "Support/utils/workFlows";

// An exported multi-agent workflow: an orchestrating agent (agent2) hands off
// to three chained agents — multiplyAgent → additionAgent → divisionAgent —
// each backed by an OpenAI model node and doing its arithmetic only through a
// RunJS/RunPy tool. agent1 sits on the canvas, unconnected to the flow.
//
// The export depends on the OpenAI marketplace plugin, which the dashboard
// import installs before creating the model queries. The fixture carries no
// API key; the end-to-end case reads openai_api_key from cypress.env.json.
const modelQueries = ["openai1", "openai2", "openai3", "openai4", "openai5"];
const flowAgents = ["agent2", "multiplyAgent", "additionAgent", "divisionAgent"];
const nodeNames = [
  ...flowAgents,
  "agent1",
  ...modelQueries,
  "multiplyNumbers",
  "multiplyNumberss",
  "addNumbers",
  "divideNumbers",
  "multiplyNumberspy",
  "response1",
];
const edgeCount = 14;
// (12 × 12 + 100) / 2 — the Response node returns divisionAgent's result.
const expectedResult = "122";
const data = {};

describe("Workflows - LLM agent workflow import", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    const suffix = fake.lastName.toLowerCase().replace(/[^a-z]/g, "");
    data.workflowName = `${suffix}-agents`;
    data.dataSourceName = `cypress-${suffix}-openai`;
  });

  // Workflow first: a data source still used by its queries can't be deleted.
  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
    cleanupDataSources([data.dataSourceName]);
  });

  const importAgentWorkflow = (options) => {
    openWorkflowsDashboard();
    workflowImportFile(
      workflowsText.llmAgentFixturePath,
      "openai",
      data.dataSourceName
    ).then((file) => importWorkflowApp(data.workflowName, file, options));
  };

  it("An exported LLM agent workflow imports with its marketplace plugin, model queries and graph intact", () => {
    // Only an instance without the plugin lists it in the import modal.
    isPluginInstalled("openai").then((installedBefore) => {
      importAgentWorkflow({
        beforeImport: () => {
          if (!installedBefore) {
            cy.get(commonSelectors.modalComponent).should(
              "contain.text",
              workflowsText.marketplacePluginsToBeInstalled
            );
          }
        },
      });
    });

    cy.get(workflowSelector.startNode).should("exist");
    nodeNames.forEach((name) =>
      cy.get(workflowSelector.nodeName(name)).should("exist")
    );
    cy.get(workflowSelector.canvasEdge).should("have.length", edgeCount);

    isPluginInstalled("openai").should("equal", true);

    // Import drops a data source whose plugin is missing, along with its
    // queries, and still reports success — so check the model queries arrived
    // and bound to the data source this import created.
    cy.apiGetDataSourceIdByName(data.dataSourceName).then((dataSourceId) => {
      expect(dataSourceId, "imported OpenAI data source").to.be.a("string");
      cy.location("pathname").then((pathname) =>
        getWorkflowQueries(pathname.split("/").pop()).then((queries) => {
          const models = queries.filter((query) => query.kind === "openai");
          expect(models.map((query) => query.name).sort()).to.deep.equal(
            modelQueries
          );
          models.forEach((query) =>
            expect(query.data_source_id).to.equal(dataSourceId)
          );
        })
      );
    });
  });

  it("An agent whose model rejects its credentials fails the run at that agent", () => {
    importAgentWorkflow();
    setOpenAiApiKey(data.dataSourceName, "not-a-real-openai-key");

    runWorkflowFromEditor().then((result) => {
      expect(result.executionStatus).to.equal("failed");

      // Only the orchestrating agent reaches its model; nothing after it runs.
      getWorkflowExecution(result.executionId).then(({ nodes }) => {
        const executed = nodes.filter((node) => node.executed);
        expect(
          executed
            .filter((node) => node.type === "agent")
            .map((node) => node.definition.nodeName)
        ).to.deep.equal(["agent2"]);
        expect(executed.some((node) => node.type === "output")).to.equal(false);
      });
    });
    cy.get(workflowSelector.workflowLogErrorRow).should(
      "contain.text",
      workflowsText.agentExecutionFailed
    );
  });

  it("The imported agents chain through their tools and return the computed result", () => {
    const apiKey = Cypress.env("openai_api_key");
    // Checked without an assertion so the key never reaches the command log.
    if (!apiKey) {
      throw new Error("Set openai_api_key in cypress.env.json to run this case");
    }

    importAgentWorkflow();
    setOpenAiApiKey(data.dataSourceName, apiKey);

    runWorkflowFromEditor().then((result) => {
      expect(result.executionStatus).to.equal("completed");

      getWorkflowExecution(result.executionId).then(({ nodes }) => {
        const executedAgents = nodes
          .filter((node) => node.type === "agent" && node.executed)
          .map((node) => node.definition.nodeName);
        expect(executedAgents).to.have.members(flowAgents);
      });
    });
    cy.get(workflowSelector.workflowLogErrorRow).should("not.exist");
    cy.verifyResponseNodeOutput(expectedResult);
  });
});
