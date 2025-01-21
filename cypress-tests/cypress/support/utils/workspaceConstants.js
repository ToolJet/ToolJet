import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";
import * as common from "Support/utils/common";

import { commonText, commonWidgetText } from "Texts/common";
export const contantsNameValidation = (selector, value, errorSelector, error) => {
  cy.get(selector).click();
  cy.clearAndType(selector, value);
  cy.get(errorSelector).verifyVisibleElement(
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
export const deleteConstant = (name) => {
  cy.get(
    workspaceConstantsSelectors.constDeleteButton(name)
  ).click();
  cy.get(commonSelectors.yesButton).click();
}
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

export const addConstantFormUI = () => {
  cy.get(commonSelectors.workspaceConstantsIcon).click();
  cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
  cy.get(workspaceConstantsSelectors.nameFieldLabel).should('have.text', 'Name');
  cy.get(workspaceConstantsSelectors.nameFieldHelperText).should('have.text', workspaceConstantsText.nameFieldHelperText),
    cy.get(workspaceConstantsSelectors.typeLabel).should('have.text', 'Type'),
    cy.get(workspaceConstantsSelectors.globalConstLabel).should('have.text', 'Global constants');
  cy.get(workspaceConstantsSelectors.globalConstHelperText).should('have.text', workspaceConstantsText.globalConstHelperText),
    cy.get(workspaceConstantsSelectors.secretsConstLabel).should('have.text', 'Secrets');
  cy.get(workspaceConstantsSelectors.secretsConstHelperText).should('have.text', workspaceConstantsText.secretsConstHelperText),
    cy.get(workspaceConstantsSelectors.addConstantButton).should('have.text', workspaceConstantsText.addConstantButton);
  cy.get(commonSelectors.cancelButton).should('have.text', 'Cancel').click();
}

export const manageWorkspaceConstant = (data) => {

  // Function to switch to a specific constant tab (Global or Secrets)
  const switchToConstantTab = (constantType) => {
    cy.contains("button", constantType).click({ force: true });
    cy.wait(500); // Allow time for the tab switch
  };

  // Function to perform all constant management steps
  const performConstantManagement = () => {

    switchToConstantTab(data.constantType);

    cy.get(workspaceConstantsSelectors.envName).should('have.text', `${data.envName} (0)`);
    cy.get("button.tab.active").contains(data.constantType);

    // Add a new constant
    cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
    cy.get(workspaceConstantsSelectors.contantFormTitle).verifyVisibleElement(
      "have.text",
      workspaceConstantsText.addConstatntText
    );

    // Name and value validation
    contantsNameValidation(commonSelectors.workspaceConstantNameInput, " ", commonSelectors.nameErrorText, commonText.constantsNameError);
    contantsNameValidation(commonSelectors.workspaceConstantNameInput, "9", commonSelectors.nameErrorText, commonText.constantsNameError);
    contantsNameValidation(commonSelectors.workspaceConstantNameInput, "%", commonSelectors.nameErrorText, commonText.constantsNameError);
    contantsNameValidation(commonSelectors.workspaceConstantNameInput, "Test spacing", commonSelectors.nameErrorText, commonText.constantsNameError);
    contantsNameValidation(
      commonSelectors.workspaceConstantNameInput,
      "Xk4jY2mLn8pQsZ9Rt6vBc7wJaHqOdEfGuVxY3NkMLzPoWX5weetr",
      commonSelectors.nameErrorText,
      "Constant name has exceeded 50 characters"
    );
    contantsNameValidation(commonSelectors.workspaceConstantValueInput, " ", commonSelectors.valueErrorText, commonText.constantsValueError);
    contantsNameValidation(
      commonSelectors.workspaceConstantNameInput,
      "Xk4jY2mLn8pQsZ9Rt6vBc7wJaHqOdEfGuVxY3NkMLzPoWX5wee",
      commonSelectors.nameErrorText,
      "Maximum length has been reached"
    );

    cy.get(commonSelectors.workspaceConstantValueInput).click().clear().type("text");
    cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");

    cy.get(
      workspaceConstantsSelectors.constantsType(data.constantType)
    ).check();
    cy.get(workspaceConstantsSelectors.addConstantButton).should("be.enabled");
    cy.get(commonSelectors.cancelButton).click();

    //create constants with max char limit
    addNewconstants("Xk4jY2mLn8pQsZ9Rt6vBc7wJaHqOdEfGuVxY3NkMLzPoWX5wee", data.constName, data.constantType);
    cy.get(workspaceConstantsSelectors.constantName("Xk4jY2mLn8pQsZ9Rt6vBc7wJaHqOdEfGuVxY3NkMLzPoWX5wee")).should(
      "exist"
    );

    addNewconstants(data.constName, data.constName, data.constantType);
    if (data.constantType === "Global") {
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        workspaceConstantsText.constantCreatedToast(
          data.constantType.charAt(0).toUpperCase() + data.constantType.slice(1)
        )
      );
      cy.get(workspaceConstantsSelectors.alertInfoText).should('have.text', "To resolve a global workspace constant use {{constants.access_token}}Read documentation");
    }
    else if (data.constantType === "Secrets") {
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        workspaceConstantsText.secretConstantCreatedToast
      );
      cy.get(workspaceConstantsSelectors.alertInfoText).should('have.text', "To resolve a secret workspace constant use {{secrets.access_token}}Read documentation");
    }

    // Edit and verify the constant
    cy.get(workspaceConstantsSelectors.constEditButton(data.constName)).click();
    cy.get('[data-cy="name-input-field"]').should(
      "have.attr",
      "data-tooltip-content",
      "Cannot edit constant name"
    );
    cy.get('input[type="radio"]').should("be.disabled");

    //update same value and add const should be disabled
    cy.get(commonSelectors.workspaceConstantValueInput).click().clear().type(data.constName);
    cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");

    //update different value 
    cy.clearAndType(commonSelectors.workspaceConstantValueInput, data.newConstvalue);
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
      `Are you sure you want to delete ${data.constName} from ${data.envName.toLowerCase()}?`
    );
    cy.get(commonSelectors.cancelButton).click();
    cy.get(workspaceConstantsSelectors.constantValue(data.constName)).should(
      "exist"
    );
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
    cy.get('.tab-count.active').should('have.text', '(1)');

    //delete existing constant to validate empty screen
    deleteConstant("Xk4jY2mLn8pQsZ9Rt6vBc7wJaHqOdEfGuVxY3NkMLzPoWX5wee");

    // Verify empty state after deletion
    cy.get(workspaceConstantsSelectors.emptyStateImage).should('be.visible');
    cy.get(workspaceConstantsSelectors.emptyStateHeader).verifyVisibleElement(
      "have.text",
      workspaceConstantsText.emptyStateHeader
    );
    cy.get(workspaceConstantsSelectors.emptyStateText).should('have.text', workspaceConstantsText.emptyStateText);
    cy.get(workspaceConstantsSelectors.tableAddNewConstButton)
      .should('be.visible');
  };

  // Perform the constant management steps
  performConstantManagement();

  //check env total constant count and search constant functionality 
  addNewconstants("globalconst", "globalvalue");
  addNewconstants("secretconst", "secretvalue", "Secrets");
  cy
  cy.get(workspaceConstantsSelectors.envName).should('have.text', `${data.envName} (2)`);
  switchToConstantTab("Global");
  cy.clearAndType(workspaceConstantsSelectors.searchField, "globalconst");
  cy.get(workspaceConstantsSelectors.constantName("globalconst")).should(
    "exist"
  );

  cy.clearAndType(workspaceConstantsSelectors.searchField, "secretconst");
  cy.get(workspaceConstantsSelectors.constantName("secretconst")).should(
    "not.exist"
  );
  cy.get(workspaceConstantsSelectors.emptyStateImage).should('be.visible');
  cy.get(workspaceConstantsSelectors.emptyStateHeader).should('have.text', workspaceConstantsText.noResultFoundHeader);
  cy.get(workspaceConstantsSelectors.emptyStateText).should('have.text', workspaceConstantsText.emptyStateText);
  cy.get(workspaceConstantsSelectors.searchField).clear();
  deleteConstant("globalconst");

  switchToConstantTab("Secrets");
  cy.clearAndType(workspaceConstantsSelectors.searchField, "secretconst");
  cy.get(workspaceConstantsSelectors.constantName("secretconst")).should(
    "exist"
  );

  cy.clearAndType(workspaceConstantsSelectors.searchField, "globalconst");
  cy.get(workspaceConstantsSelectors.constantName("globalconst")).should(
    "not.exist"
  );
  cy.get(workspaceConstantsSelectors.searchField).clear();
  deleteConstant("secretconst");
};
