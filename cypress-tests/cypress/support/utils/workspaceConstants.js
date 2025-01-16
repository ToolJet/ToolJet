import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";
import * as common from "Support/utils/common";

import { commonText, commonWidgetText } from "Texts/common";
export const contantsNameValidation = (value, error) => {
  cy.get(commonSelectors.workspaceConstantNameInput).click();
  cy.clearAndType(commonSelectors.workspaceConstantNameInput, value);
  cy.get(commonSelectors.nameErrorText).verifyVisibleElement(
    "have.text",
    error
  );
  cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");
};

export const addNewconstants = (name, value, type = "global") => {
  cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
  cy.clearAndType(commonSelectors.workspaceConstantNameInput, name);
  cy.get(commonSelectors.workspaceConstantValueInput).click();
  cy.clearAndType(commonSelectors.workspaceConstantValueInput, value);
  cy.get(workspaceConstantsSelectors.constantsType(type)).check();
  cy.get(workspaceConstantsSelectors.addConstantButton).click();
};

export const existingNameValidation = (
  constName,
  constValue,
  type = "Global"
) => {
  cy.clearAndType(commonSelectors.workspaceConstantNameInput, constName);
  cy.get(workspaceConstantsSelectors.constantsType(type)).check();
  cy.get(commonSelectors.workspaceConstantValueInput).click();
  cy.clearAndType(commonSelectors.workspaceConstantValueInput, constValue);
  cy.get(workspaceConstantsSelectors.addConstantButton).click();
  cy.get(commonSelectors.toastMessage)
    .as("toast")
    .should(
      "contain.text",
      workspaceConstantsText.constantsExisitToast("Global")
    );
};

export const manageWorkspaceConstant = (data) => {
  cy.get(commonSelectors.workspaceConstantsIcon).click();
  // Function to switch to a specific constant tab (Global or Secrets)
  const switchToConstantTab = (constantType) => {
    cy.contains("button", constantType).click({ force: true });
    cy.wait(500); // Allow time for the tab switch
  };

  // Function to validate the name input
  const validateNameInput = (name, expectedError) => {
    cy.clearAndType(commonSelectors.workspaceConstantNameInput, name);
    cy.get(commonSelectors.workspaceConstantValueInput).click(); // Trigger blur event
    cy.get(commonSelectors.nameErrorText).verifyVisibleElement(
      "have.text",
      expectedError
    );
  };

  // Function to validate the value input
  const validateValueInput = (value, expectedError) => {
    cy.clearAndType(commonSelectors.workspaceConstantValueInput, value);
    cy.get(commonSelectors.workspaceConstantNameInput).click(); // Trigger blur event
    cy.get(commonSelectors.valueErrorText).verifyVisibleElement(
      "have.text",
      expectedError
    );
  };

  // Function to perform all constant management steps
  const performConstantManagement = () => {
    cy.get('[data-cy="icon-global-datasources"]').click();
    cy.wait(1000);
    cy.get('[data-cy="icon-workspace-constants"]').click();
    switchToConstantTab(data.constantType);

    // Add a new constant
    cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
    cy.get(workspaceConstantsSelectors.contantFormTitle).verifyVisibleElement(
      "have.text",
      workspaceConstantsText.addConstatntText
    );

    // Name and value validation
    validateNameInput(" ", commonText.constantsNameError);
    validateNameInput("9", commonText.constantsNameError);
    validateNameInput("%", commonText.constantsNameError);
    validateNameInput(
      "Xk4jY2mLn8pQsZ9Rt6vBc7wJaHqOdEfGuVxY3NkMLzPoWX5wee",
      "Maximum length has been reached"
    );
    validateNameInput(
      "Xk4jY2mLn8pQsZ9Rt6vBc7wJaHqOdEfGuVxY3NkMLzPoWX5weetr",
      "Constant name has exceeded 50 characters"
    );
    validateValueInput(" ", commonText.constantsValueError);

    // Add and verify the constant
    cy.clearAndType(commonSelectors.workspaceConstantNameInput, data.constName);
    cy.get(commonSelectors.workspaceConstantValueInput).click();
    cy.clearAndType(
      commonSelectors.workspaceConstantValueInput,
      data.constName
    );
    cy.get(
      workspaceConstantsSelectors.constantsType(data.constantType)
    ).check();
    cy.get(workspaceConstantsSelectors.addConstantButton)
      .should("be.enabled")
      .click();

    if (data.constantType === "Global") {
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        workspaceConstantsText.constantCreatedToast(
          data.constantType.charAt(0).toUpperCase() + data.constantType.slice(1)
        )
      );
    } else if (data.constantType === "Secrets") {
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        workspaceConstantsText.secretConstantCreatedToast
      );
    }

    // Edit and verify the constant
    cy.get(workspaceConstantsSelectors.constEditButton(data.constName)).click();
    cy.get('[data-cy="name-input-field"]').should(
      "have.attr",
      "data-tooltip-content",
      "Cannot edit constant name"
    );
    cy.get(commonSelectors.workspaceConstantValueInput)
      .click()
      .clear()
      .type(data.newConstvalue);
    cy.get(workspaceConstantsSelectors.addConstantButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Constant updated successfully"
    );
    cy.get(
      `[data-cy="${data.constName.toLowerCase()}-constant-visibility"]`
    ).click();
    cy.wait(500);
    cy.get(workspaceConstantsSelectors.constantValue(data.constName))
      .should("be.visible")
      .and("have.text", data.newConstvalue);

    // Delete and verify the constant
    cy.get(
      workspaceConstantsSelectors.constDeleteButton(data.constName)
    ).click();
    cy.get(commonSelectors.modalMessage).verifyVisibleElement(
      "have.text",
      `Are you sure you want to delete ${data.constName} from production?`
    );
    cy.get(commonSelectors.cancelButton).click();
    cy.get(
      workspaceConstantsSelectors.constDeleteButton(data.constName)
    ).click();
    cy.get(commonSelectors.yesButton).click();
    cy.get(workspaceConstantsSelectors.constantValue(data.constName)).should(
      "not.exist"
    );
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Constant deleted successfully"
    );

    // Verify empty state after deletion
    cy.get(workspaceConstantsSelectors.emptyStateHeader).verifyVisibleElement(
      "have.text",
      workspaceConstantsText.emptyStateHeader
    );
  };

  // Perform the constant management steps
  performConstantManagement();
};
