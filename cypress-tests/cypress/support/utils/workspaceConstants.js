import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";
import { importSelectors } from "Selectors/exportImport";
import { workflowSelector } from "Selectors/workflows";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { getAllConstantsWithCount } from "Support/utils/platform/apiUtils/apiWSConstants";
import { appPromote } from "Support/utils/platform/multiEnv";
import { commonText } from "Texts/common";
import { workspaceConstantsText } from "Texts/workspaceConstants";

export const contantsNameValidation = (
  selector,
  value,
  errorSelector,
  error
) => {
  cy.get(selector).click();
  cy.clearAndType(selector, value);
  cy.get(errorSelector).verifyVisibleElement("have.text", error);
  cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");
};

export const addAndVerifyConstants = (name, value, type = "global") => {
  switchToConstantTab(type);
  cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
  cy.clearAndType(commonSelectors.workspaceConstantNameInput, name);
  cy.get(commonSelectors.workspaceConstantValueInput).click();
  cy.clearAndType(commonSelectors.workspaceConstantValueInput, value);
  cy.get(workspaceConstantsSelectors.constantsType(type)).check();
  cy.get(workspaceConstantsSelectors.addConstantButton).click();
  cy.get(workspaceConstantsSelectors.constantName(name)).should("exist");
};

export const deleteConstant = (name, constType = "Global") => {
  switchToConstantTab(constType);
  cy.get(workspaceConstantsSelectors.constDeleteButton(name)).click();
  cy.get(commonSelectors.yesButton).click();
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

export const verifyConstantFormUI = () => {
  cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
  const verificationItems = [
    {
      selector: workspaceConstantsSelectors.nameFieldLabel,
      expectedText: "Name",
    },
    {
      selector: workspaceConstantsSelectors.nameFieldHelperText,
      expectedText: workspaceConstantsText.nameFieldHelperText,
    },
    { selector: workspaceConstantsSelectors.typeLabel, expectedText: "Type" },
    {
      selector: workspaceConstantsSelectors.globalConstLabel,
      expectedText: "Global constants",
    },
    {
      selector: workspaceConstantsSelectors.globalConstHelperText,
      expectedText: workspaceConstantsText.globalConstHelperText,
    },
    {
      selector: workspaceConstantsSelectors.secretsConstLabel,
      expectedText: "Secrets",
    },
    {
      selector: workspaceConstantsSelectors.secretsConstHelperText,
      expectedText: workspaceConstantsText.secretsConstHelperText,
    },
    {
      selector: workspaceConstantsSelectors.addConstantButton,
      expectedText: workspaceConstantsText.addConstantButton,
    },
    { selector: commonSelectors.cancelButton, expectedText: "Cancel" },
  ];

  verificationItems.forEach(({ selector, expectedText }) => {
    cy.get(selector).should("have.text", expectedText);
  });

  cy.get(commonSelectors.cancelButton).click();
};

// Function to switch to a specific constant tab (Global or Secrets)
export const switchToConstantTab = (constantType) => {
  cy.get(`[data-cy="${constantType.toLowerCase()}-constants-button"]`).click();
};

export const verifyConstantValueVisibility = (constSelector, constValue) => {
  cy.get(constSelector).click();
  cy.get(dataSourceSelector.editorVariablePreview).should(
    "contain.text",
    constValue
  );
};

export const verifySearch = (data) => {
  addAndVerifyConstants("secretconst", "secretvalue", "Secrets");

  addAndVerifyConstants("globalconst", "globalvalue");

  cy.get('[data-cy="home-page-icon"]').click();
  cy.wait(500);
  cy.get(commonSelectors.workspaceConstantsIcon).click();

  getAllConstantsWithCount().then(({ count }) => {
    // use count only
    cy.get(workspaceConstantsSelectors.envName).should(
      "have.text",
      `${data.envName} (${count})`
    );
  });

  switchToConstantTab("Global");
  cy.clearAndType(workspaceConstantsSelectors.searchField, "globalconst");
  cy.get(workspaceConstantsSelectors.constantName("globalconst")).should(
    "exist"
  );

  cy.clearAndType(workspaceConstantsSelectors.searchField, "secretconst");
  cy.get(workspaceConstantsSelectors.constantName("secretconst")).should(
    "not.exist"
  );
  cy.get(workspaceConstantsSelectors.emptyStateImage).should("be.visible");
  cy.get(workspaceConstantsSelectors.emptyStateHeader).should(
    "have.text",
    workspaceConstantsText.noResultFoundHeader
  );
  cy.get(workspaceConstantsSelectors.emptyStateText).should(
    "have.text",
    workspaceConstantsText.emptyStateText
  );
  cy.get(workspaceConstantsSelectors.searchField).clear();
  deleteConstant("globalconst");

  cy.get('[data-cy="home-page-icon"]').click();
  cy.wait(500);
  cy.get(commonSelectors.workspaceConstantsIcon).click();
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
  deleteConstant("secretconst", "Secrets");
};

export const VerifyConstantsFormInputValidation = () => {
  const selectorMap = {
    name: {
      input: commonSelectors.workspaceConstantNameInput,
      error: commonSelectors.nameErrorText,
    },
    value: {
      input: commonSelectors.workspaceConstantValueInput,
      error: commonSelectors.valueErrorText,
    },
  };

  const validationTests = [
    { type: "name", value: " ", expectedError: commonText.constantsNameError },
    { type: "name", value: "9", expectedError: commonText.constantsNameError },
    { type: "name", value: "%", expectedError: commonText.constantsNameError },
    {
      type: "name",
      value: "Test spacing",
      expectedError: commonText.constantsNameError,
    },
    {
      type: "name",
      value: "Xk4jY2mLn8pQsZ9Rt6vBc7wJaHqOdEfGuVxY3NkMLzPoWX5weetr",
      expectedError: "Constant name has exceeded 50 characters",
    },
    {
      type: "value",
      value: " ",
      expectedError: commonText.constantsValueError,
    },
    {
      type: "name",
      value: "Xk4jY2mLn8pQsZ9Rt6vBc7wJaHqOdEfGuVxY3NkMLzPoWX5wee",
      expectedError: "Maximum length has been reached",
    },
  ];

  cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
  validationTests.forEach(({ type, value, expectedError }) => {
    contantsNameValidation(
      selectorMap[type].input,
      value,
      selectorMap[type].error,
      expectedError
    );
    cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");
  });
  cy.get(commonSelectors.cancelButton).click();
};

export const constantsCRUDAndValidations = (data) => {
  cy.get('[data-cy="home-page-icon"]').click();
  cy.wait(500);
  cy.get(commonSelectors.workspaceConstantsIcon).click();
  selectEnv(data.envName);
  switchToConstantTab(data.constantType);
  // VerifyEmptyScreenUI(data.envName);
  cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
  cy.get(workspaceConstantsSelectors.contantFormTitle).verifyVisibleElement(
    "have.text",
    workspaceConstantsText.addConstatntText(data.envName.toLowerCase())
  );

  cy.clearAndType(commonSelectors.workspaceConstantNameInput, data.constName);
  cy.get(commonSelectors.workspaceConstantValueInput)
    .click()
    .clear()
    .type("text");
  cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");
  cy.get(workspaceConstantsSelectors.constantsType(data.constantType)).check();

  cy.get(workspaceConstantsSelectors.addConstantButton).should("be.enabled");
  cy.get(commonSelectors.cancelButton).click();

  addAndVerifyConstants(data.constName, data.constName, data.constantType);

  const type = data.constantType;
  const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);

  if (type === "Global" || type === "Secrets") {
    const expectedToast =
      type === "Global"
        ? workspaceConstantsText.constantCreatedToast(typeCapitalized)
        : workspaceConstantsText.secretConstantCreatedToast;

    const expectedInfoText =
      type === "Global"
        ? "To resolve a global workspace constant use {{constants.access_token}}Read documentation"
        : "To resolve a secret workspace constant use {{secrets.access_token}}Read documentation";

    cy.verifyToastMessage(commonSelectors.toastMessage, expectedToast, false);
    cy.get(workspaceConstantsSelectors.alertInfoText).should(
      "have.text",
      expectedInfoText
    );
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
  cy.get(commonSelectors.workspaceConstantValueInput)
    .click()
    .clear()
    .type(data.constName);
  cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");

  //update different value
  cy.clearAndType(
    commonSelectors.workspaceConstantValueInput,
    data.newConstvalue
  );
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
  cy.get(workspaceConstantsSelectors.constDeleteButton(data.constName)).click();
  cy.get(commonSelectors.modalMessage).verifyVisibleElement(
    "have.text",
    `Are you sure you want to delete ${data.constName} from ${data.envName.toLowerCase()}?`
  );
  cy.get(commonSelectors.cancelButton).click();
  cy.get(workspaceConstantsSelectors.constantValue(data.constName)).should(
    "exist"
  );
  cy.get(workspaceConstantsSelectors.constDeleteButton(data.constName)).click();
  cy.get(commonSelectors.yesButton).click();
  cy.get(workspaceConstantsSelectors.constantValue(data.constName)).should(
    "not.exist"
  );
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    "Constant deleted successfully"
  );
  cy.get(workspaceConstantsSelectors.constantName(name)).should("not.exist");
};

