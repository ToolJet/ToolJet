import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";
import { commonText } from "Texts/common";

const constName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
const newConstvalue = `New ${constName}`;

describe("Workspace constants", () => {
    before(() => {
        cy.appUILogin();
    });
    it("Verify workspace constants UI and CRUD operations", () => {
        cy.get(commonSelectors.workspaceSettingsIcon).click();
        cy.get('[data-cy="workspace-constants-list-item"]')
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
        //add redirection link

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
                cy.get(workspaceConstantsSelectors.addNewConstantButton)
                    .verifyVisibleElement(
                        "have.text",
                        workspaceConstantsText.addNewConstantButton
                    )
                    .click();
                cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
            } else {
                cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
            }
        });

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

        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
        cy.clearAndType(commonSelectors.nameInputField, constName);
        cy.clearAndType(commonSelectors.valueInputField, constName);
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.enabled");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(workspaceConstantsSelectors.constantName(constName)).should(
            "not.exist"
        );

        cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
        cy.clearAndType(commonSelectors.nameInputField, constName);
        cy.clearAndType(commonSelectors.valueInputField, constName);
        cy.get(workspaceConstantsSelectors.addConstantButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            workspaceConstantsText.constantCreatedToast
        );

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
            workspaceConstantsSelectors.constantName(constName)
        ).verifyVisibleElement("have.text", constName);
        cy.get(
            workspaceConstantsSelectors.constantValue(constName)
        ).verifyVisibleElement("have.text", constName);
        cy.get(
            workspaceConstantsSelectors.constEditButton(constName)
        ).verifyVisibleElement("have.text", "Edit");
        cy.get(
            workspaceConstantsSelectors.constDeleteButton(constName)
        ).verifyVisibleElement("have.text", "Delete");
        cy.get(commonSelectors.pagination).should("be.visible");

        cy.get(workspaceConstantsSelectors.constEditButton(constName)).click();

        cy.get(workspaceConstantsSelectors.contantFormTitle).verifyVisibleElement(
            "have.text",
            "Update constant in production "
        );
        cy.get(commonSelectors.nameLabel).verifyVisibleElement("have.text", "Name");
        cy.get(commonSelectors.nameInputField).should("have.value", constName);
        cy.get(commonSelectors.nameInputField)
            .should("be.visible")
            .and("be.disabled");
        cy.get(commonSelectors.valueLabel).verifyVisibleElement(
            "have.text",
            "Value"
        );
        cy.get(commonSelectors.valueInputField)
            .should("be.visible")
            .and("have.value", constName);
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).verifyVisibleElement(
            "have.text",
            "Update"
        );
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");

        cy.clearAndType(commonSelectors.valueInputField, newConstvalue);
        cy.get(workspaceConstantsSelectors.addConstantButton).should("be.enabled");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(
            workspaceConstantsSelectors.constantValue(constName)
        ).verifyVisibleElement("have.text", constName);

        cy.get(workspaceConstantsSelectors.constEditButton(constName)).click();
        cy.clearAndType(commonSelectors.valueInputField, newConstvalue);
        cy.get(workspaceConstantsSelectors.addConstantButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Constant updated successfully"
        );
        cy.get(
            workspaceConstantsSelectors.constantValue(constName)
        ).verifyVisibleElement("have.text", newConstvalue);

        cy.get(workspaceConstantsSelectors.constDeleteButton(constName)).click();
        cy.get(commonSelectors.modalMessage).verifyVisibleElement(
            "have.text",
            `Are you sure you want to delete ${constName} from production?`
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(commonSelectors.yesButton).verifyVisibleElement("have.text", "Yes");
        cy.get(commonSelectors.cancelButton).click();
        cy.get(
            workspaceConstantsSelectors.constantValue(constName)
        ).verifyVisibleElement("have.text", newConstvalue);

        cy.get(workspaceConstantsSelectors.constDeleteButton(constName)).click();
        cy.get(commonSelectors.yesButton).click();
        cy.get(workspaceConstantsSelectors.constantValue(constName)).should(
            "not.exist"
        );

        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Constant deleted successfully"
        );
    });
});
