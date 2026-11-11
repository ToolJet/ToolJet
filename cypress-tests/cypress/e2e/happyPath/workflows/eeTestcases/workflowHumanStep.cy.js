import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import {
  workflowSelector,
  humanSelector,
  approvalSelector,
} from "Selectors/platform/workflows";
import { humanText } from "Texts/platform/workflows";
import { cleanupWorkflows } from "Support/utils/workflows/workFlows";
import {
  createHumanWorkflow,
  runUntilWaiting,
  visitApprovals,
  openApprovalRequest,
  openNodesSidebar,
  openHumanSettings,
  assertOutcomeHandles,
  pickSelectOption,
  setNativeInputValue,
  dragSidebarNodeToCanvas,
} from "Support/utils/workflows/workflowApprovals";

// The shared instance is often busy; give API and page responses room.
const SLOW_API = {
  responseTimeout: 60000,
  requestTimeout: 60000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 45000,
};

const data = {};

const outcomeKeysOf = (nodeData) => nodeData.outcomes.map((o) => o.key);

// Authoring the Human step in the editor: adding it, its outcomes and the
// fields the approver fills in. The graph around it is built over the API.
describe("Workflows - Human step in the editor", SLOW_API, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = `${fake.lastName.toLowerCase()}-hstep`;
  });

  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
  });

  describe("adding the step", () => {
    beforeEach(() => {
      cy.apiCreateWorkflowApp(data.workflowName);
      cy.apiFetchWorkflowContext();
      cy.openWorkflow();
      openNodesSidebar();
    });

    it("Clicking Human-in-the-loop in the sidebar adds the step to the canvas and opens its settings", () => {
      cy.get(humanSelector.sidebarHumanNode)
        .should("contain.text", humanText.sidebarNodeLabel)
        .click();
      cy.get(humanSelector.node(humanText.defaultNodeName)).should("be.visible");
      cy.get(humanSelector.modal).should("be.visible");
      cy.get(humanSelector.nodeNameInput).should(
        "have.value",
        humanText.defaultNodeName
      );
      cy.apiWaitForHumanNodeData(
        (nodeData) => nodeData.nodeType === "human",
        undefined,
        "the added Human step to be saved"
      ).then((nodeData) => {
        expect(nodeData.nodeName).to.equal(humanText.defaultNodeName);
      });
    });

    it("Dragging Human-in-the-loop from the sidebar onto the canvas adds the step and it can be opened", () => {
      dragSidebarNodeToCanvas(humanSelector.sidebarHumanNode);
      cy.get(humanSelector.node(humanText.defaultNodeName)).should("be.visible");
      cy.get(humanSelector.modal).should("be.visible");
      cy.get(humanSelector.canvasPane).click(20, 20, { force: true });
      cy.get(humanSelector.modal).should("not.exist");
      openHumanSettings();
      cy.get(humanSelector.nodeNameInput).should(
        "have.value",
        humanText.defaultNodeName
      );
    });
  });

  describe("outcomes", () => {
    it("A new step starts with Approve and Reject, and outcomes can be added, renamed and recoloured", () => {
      cy.apiCreateWorkflowApp(data.workflowName);
      cy.apiFetchWorkflowContext();
      cy.openWorkflow();
      openNodesSidebar();
      cy.get(humanSelector.sidebarHumanNode).click();
      cy.get(humanSelector.modal).should("be.visible");

      humanText.defaultOutcomes.forEach(({ key, label }, index) => {
        cy.get(humanSelector.outcomeKey(index)).should("have.value", key);
        cy.get(humanSelector.outcomeLabel(index)).should("have.value", label);
      });
      assertOutcomeHandles("human1", ["approved", "rejected"]);

      cy.get(humanSelector.outcomeAdd).click();
      cy.get(humanSelector.outcomeKey(2)).should("have.value", "outcome_3");
      cy.get(humanSelector.outcomeLabel(2)).should("have.value", "Outcome 3");
      assertOutcomeHandles("human1", ["approved", "rejected", "outcome_3"]);

      cy.get(humanSelector.outcomeLabel(2)).clear().type("Escalate");
      cy.get(humanSelector.outcomeKey(2)).clear().type("escalate").blur();
      assertOutcomeHandles("human1", ["approved", "rejected", "escalate"]);

      setNativeInputValue(humanSelector.outcomeColor(2), "#ff0000");
      cy.get(humanSelector.outcomeHandle("human1", "escalate")).should(
        "have.css",
        "background-color",
        "rgb(255, 0, 0)"
      );

      cy.apiWaitForHumanNodeData(
        (nodeData) =>
          nodeData.outcomes.length === 3 &&
          nodeData.outcomes[2].key === "escalate" &&
          nodeData.outcomes[2].label === "Escalate" &&
          nodeData.outcomes[2].color === "#ff0000",
        undefined,
        "the edited outcomes to be saved"
      );
    });

    it("Removing an outcome that has a connection asks first, and keeps everything on cancel", () => {
      createHumanWorkflow(data.workflowName);
      cy.openWorkflow();
      openHumanSettings();
      cy.get(workflowSelector.canvasEdge).should("have.length", 3);

      cy.on("window:confirm", (message) => {
        expect(message).to.equal(humanText.removeOutcomeConfirm("Approve", 1));
        return false;
      });
      cy.get(humanSelector.outcomeRemove(0)).click();
      cy.get(humanSelector.outcomeRow(1)).should("exist");
      cy.get(workflowSelector.canvasEdge).should("have.length", 3);
      assertOutcomeHandles("human1", ["approved", "rejected"]);
    });

    it("Confirming the removal of a connected outcome deletes it together with its connection", () => {
      createHumanWorkflow(data.workflowName);
      cy.openWorkflow();
      openHumanSettings();
      cy.get(workflowSelector.canvasEdge).should("have.length", 3);

      cy.on("window:confirm", () => true);
      cy.get(humanSelector.outcomeRemove(0)).click();
      cy.get(humanSelector.outcomeRow(1)).should("not.exist");
      cy.get(humanSelector.outcomeKey(0)).should("have.value", "rejected");
      cy.get(workflowSelector.canvasEdge).should("have.length", 2);
      assertOutcomeHandles("human1", ["rejected"]);
      cy.apiWaitForHumanNodeData(
        (nodeData) => outcomeKeysOf(nodeData).join() === "rejected",
        undefined,
        "the removal to be saved"
      );
    });

    it("The last remaining outcome cannot be removed", () => {
      createHumanWorkflow(data.workflowName, { connect: [] });
      cy.openWorkflow();
      openHumanSettings();

      cy.get(humanSelector.outcomeRemove(1)).click();
      cy.get(humanSelector.outcomeRow(1)).should("not.exist");
      cy.get(humanSelector.outcomeRemove(0)).should("be.disabled");
      assertOutcomeHandles("human1", ["approved"]);
    });

    it("A blank or duplicate outcome key is rejected and the previous key comes back", () => {
      createHumanWorkflow(data.workflowName, { connect: [] });
      cy.openWorkflow();
      openHumanSettings();

      cy.get(humanSelector.outcomeKey(1)).clear().type("approved").blur();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        humanText.duplicateOutcomeKeyToast,
        false
      );
      cy.get(humanSelector.outcomeKey(1)).should("have.value", "rejected");

      cy.get(humanSelector.outcomeKey(1)).clear().blur();
      cy.get(humanSelector.outcomeKey(1)).should("have.value", "rejected");
      assertOutcomeHandles("human1", ["approved", "rejected"]);
    });
  });

  describe("approver input fields", () => {
    it("Fields of every type are configured with Required and a default, saved, and reach the approver's form", () => {
      createHumanWorkflow(data.workflowName);
      cy.openWorkflow();
      openHumanSettings();

      const fields = [
        { name: "reason", label: "Reason", type: "Text", required: true, def: "n/a" },
        { name: "amount", label: "Amount", type: "Number", required: false, def: "5" },
        { name: "urgent", label: "Urgent", type: "Boolean", required: false, def: "true" },
        { name: "priority", label: "Priority", type: "Select", required: true, def: "Low", options: "Low, High" },
      ];
      fields.forEach((field, index) => {
        cy.get(humanSelector.inputFieldAdd).click();
        cy.get(humanSelector.inputField(index)).should("exist");
        cy.get(humanSelector.inputFieldName(index)).clear().type(field.name);
        cy.get(humanSelector.inputFieldLabel(index)).type(field.label);
        pickSelectOption(humanSelector.inputFieldType(index), field.type);
        if (field.options) {
          cy.get(humanSelector.inputFieldOptions(index))
            .type(field.options)
            .blur();
        }
        if (field.required) {
          cy.get(humanSelector.inputFieldRequired(index)).check();
        }
        cy.get(humanSelector.inputFieldDefault(index)).type(field.def);
      });

      cy.apiWaitForHumanNodeData(
        (nodeData) =>
          nodeData.inputSchema.length === 4 &&
          nodeData.inputSchema[3].default === "Low" &&
          nodeData.inputSchema[3].options.join() === "Low,High",
        undefined,
        "the input fields to be saved"
      ).then((nodeData) => {
        expect(
          nodeData.inputSchema.map(({ name, type, required, default: d }) => ({
            name,
            type,
            required,
            default: d,
          }))
        ).to.deep.equal([
          { name: "reason", type: "text", required: true, default: "n/a" },
          { name: "amount", type: "number", required: false, default: "5" },
          { name: "urgent", type: "boolean", required: false, default: "true" },
          { name: "priority", type: "select", required: true, default: "Low" },
        ]);
      });

      // The approver meets exactly those fields, defaults filled in.
      runUntilWaiting().then((request) => {
        visitApprovals();
        openApprovalRequest(request.id);
        cy.get(approvalSelector.inputForm)
          .should("contain.text", "Reason *")
          .and("contain.text", "Amount")
          .and("contain.text", "Urgent")
          .and("contain.text", "Priority *");
        cy.get(approvalSelector.input("reason")).should("have.value", "n/a");
        cy.get(approvalSelector.input("amount")).should("have.value", "5");
        cy.get(approvalSelector.input("urgent")).should("be.checked");
        cy.get(approvalSelector.input("priority")).should("have.value", "Low");
      });
    });

    it("A second input field cannot reuse a name that is already taken", () => {
      createHumanWorkflow(data.workflowName);
      cy.openWorkflow();
      openHumanSettings();
      cy.get(humanSelector.inputFieldAdd).click();
      cy.get(humanSelector.inputFieldAdd).click();
      cy.get(humanSelector.inputFieldName(1)).clear().type("field_1");
      cy.get(humanSelector.inputFieldError)
        .should("have.length", 2)
        .and("contain.text", humanText.duplicateFieldName);
    });
  });

  describe("a released version", () => {
    it("The Human step's settings are read-only once the version is promoted", () => {
      createHumanWorkflow(data.workflowName);
      cy.then(() => {
        const workflowId = Cypress.env("workflowId");
        cy.apiPublishDraftVersion("v1", "", workflowId);
        cy.apiPromoteAppVersion(Cypress.env("environmentId"), workflowId);
      });
      cy.openWorkflow();
      openHumanSettings();

      cy.get(humanSelector.outcomeAdd).should("be.disabled");
      cy.get(humanSelector.inputFieldAdd).should("be.disabled");
      cy.get(humanSelector.outcomeKey(0)).should("be.disabled");
      cy.get(humanSelector.outcomeLabel(0)).should("be.disabled");
      cy.get(humanSelector.outcomeRemove(0)).should("be.disabled");
      cy.get(humanSelector.nodeNameInput).should("not.exist");
    });
  });
});