export const VerifyEmptyScreenUI = (envName) => {
  cy.get(workspaceConstantsSelectors.emptyStateImage).should("be.visible");
  cy.get(workspaceConstantsSelectors.emptyStateHeader).verifyVisibleElement(
    "have.text",
    workspaceConstantsText.emptyStateHeader
  );
  cy.get(workspaceConstantsSelectors.emptyStateText).should(
    "have.text",
    workspaceConstantsText.emptyStateText
  );
  cy.get(workspaceConstantsSelectors.tableAddNewConstButton).should(
    "be.visible"
  );

  cy.get(workspaceConstantsSelectors.envName).should(
    "have.text",
    `${envName} (8)`
  );
};

export const selectEnv = (envName) => {
  cy.get(`[data-cy="${envName.toLowerCase()}-list-item"]`).click({
    force: true,
  });
};

export const createAndUpdateConstant = (
  name,
  value,
  types,
  envs,
  updates = {}
) =>
  cy.apiCreateWorkspaceConstant(name, value, types, envs).then((res) => {
    const id = res.body.constant.id;
    Object.entries(updates).forEach(([updateEnv, updateValue]) => {
      cy.apiUpdateWsConstant(id, updateValue, updateEnv);
    });
  });

export const verifyInputValues = (
  start,
  end,
  expectedValue,
  timeout = 10000
) => {
  for (let i = start; i <= end; i++) {
    cy.wait(500);
    cy.get(
      commonWidgetSelector.draggableWidget(`textinput${i}`)
    ).verifyVisibleElement("have.value", expectedValue, { timeout });
  }
};

