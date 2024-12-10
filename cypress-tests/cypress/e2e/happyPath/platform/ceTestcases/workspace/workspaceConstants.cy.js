import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";
import { commonText, commonWidgetText } from "Texts/common";
import * as common from "Support/utils/common";
import {
    contantsNameValidation,
    AddNewconstants,
    existingNameValidation,
} from "Support/utils/workspaceConstants";
import { buttonText } from "Texts/button";
import { editAndVerifyWidgetName } from "Support/utils/commonWidget";
import {
    verifypreview,
    createDataQuery,
    createrestAPIQuery,
} from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import {
    selectQueryFromLandingPage,
    query,
    addInputOnQueryField,
} from "Support/utils/queries";

const data = {};

describe("Workspace constants", () => {
    const envVar = Cypress.env("environment");
    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        // cy.intercept("GET", "/api/library_apps", "homePage");
        cy.skipWalkthrough();
    });
    it("Verify workspace constants UI and CRUD operations", () => {
        data.constName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.newConstvalue = `New ${data.constName}`;
        data.constantsName = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");
        data.constantsValue = "dJ_8Q~BcaMPd";
        data.appName = `${fake.companyName}-App`;
        data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

        cy.get(commonSelectors.workspaceConstantsIcon).click();

        cy.get(commonSelectors.pageSectionHeader).verifyVisibleElement(
            "have.text",
            "Workspace constants"
        );

        cy.get(
            workspaceConstantsSelectors.workspaceConstantsHelperText
        ).verifyVisibleElement(
            "have.text",
            workspaceConstantsText.workspaceConstantsHelperText
        );

        cy.get(commonSelectors.documentationLink).verifyVisibleElement(
            "have.text",
            "Read documentation"
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
            .should("eq", "Enter constant name");
        cy.get(commonSelectors.nameInputField).should("be.visible");
        cy.get(commonSelectors.valueLabel).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Value");
        });
        cy.get('[data-cy="form-encrypted-label"]')
            .verifyVisibleElement("have.text", "Encrypted");
        cy.get(commonSelectors.valueInputField)
            .invoke("attr", "placeholder")
            .should("eq", "Enter value");
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
            "Xk4jY2mLn8pQsZ9Rt6vBc7wJaHqOdEfGuVxY3NkMLzPoWX5wee",
            "Maximum length has been reached"
        );
        contantsNameValidation(
            "Xk4jY2mLn8pQsZ9Rt6vBc7wJaHqOdEfGuVxY3NkMLzPoWX5weetr",
            "Constant name has exceeded 50 characters"
        );

        cy.get(commonSelectors.valueInputField).click();
        cy.clearAndType(commonSelectors.valueInputField, " ");
        cy.get(commonSelectors.valueErrorText).verifyVisibleElement(
            "have.text",
            commonText.constantsValueError
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();

        cy.clearAndType(commonSelectors.nameInputField, data.constName);
        cy.get(commonSelectors.valueInputField).click();
        cy.clearAndType(commonSelectors.valueInputField, data.constName);
        cy.get(workspaceConstantsSelectors.constantsType("global")).check();
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.enabled");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(workspaceConstantsSelectors.constantName(data.constName)).should(
            "not.exist"
        );

        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
        cy.clearAndType(commonSelectors.nameInputField, data.constName);
        cy.get(commonSelectors.valueInputField).click();
        cy.clearAndType(commonSelectors.valueInputField, data.constName);
        cy.get(workspaceConstantsSelectors.constantsType("global")).check();
        cy.get(workspaceConstantsSelectors.addConstantButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            workspaceConstantsText.constantCreatedToast("Global")
        );

        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
        existingNameValidation(data.constName, "test");
        cy.get(commonSelectors.cancelButton).click();

        cy.get(workspaceConstantsSelectors.envName).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Production");
        });
        cy.get(
            workspaceConstantsSelectors.addNewConstantButton
        ).verifyVisibleElement("have.text", "+ Create new constant");
        cy.get(
            workspaceConstantsSelectors.constantsTableNameHeader
        ).verifyVisibleElement("have.text", "Name");
        cy.get(
            workspaceConstantsSelectors.constantsTableValueHeader
        ).verifyVisibleElement("have.text", "Value");
        cy.get(
            workspaceConstantsSelectors.constantName(data.constName)
        ).verifyVisibleElement("have.text", data.constName);

        cy.get(workspaceConstantsSelectors.constHideButton(data.constName)).click();
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
        cy.get(commonSelectors.valueLabel).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Value");
        });
        cy.get(commonSelectors.valueInputField)
            .click()
            .should("be.visible")
            .and("have.value", data.constName);
        // cy.get(commonSelectors.valueInputField)

        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).verifyVisibleElement(
            "have.text",
            "Update"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");

        cy.get(commonSelectors.valueInputField).click();
        cy.clearAndType(commonSelectors.valueInputField, data.newConstvalue);
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.enabled");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(
            workspaceConstantsSelectors.constantValue(data.constName)
        ).verifyVisibleElement("have.text", data.constName);

        cy.get(workspaceConstantsSelectors.constEditButton(data.constName)).click();
        cy.get(commonSelectors.valueInputField).click();
        cy.clearAndType(commonSelectors.valueInputField, data.newConstvalue);
        cy.get(workspaceConstantsSelectors.addConstantButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Constant updated successfully"
        );

        cy.get(workspaceConstantsSelectors.constantValue(data.constName))
            .should("be.visible")
            .and("have.text", data.newConstvalue);
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

    //Fix after app builder 
    it.skip("should verify the constants resolving value on components and query", () => {
        cy.viewport(1200, 1300);

        data.widgetName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.appName = `${fake.companyName}-App`;
        data.restapilink = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.restapiHeaderKey = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");
        data.restapiHeaderValue = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");

        cy.get(commonSelectors.workspaceConstantsIcon).click();
        AddNewconstants(data.restapilink, Cypress.env("constants_host"));
        AddNewconstants(data.restapiHeaderKey, "customHeader");
        AddNewconstants(data.restapiHeaderValue, "key=value");

        cy.apiCreateApp(data.appName);

        cy.wait(1000);
        createDataQuery(
            data.appName,
            data.restapilink,
            data.restapiHeaderKey,
            data.restapiHeaderValue
        );
        cy.openApp();

        cy.get(".custom-toggle-switch>.switch>").eq(3).click();

        cy.waitForAutoSave();
        cy.dragAndDropWidget("Text Input", 550, 650);
        editAndVerifyWidgetName(data.widgetName, []);
        cy.waitForAutoSave();

        cy.get('[data-cy="default-value-input-field"]').clearAndTypeOnCodeMirror(
            `{{queries.restapi1.data.message`
        );
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.value", "Production environment testing");

        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.wait(4000);

        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.value", "Production environment testing");
    });
    it.skip("should verify the constants resolving in datasource connection form", () => {
        data.ds = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

        data.widgetName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.appName = `${fake.companyName}-App`;
        data.restapilink = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.restapiHeaderKey = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");
        data.restapiHeaderValue = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");

        cy.get(commonSelectors.workspaceConstantsIcon).click();
        AddNewconstants(data.restapilink, Cypress.env("constants_host"));
        AddNewconstants(data.restapiHeaderKey, "customHeader");
        AddNewconstants(data.restapiHeaderValue, "key=value");
        cy.apiCreateGDS(
            `${Cypress.env("server_host")}/api/v2/data_sources`,
            data.ds,
            "restapi",
            [
                { key: "url", value: `{{constants.${data.restapilink}}}` },
                { key: "auth_type", value: "none" },
                { key: "grant_type", value: "authorization_code" },
                { key: "add_token_to", value: "header" },
                { key: "header_prefix", value: "Bearer " },
                { key: "access_token_url", value: "" },
                { key: "client_ide", value: "" },
                { key: "client_secret", value: "", encrypted: true },
                { key: "scopes", value: "read, write" },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true },
                { key: "bearer_token", value: "", encrypted: true },
                { key: "auth_url", value: "" },
                { key: "client_auth", value: "header" },
                { key: "headers", value: [["", ""]] },
                { key: "custom_query_params", value: [["", ""]], encrypted: false },
                { key: "custom_auth_params", value: [["", ""]] },
                {
                    key: "access_token_custom_headers",
                    value: [["", ""]],
                    encrypted: false,
                },
                { key: "multiple_auth_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
            ]
        );
        cy.apiCreateApp(data.appName);

        cy.getCookie("tj_auth_token").then((cookie) => {
            const headers = {
                "Tj-Workspace-Id": Cypress.env("workspaceId"),
                Cookie: `tj_auth_token=${cookie.value}`,
            };
            cy.request({
                method: "GET",
                url: `${Cypress.env("server_host")}/api/app-environments/versions?app_id=${Cypress.env(
                    "appId"
                )}`,
                headers: headers,
            }).then((response) => {
                const appVersions = response.body.appVersions;
                const appVersionId = appVersions[0].id;
                createrestAPIQuery({
                    app_id: Cypress.env("appId"),
                    app_version_id: appVersionId,
                    name: data.ds,
                    key: data.restapiHeaderKey,
                    value: data.restapiHeaderValue,
                });
            });
        });

        cy.openApp();

        cy.get(".custom-toggle-switch>.switch>").eq(3).click();

        cy.waitForAutoSave();
        cy.dragAndDropWidget("Text", 550, 650);
        editAndVerifyWidgetName(data.widgetName, []);
        cy.waitForAutoSave();

        cy.get(
            '[data-cy="textcomponenttextinput-input-field"]'
        ).clearAndTypeOnCodeMirror(`{{queries.${data.ds}.data.message`);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "Production environment testing");

        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.wait(4000);

        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "Production environment testing");
    });
});
