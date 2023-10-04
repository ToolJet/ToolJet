import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";
import { commonText, commonWidgetText } from "Texts/common";
import * as common from "Support/utils/common";
import { multiEnvSelector, commonEeSelectors } from "Selectors/eeCommon";
import { promoteApp, releaseApp, launchApp } from "Support/utils/multiEnv"
import {
    contantsNameValidation,
    AddNewconstants,
} from "Support/utils/workspaceConstants";
import { buttonText } from "Texts/button";
import {
    verifyAndModifyParameter,
    editAndVerifyWidgetName,
} from "Support/utils/commonWidget";
import { verifypreview } from "Support/utils/dataSource";

import {
    selectQueryFromLandingPage,
    query,
    addInputOnQueryField,
} from "Support/utils/queries";


const data = {};
data.constName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.newConstvalue = `New ${data.constName}`;
data.constantsName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.constantsValue = "dJ_8Q~BcaMPd";
data.appName = `${fake.companyName}-App`;
data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

describe("Workspace constants", () => {
    const envVar = Cypress.env("environment");
    beforeEach(() => {
        cy.appUILogin();
        cy.intercept("GET", "/api/library_apps").as("homePage");
    });

    it("Verify workspace constants UI and CRUD operations on development", () => {
        cy.get(commonSelectors.workspaceSettingsIcon).click();
        cy.get(commonSelectors.workspaceConstantsOption)
            .should(($el) => {
                expect($el.contents().first().text().trim()).to.eq(
                    "Workspace constants"
                );
            })
            .click();

        cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Workspace settings");
        });
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " Workspace constants"
        );

        cy.get(
            workspaceConstantsSelectors.workspaceConstantsHelperText
        ).verifyVisibleElement(
            "have.text",
            workspaceConstantsText.workspaceConstantsHelperText
        );

        cy.get(commonSelectors.documentationLink).verifyVisibleElement(
            "have.text",
            commonText.documentationLink
        );

        cy.wait(1000)
        cy.get("body").then(($body) => {
            if ($body.find(workspaceConstantsSelectors.emptyStateImage).length > 0) {
                cy.get(workspaceConstantsSelectors.emptyStateImage).should(
                    "be.visible"
                );
                cy.get(
                    workspaceConstantsSelectors.emptyStateHeader
                ).verifyVisibleElement(
                    "have.text",
                    workspaceConstantsText.emptyStateHeader
                );
                cy.get(workspaceConstantsSelectors.emptyStateText).verifyVisibleElement(
                    "have.text",
                    workspaceConstantsText.emptyStateText
                );
                cy.get(
                    workspaceConstantsSelectors.addNewConstantButton
                ).verifyVisibleElement(
                    "have.text",
                    workspaceConstantsText.addNewConstantButton
                );
            }
        });
        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
        cy.get(workspaceConstantsSelectors.contantFormTitle).verifyVisibleElement(
            "have.text",
            'Add new constant in development '
        );
        cy.get(commonSelectors.nameLabel).verifyVisibleElement("have.text", "Name");
        cy.get(commonSelectors.nameInputField)
            .invoke("attr", "placeholder")
            .should("eq", "Enter Constant Name");
        cy.get(commonSelectors.nameInputField).should("be.visible");
        cy.get(commonSelectors.valueLabel).verifyVisibleElement(
            "have.text",
            "Value"
        );
        cy.get(commonSelectors.valueInputField)
            .invoke("attr", "placeholder")
            .should("eq", "Enter Value");
        cy.get(commonSelectors.valueInputField).should("be.visible");
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).verifyVisibleElement(
            "have.text",
            "Add constant"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");

        contantsNameValidation(" ", commonText.constantsNameError);
        contantsNameValidation("9", commonText.constantsNameError);
        contantsNameValidation("%", commonText.constantsNameError);
        contantsNameValidation(
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`a",
            "Maximum length has been reached"
        );
        contantsNameValidation(
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`afgg",
            "Constant name should be between 1 and 32 characters"
        );

        cy.clearAndType(commonSelectors.valueInputField, " ");
        cy.get(commonSelectors.valueErrorText).verifyVisibleElement(
            "have.text",
            commonText.constantsValueError
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();

        cy.clearAndType(commonSelectors.nameInputField, data.constName);
        cy.clearAndType(commonSelectors.valueInputField, data.constName);
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.enabled");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(workspaceConstantsSelectors.constantName(data.constName)).should(
            "not.exist"
        );

        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
        cy.clearAndType(commonSelectors.nameInputField, data.constName);
        cy.clearAndType(commonSelectors.valueInputField, data.constName);
        cy.get(workspaceConstantsSelectors.addConstantButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            workspaceConstantsText.constantCreatedToast
        );

        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
        contantsNameValidation(
            data.constName,
            "Constant with this name already exists in Development environment"
        );
        cy.get(commonSelectors.cancelButton).click();

        cy.get(workspaceConstantsSelectors.envName).verifyVisibleElement(
            "have.text",
            "Development"
        );
        cy.get(
            workspaceConstantsSelectors.addNewConstantButton
        ).verifyVisibleElement("have.text", "Create new constant");
        cy.get(
            workspaceConstantsSelectors.constantsTableNameHeader
        ).verifyVisibleElement("have.text", "Name");
        cy.get(
            workspaceConstantsSelectors.constantsTableValueHeader
        ).verifyVisibleElement("have.text", "Value");
        cy.get(
            workspaceConstantsSelectors.constantName(data.constName)
        ).verifyVisibleElement("have.text", data.constName);
        cy.get(
            workspaceConstantsSelectors.constantValue(data.constName)
        ).verifyVisibleElement("have.text", data.constName);
        cy.get(
            workspaceConstantsSelectors.constEditButton(data.constName)
        ).verifyVisibleElement("have.text", "Edit");
        cy.get(
            workspaceConstantsSelectors.constDeleteButton(data.constName)
        ).verifyVisibleElement("have.text", "Delete");
        cy.get(commonSelectors.pagination).should("be.visible");

        cy.get(workspaceConstantsSelectors.constEditButton(data.constName)).click();

        cy.get(workspaceConstantsSelectors.contantFormTitle).verifyVisibleElement(
            "have.text",
            "Update constant in development "
        );
        cy.get(commonSelectors.nameLabel).verifyVisibleElement("have.text", "Name");
        cy.get(commonSelectors.nameInputField).should("have.value", data.constName);
        cy.get(commonSelectors.nameInputField)
            .should("be.visible")
            .and("be.disabled");
        cy.get(commonSelectors.valueLabel).verifyVisibleElement(
            "have.text",
            "Value"
        );
        cy.get(commonSelectors.valueInputField)
            .should("be.visible")
            .and("have.value", data.constName);
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).verifyVisibleElement(
            "have.text",
            "Update"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");

        cy.clearAndType(commonSelectors.valueInputField, data.newConstvalue);
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.enabled");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(
            workspaceConstantsSelectors.constantValue(data.constName)
        ).verifyVisibleElement("have.text", data.constName);

        cy.get(workspaceConstantsSelectors.constEditButton(data.constName)).click();
        cy.clearAndType(commonSelectors.valueInputField, data.newConstvalue);
        cy.get(workspaceConstantsSelectors.addConstantButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Constant updated successfully"
        );
        cy.get(
            workspaceConstantsSelectors.constantValue(data.constName)
        ).verifyVisibleElement("have.text", data.newConstvalue);

        cy.get(
            workspaceConstantsSelectors.constDeleteButton(data.constName)
        ).click();
        cy.get(commonSelectors.modalMessage).verifyVisibleElement(
            "have.text",
            `Are you sure you want to delete ${data.constName} from development?`
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(commonSelectors.yesButton).verifyVisibleElement("have.text", "Yes");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(
            workspaceConstantsSelectors.constantValue(data.constName)
        ).verifyVisibleElement("have.text", data.newConstvalue);

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
    });

    it("Verify workspace constants UI and CRUD operations on staging", () => {
        cy.get(commonSelectors.workspaceSettingsIcon).click();
        cy.get(commonSelectors.workspaceConstantsOption)
            .should(($el) => {
                expect($el.contents().first().text().trim()).to.eq(
                    "Workspace constants"
                );
            })
            .click();
        cy.get('[data-cy="left-menu-items tj-text-xsm"] > :nth-child(2)').click()

        cy.get(
            workspaceConstantsSelectors.workspaceConstantsHelperText
        ).verifyVisibleElement(
            "have.text",
            workspaceConstantsText.workspaceConstantsHelperText
        );

        cy.get(commonSelectors.documentationLink).verifyVisibleElement(
            "have.text",
            commonText.documentationLink
        );

        cy.wait(1000)
        cy.get("body").then(($body) => {
            if ($body.find(workspaceConstantsSelectors.emptyStateImage).length > 0) {
                cy.get(workspaceConstantsSelectors.emptyStateImage).should(
                    "be.visible"
                );
                cy.get(
                    workspaceConstantsSelectors.emptyStateHeader
                ).verifyVisibleElement(
                    "have.text",
                    workspaceConstantsText.emptyStateHeader
                );
                cy.get(workspaceConstantsSelectors.emptyStateText).verifyVisibleElement(
                    "have.text",
                    workspaceConstantsText.emptyStateText
                );
                cy.get(
                    workspaceConstantsSelectors.addNewConstantButton
                ).verifyVisibleElement(
                    "have.text",
                    workspaceConstantsText.addNewConstantButton
                );
            }
        });
        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
        cy.get(workspaceConstantsSelectors.contantFormTitle).verifyVisibleElement(
            "have.text",
            'Add new constant in staging '
        );
        cy.get(commonSelectors.nameLabel).verifyVisibleElement("have.text", "Name");
        cy.get(commonSelectors.nameInputField)
            .invoke("attr", "placeholder")
            .should("eq", "Enter Constant Name");
        cy.get(commonSelectors.nameInputField).should("be.visible");
        cy.get(commonSelectors.valueLabel).verifyVisibleElement(
            "have.text",
            "Value"
        );
        cy.get(commonSelectors.valueInputField)
            .invoke("attr", "placeholder")
            .should("eq", "Enter Value");
        cy.get(commonSelectors.valueInputField).should("be.visible");
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).verifyVisibleElement(
            "have.text",
            "Add constant"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");

        contantsNameValidation(" ", commonText.constantsNameError);
        contantsNameValidation("9", commonText.constantsNameError);
        contantsNameValidation("%", commonText.constantsNameError);
        contantsNameValidation(
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`a",
            "Maximum length has been reached"
        );
        contantsNameValidation(
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`afgg",
            "Constant name should be between 1 and 32 characters"
        );

        cy.clearAndType(commonSelectors.valueInputField, " ");
        cy.get(commonSelectors.valueErrorText).verifyVisibleElement(
            "have.text",
            commonText.constantsValueError
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();

        cy.clearAndType(commonSelectors.nameInputField, data.constName);
        cy.clearAndType(commonSelectors.valueInputField, data.constName);
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.enabled");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(workspaceConstantsSelectors.constantName(data.constName)).should(
            "not.exist"
        );

        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
        cy.clearAndType(commonSelectors.nameInputField, data.constName);
        cy.clearAndType(commonSelectors.valueInputField, data.constName);
        cy.get(workspaceConstantsSelectors.addConstantButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            workspaceConstantsText.constantCreatedToast
        );

        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
        contantsNameValidation(
            data.constName,
            "Constant with this name already exists in Staging environment"
        );
        cy.get(commonSelectors.cancelButton).click();

        cy.get(workspaceConstantsSelectors.envName).verifyVisibleElement(
            "have.text",
            "Staging"
        );
        cy.get(
            workspaceConstantsSelectors.addNewConstantButton
        ).verifyVisibleElement("have.text", "Create new constant");
        cy.get(
            workspaceConstantsSelectors.constantsTableNameHeader
        ).verifyVisibleElement("have.text", "Name");
        cy.get(
            workspaceConstantsSelectors.constantsTableValueHeader
        ).verifyVisibleElement("have.text", "Value");
        cy.get(
            workspaceConstantsSelectors.constantName(data.constName)
        ).verifyVisibleElement("have.text", data.constName);
        cy.get(
            workspaceConstantsSelectors.constantValue(data.constName)
        ).verifyVisibleElement("have.text", data.constName);
        cy.get(
            workspaceConstantsSelectors.constEditButton(data.constName)
        ).verifyVisibleElement("have.text", "Edit");
        cy.get(
            workspaceConstantsSelectors.constDeleteButton(data.constName)
        ).verifyVisibleElement("have.text", "Delete");
        cy.get(commonSelectors.pagination).should("be.visible");

        cy.get(workspaceConstantsSelectors.constEditButton(data.constName)).click();

        cy.get(workspaceConstantsSelectors.contantFormTitle).verifyVisibleElement(
            "have.text",
            "Update constant in staging "
        );
        cy.get(commonSelectors.nameLabel).verifyVisibleElement("have.text", "Name");
        cy.get(commonSelectors.nameInputField).should("have.value", data.constName);
        cy.get(commonSelectors.nameInputField)
            .should("be.visible")
            .and("be.disabled");
        cy.get(commonSelectors.valueLabel).verifyVisibleElement(
            "have.text",
            "Value"
        );
        cy.get(commonSelectors.valueInputField)
            .should("be.visible")
            .and("have.value", data.constName);
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).verifyVisibleElement(
            "have.text",
            "Update"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");

        cy.clearAndType(commonSelectors.valueInputField, data.newConstvalue);
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.enabled");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(
            workspaceConstantsSelectors.constantValue(data.constName)
        ).verifyVisibleElement("have.text", data.constName);

        cy.get(workspaceConstantsSelectors.constEditButton(data.constName)).click();
        cy.clearAndType(commonSelectors.valueInputField, data.newConstvalue);
        cy.get(workspaceConstantsSelectors.addConstantButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Constant updated successfully"
        );
        cy.get(
            workspaceConstantsSelectors.constantValue(data.constName)
        ).verifyVisibleElement("have.text", data.newConstvalue);

        cy.get(
            workspaceConstantsSelectors.constDeleteButton(data.constName)
        ).click();
        cy.get(commonSelectors.modalMessage).verifyVisibleElement(
            "have.text",
            `Are you sure you want to delete ${data.constName} from staging?`
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(commonSelectors.yesButton).verifyVisibleElement("have.text", "Yes");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(
            workspaceConstantsSelectors.constantValue(data.constName)
        ).verifyVisibleElement("have.text", data.newConstvalue);

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
    });

    it("Verify workspace constants UI and CRUD operations on production", () => {
        cy.get(commonSelectors.workspaceSettingsIcon).click();
        cy.get(commonSelectors.workspaceConstantsOption)
            .should(($el) => {
                expect($el.contents().first().text().trim()).to.eq(
                    "Workspace constants"
                );
            })
            .click();
        cy.get('[data-cy="left-menu-items tj-text-xsm"] > :nth-child(3)').click()

        cy.get(
            workspaceConstantsSelectors.workspaceConstantsHelperText
        ).verifyVisibleElement(
            "have.text",
            workspaceConstantsText.workspaceConstantsHelperText
        );

        cy.get(commonSelectors.documentationLink).verifyVisibleElement(
            "have.text",
            commonText.documentationLink
        );

        cy.get("body").then(($body) => {
            if ($body.find(workspaceConstantsSelectors.emptyStateImage).length > 0) {
                cy.get(workspaceConstantsSelectors.emptyStateImage).should(
                    "be.visible"
                );
                cy.get(
                    workspaceConstantsSelectors.emptyStateHeader
                ).verifyVisibleElement(
                    "have.text",
                    workspaceConstantsText.emptyStateHeader
                );
                cy.get(workspaceConstantsSelectors.emptyStateText).verifyVisibleElement(
                    "have.text",
                    workspaceConstantsText.emptyStateText
                );
                cy.get(
                    workspaceConstantsSelectors.addNewConstantButton
                ).verifyVisibleElement(
                    "have.text",
                    workspaceConstantsText.addNewConstantButton
                );
            }
        });
        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
        cy.get(workspaceConstantsSelectors.contantFormTitle).verifyVisibleElement(
            "have.text",
            workspaceConstantsText.addConstatntText
        );
        cy.get(commonSelectors.nameLabel).verifyVisibleElement("have.text", "Name");
        cy.get(commonSelectors.nameInputField)
            .invoke("attr", "placeholder")
            .should("eq", "Enter Constant Name");
        cy.get(commonSelectors.nameInputField).should("be.visible");
        cy.get(commonSelectors.valueLabel).verifyVisibleElement(
            "have.text",
            "Value"
        );
        cy.get(commonSelectors.valueInputField)
            .invoke("attr", "placeholder")
            .should("eq", "Enter Value");
        cy.get(commonSelectors.valueInputField).should("be.visible");
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).verifyVisibleElement(
            "have.text",
            "Add constant"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");

        contantsNameValidation(" ", commonText.constantsNameError);
        contantsNameValidation("9", commonText.constantsNameError);
        contantsNameValidation("%", commonText.constantsNameError);
        contantsNameValidation(
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`a",
            "Maximum length has been reached"
        );
        contantsNameValidation(
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`afgg",
            "Constant name should be between 1 and 32 characters"
        );

        cy.clearAndType(commonSelectors.valueInputField, " ");
        cy.get(commonSelectors.valueErrorText).verifyVisibleElement(
            "have.text",
            commonText.constantsValueError
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();

        cy.clearAndType(commonSelectors.nameInputField, data.constName);
        cy.clearAndType(commonSelectors.valueInputField, data.constName);
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.enabled");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(workspaceConstantsSelectors.constantName(data.constName)).should(
            "not.exist"
        );

        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
        cy.clearAndType(commonSelectors.nameInputField, data.constName);
        cy.clearAndType(commonSelectors.valueInputField, data.constName);
        cy.get(workspaceConstantsSelectors.addConstantButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            workspaceConstantsText.constantCreatedToast
        );

        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
        contantsNameValidation(
            data.constName,
            "Constant with this name already exists in Production environment"
        );
        cy.get(commonSelectors.cancelButton).click();

        cy.get(workspaceConstantsSelectors.envName).verifyVisibleElement(
            "have.text",
            "Production"
        );
        cy.get(
            workspaceConstantsSelectors.addNewConstantButton
        ).verifyVisibleElement("have.text", "Create new constant");
        cy.get(
            workspaceConstantsSelectors.constantsTableNameHeader
        ).verifyVisibleElement("have.text", "Name");
        cy.get(
            workspaceConstantsSelectors.constantsTableValueHeader
        ).verifyVisibleElement("have.text", "Value");
        cy.get(
            workspaceConstantsSelectors.constantName(data.constName)
        ).verifyVisibleElement("have.text", data.constName);
        cy.get(
            workspaceConstantsSelectors.constantValue(data.constName)
        ).verifyVisibleElement("have.text", data.constName);
        cy.get(
            workspaceConstantsSelectors.constEditButton(data.constName)
        ).verifyVisibleElement("have.text", "Edit");
        cy.get(
            workspaceConstantsSelectors.constDeleteButton(data.constName)
        ).verifyVisibleElement("have.text", "Delete");
        cy.get(commonSelectors.pagination).should("be.visible");

        cy.get(workspaceConstantsSelectors.constEditButton(data.constName)).click();

        cy.get(workspaceConstantsSelectors.contantFormTitle).verifyVisibleElement(
            "have.text",
            "Update constant in production "
        );
        cy.get(commonSelectors.nameLabel).verifyVisibleElement("have.text", "Name");
        cy.get(commonSelectors.nameInputField).should("have.value", data.constName);
        cy.get(commonSelectors.nameInputField)
            .should("be.visible")
            .and("be.disabled");
        cy.get(commonSelectors.valueLabel).verifyVisibleElement(
            "have.text",
            "Value"
        );
        cy.get(commonSelectors.valueInputField)
            .should("be.visible")
            .and("have.value", data.constName);
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).verifyVisibleElement(
            "have.text",
            "Update"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");

        cy.clearAndType(commonSelectors.valueInputField, data.newConstvalue);
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.enabled");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(
            workspaceConstantsSelectors.constantValue(data.constName)
        ).verifyVisibleElement("have.text", data.constName);

        cy.get(workspaceConstantsSelectors.constEditButton(data.constName)).click();
        cy.clearAndType(commonSelectors.valueInputField, data.newConstvalue);
        cy.get(workspaceConstantsSelectors.addConstantButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Constant updated successfully"
        );
        cy.get(
            workspaceConstantsSelectors.constantValue(data.constName)
        ).verifyVisibleElement("have.text", data.newConstvalue);

        cy.get(
            workspaceConstantsSelectors.constDeleteButton(data.constName)
        ).click();
        cy.get(commonSelectors.modalMessage).verifyVisibleElement(
            "have.text",
            `Are you sure you want to delete ${data.constName} from production?`
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(commonSelectors.yesButton).verifyVisibleElement("have.text", "Yes");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(
            workspaceConstantsSelectors.constantValue(data.constName)
        ).verifyVisibleElement("have.text", data.newConstvalue);

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
    });

    it("should verify the constants resolving value on components and query", () => {
        data.constantsName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");

        common.navigateToworkspaceConstants();
        AddNewconstants(data.constantsName, 'Development');
        cy.get('[data-cy="left-menu-items tj-text-xsm"] > :nth-child(2)').click()
        AddNewconstants(data.constantsName, 'Staging');
        cy.get('[data-cy="left-menu-items tj-text-xsm"] > :nth-child(3)').click()
        AddNewconstants(data.constantsName, 'Production');

        cy.get(commonSelectors.homePageLogo).click();
        cy.wait("@homePage");
        cy.createApp();
        cy.renameApp(data.appName);

        selectQueryFromLandingPage("runjs", "JavaScript");
        addInputOnQueryField("runjs", `return constants.${data.constantsName}`);
        query("preview");
        verifypreview("raw", "Development");

        cy.dragAndDropWidget("Text", 550, 350);
        editAndVerifyWidgetName(data.constantsName);
        cy.waitForAutoSave();

        verifyAndModifyParameter("Text", `{{constants.${data.constantsName}`);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();

        common.pinInspector();
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.get(commonWidgetSelector.inspectorNodeComponents).click();
        cy.get(commonWidgetSelector.nodeComponent(data.constantsName)).click();
        cy.get('[data-cy="inspector-node-text"] > .mx-2').verifyVisibleElement(
            "have.text",
            `"Development"`
        );

        cy.get('[data-cy="inspector-node-constants"] > .node-key').click();
        cy.get(`[data-cy="inspector-node-${data.constantsName}"] > .node-key`)
            .eq(1)
            .verifyVisibleElement("have.text", data.constantsName);
        cy.get(
            `[data-cy="inspector-node-${data.constantsName}"] > .mx-2`
        ).verifyVisibleElement("have.text", `"Development"`);

        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.wait(4000);

        cy.get(
            commonWidgetSelector.draggableWidget(data.constantsName)
        ).verifyVisibleElement("have.text", "Development");

        cy.go('back')
        cy.waitForAppLoad();
        cy.wait(1500);

        promoteApp();

        cy.wait(1500)
        query("preview");
        verifypreview("raw", "Staging");

        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.get(commonWidgetSelector.inspectorNodeComponents).click();
        cy.get(commonWidgetSelector.nodeComponent(data.constantsName)).click();
        cy.get('[data-cy="inspector-node-text"] > .mx-2').verifyVisibleElement(
            "have.text",
            `"Staging"`
        );

        cy.get('[data-cy="inspector-node-constants"] > .node-key').click();
        cy.get(`[data-cy="inspector-node-${data.constantsName}"] > .node-key`)
            .eq(1)
            .verifyVisibleElement("have.text", data.constantsName);
        cy.get(
            `[data-cy="inspector-node-${data.constantsName}"] > .mx-2`
        ).verifyVisibleElement("have.text", `"Staging"`);

        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.wait(4000);

        cy.get(
            commonWidgetSelector.draggableWidget(data.constantsName)
        ).verifyVisibleElement("have.text", "Staging");

        cy.go('back')
        cy.waitForAppLoad();
        cy.wait(1500);

        promoteApp();

        cy.wait(1500)
        query("preview");
        verifypreview("raw", "Production");

        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.get(commonWidgetSelector.inspectorNodeComponents).click();
        cy.get(commonWidgetSelector.nodeComponent(data.constantsName)).click();
        cy.get('[data-cy="inspector-node-text"] > .mx-2').verifyVisibleElement(
            "have.text",
            `"Production"`
        );

        cy.get('[data-cy="inspector-node-constants"] > .node-key').click();
        cy.get(`[data-cy="inspector-node-${data.constantsName}"] > .node-key`)
            .eq(1)
            .verifyVisibleElement("have.text", data.constantsName);
        cy.get(
            `[data-cy="inspector-node-${data.constantsName}"] > .mx-2`
        ).verifyVisibleElement("have.text", `"Production"`);

        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.wait(4000);

        cy.get(
            commonWidgetSelector.draggableWidget(data.constantsName)
        ).verifyVisibleElement("have.text", "Production");

        cy.go('back')
        cy.waitForAppLoad();
        cy.wait(2000);

        releaseApp();
        launchApp();

        cy.get(
            commonWidgetSelector.draggableWidget(data.constantsName)
        ).verifyVisibleElement("have.text", "Production");
    });
});