export const importConstantsApp = (filePath, app = true) => {
  cy.get(importSelectors.dropDownMenu)
    .should("be.visible")
    .click({ force: true });
  cy.get(importSelectors.importOptionInput).eq(0).selectFile(filePath, {
    force: true,
  });
  if (app) {
    cy.get(importSelectors.importAppButton).click();
    cy.get('[data-cy="draggable-widget-textinput1"]').should("be.visible");
    cy.wait(3000);
  } else {
    cy.get(workflowSelector.importWorkFlowsButton).click();
    cy.wait(3000);
  }
};

export const verifySecretConstantNotResolved = (inputWidget) => {
  cy.openComponentSidebar();
  cy.get(commonWidgetSelector.draggableWidget(inputWidget))
    .verifyVisibleElement("have.value", "")
    .click();
};

export const verifyGlobalConstInStaticQuery = (selector, expected) => {
  cy.get(selector).click();
  cy.get(".rest-api-methods-select-element-container .codehinter-container")
    .eq(0)
    .click();
  cy.wait(500);
  cy.get(".text-secondary").should("have.text", expected);
};

export const verifyStaticQueryPreview = (selector, expected) => {
  cy.get(selector).click();
  cy.get(dataSourceSelector.queryPreviewButton).click();
  cy.get(dataSourceSelector.previewJsonDataContainer).should(
    "contain.text",
    expected
  );
};

export const verifySecretInStaticQueryRaw = (selector) => {
  cy.get(selector).click();
  cy.get(dataSourceSelector.queryPreviewButton).click();
  cy.get(dataSourceSelector.previewTabRaw).click();
  cy.get(dataSourceSelector.previewTabRawContainer).contains(
    "secrets is not defined"
  );
};

export const previewAppAndVerify = (start, end, expectedValue) => {
  cy.openInCurrentTab(commonWidgetSelector.previewButton);
  cy.wait(3000);
  cy.get(commonWidgetSelector.draggableWidget("textinput1")).should(
    "be.visible"
  );
  for (let i = end; i >= start; i--) {
    cy.wait(500);
    cy.get(
      commonWidgetSelector.draggableWidget(`textinput${i}`)
    ).verifyVisibleElement("have.value", expectedValue, { timeout: 10000 });
  }
  cy.go("back");
  cy.wait(2000);
};

export const promoteEnvAndVerify = (
  fromEnv,
  toEnv,
  start,
  end,
  expectedValue
) => {
  appPromote(fromEnv, toEnv);
  cy.wait(2000);
  cy.get(".released-version-popup-container").invoke("css", "display", "none");
  cy.get(
    commonWidgetSelector.draggableWidget("textinput1")
  ).verifyVisibleElement("have.value", "customHeader");
  verifyInputValues(start, end, expectedValue);
  verifySecretConstantNotResolved("textinput2");
  previewAppAndVerify(start, end, expectedValue);
};

export const assertTooltipText = (selector, expected) => {
  cy.get(selector).closest("td").trigger("mouseover");
  cy.get(".tooltip-inner")
    .last()
    .should(($el) => {
      const plainText = $el.text().replace(/\s+/g, " ").trim();
      expect(plainText).to.eq(expected);
    });
};
