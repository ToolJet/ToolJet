import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { inviteUser } from "Support/utils/manageUsers";

const data = {};
data.firstName = fake.firstName;
data.workspaceName = `${fake.firstName}-workspace`;
data.workspaceSlug = `${data.workspaceName.toLowerCase()}-slug`;
describe("Workspace", () => {
    before(() => {
        cy.defaultWorkspaceLogin();
    });

    it("Should verify create and edit workspace modal and flow", () => {
        cy.get(commonSelectors.workspaceName).click();
        cy.get(commonSelectors.addWorkspaceButton).click();
        cy.get(dashboardSelector.createWorkspaceTitle).verifyVisibleElement(
            "have.text",
            "Create workspace"
        );
        cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");
        cy.get(dashboardSelector.workspaceNameLabel).verifyVisibleElement(
            "have.text",
            "Workspace name"
        );
        cy.get(commonSelectors.workspaceNameInputField).verifyVisibleElement(
            "have.attr",
            "placeholder",
            "Workspace name"
        );
        cy.get(dashboardSelector.workspaceNameInfoLabel).verifyVisibleElement(
            "have.text",
            "Name must be unique and max 50 characters"
        );
        cy.get(dashboardSelector.slugNameInputLabel).verifyVisibleElement(
            "have.text",
            "Unique workspace slug"
        );
        cy.get(dashboardSelector.workspaceSlugInputField).verifyVisibleElement(
            "have.attr",
            "placeholder",
            "Unique workspace slug"
        );
        cy.get(dashboardSelector.slugInfoLabel).verifyVisibleElement(
            "have.text",
            "URL-friendly 'slug' consists of lowercase letters, numbers, and hyphens"
        );
        cy.get(dashboardSelector.workspaceLinkLabel).verifyVisibleElement(
            "have.text",
            "Workspace link"
        );
        cy.get(dashboardSelector.slugField).verifyVisibleElement(
            "have.text",
            "http://localhost:8082/<workspace-slug>"
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(dashboardSelector.createWorkspaceButton).verifyVisibleElement(
            "have.text",
            "Create workspace"
        );
        cy.get(dashboardSelector.createWorkspaceButton).should("be.disabled");
        cy.get(commonWidgetSelector.modalCloseButton).click();

        cy.get(commonSelectors.workspaceName).click();
        cy.get(commonSelectors.addWorkspaceButton).click();
        cy.get(commonSelectors.workspaceNameInputField).type(" ").clear();
        cy.get(dashboardSelector.workspaceErrorLabel).verifyVisibleElement(
            "have.text",
            "Workspace name can't be empty"
        );

        cy.clearAndType(commonSelectors.workspaceNameInputField, "My workspace");
        cy.get(dashboardSelector.workspaceErrorLabel).verifyVisibleElement(
            "have.text",
            "Name must be unique"
        );

        cy.clearAndType(
            commonSelectors.workspaceNameInputField,
            data.workspaceName
        );
        cy.get(dashboardSelector.createWorkspaceButton).should("be.disabled");

        cy.get(commonSelectors.workspaceNameInputField).clear();
        cy.get(dashboardSelector.workspaceSlugInputField).type(" ").clear();
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Workspace slug can't be empty"
        );

        cy.clearAndType(dashboardSelector.workspaceSlugInputField, " test");
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Cannot contain spaces"
        );

        cy.clearAndType(dashboardSelector.workspaceSlugInputField, "!@#$%_^");
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Special characters are not accepted."
        );

        cy.clearAndType(dashboardSelector.workspaceSlugInputField, "my-workspace");
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Slug must be unique"
        );

        cy.clearAndType(
            dashboardSelector.workspaceSlugInputField,
            data.workspaceSlug
        );
        cy.get(dashboardSelector.slugSuccessLabel).verifyVisibleElement(
            "have.text",
            "Slug accepted!"
        );
        cy.get(dashboardSelector.slugField).verifyVisibleElement(
            "have.text",
            `http://localhost:8082/${data.workspaceSlug}`
        );
        cy.get(dashboardSelector.slugErrorLabel).verifyVisibleElement(
            "have.text",
            "Link updated successfully!"
        );
        cy.get(dashboardSelector.createWorkspaceButton).should("be.disabled");

        cy.clearAndType(dashboardSelector.workspaceSlugInputField, "my-workspace");
        cy.wait(1000);

        cy.clearAndType(
            commonSelectors.workspaceNameInputField,
            data.workspaceName
        );
        cy.wait(1000);
        cy.get(commonSelectors.cancelButton).click();

        cy.wait(2000);
        cy.get(commonSelectors.workspaceName).click();
        cy.get(commonSelectors.addWorkspaceButton).click();
        cy.get(commonSelectors.workspaceNameInputField).verifyVisibleElement(
            "have.attr",
            "placeholder",
            "Workspace name"
        );
        cy.get(dashboardSelector.workspaceSlugInputField).verifyVisibleElement(
            "have.attr",
            "placeholder",
            "Unique workspace slug"
        );
        cy.get(dashboardSelector.createWorkspaceButton).should("be.disabled");

        cy.wait(1000);
        cy.get(commonSelectors.workspaceNameInputField)
            .clear()
            .type(data.workspaceName);
        cy.wait(1000);
        cy.get(dashboardSelector.workspaceSlugInputField)
            .clear()
            .type(data.workspaceSlug);
        cy.wait(4000);
        cy.get(dashboardSelector.createWorkspaceButton)
            .should("be.enabled")
            .click();

        cy.wait(1000);
        cy.get(commonSelectors.workspaceName).verifyVisibleElement(
            "have.text",
            data.workspaceName
        );
        cy.url().should("eq", `http://localhost:8082/${data.workspaceSlug}`);

        cy.get(commonSelectors.workspaceName).click();
        cy.get(commonSelectors.editRectangleIcon).click();

        cy.get(dashboardSelector.editWorkspaceTitle).verifyVisibleElement(
            "have.text",
            "Edit workspace"
        );
        cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");
        cy.get(dashboardSelector.workspaceNameLabel).verifyVisibleElement(
            "have.text",
            "Workspace name"
        );
        cy.get(commonSelectors.workspaceNameInputField).verifyVisibleElement(
            "have.value",
            data.workspaceName
        );
        cy.get(dashboardSelector.workspaceNameInfoLabel).verifyVisibleElement(
            "have.text",
            "Name must be unique and max 50 characters"
        );
        cy.get(dashboardSelector.slugNameInputLabel).verifyVisibleElement(
            "have.text",
            "Unique workspace slug"
        );
        cy.get(dashboardSelector.workspaceSlugInputField).verifyVisibleElement(
            "have.value",
            data.workspaceSlug
        );
        cy.get(dashboardSelector.slugInfoLabel).verifyVisibleElement(
            "have.text",
            "URL-friendly 'slug' consists of lowercase letters, numbers, and hyphens"
        );
        cy.get(dashboardSelector.workspaceLinkLabel).verifyVisibleElement(
            "have.text",
            "Workspace link"
        );
        cy.get(dashboardSelector.slugField).verifyVisibleElement(
            "have.text",
            `http://localhost:8082/${data.workspaceSlug}`
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(commonSelectors.saveButton).verifyVisibleElement(
            "have.text",
            "Save"
        );
        cy.get(commonSelectors.saveButton).should("be.disabled");

        cy.get(commonSelectors.workspaceNameInputField).clear();
        cy.get(dashboardSelector.workspaceErrorLabel).verifyVisibleElement(
            "have.text",
            "Workspace name can't be empty"
        );

        cy.clearAndType(commonSelectors.workspaceNameInputField, "My workspace");
        cy.get(dashboardSelector.workspaceErrorLabel).verifyVisibleElement(
            "have.text",
            "Name must be unique"
        );

        cy.get(dashboardSelector.workspaceSlugInputField).clear();
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Workspace slug can't be empty"
        );

        cy.clearAndType(dashboardSelector.workspaceSlugInputField, " test");
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Cannot contain spaces"
        );

        cy.clearAndType(dashboardSelector.workspaceSlugInputField, "!@#$%_^");
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Special characters are not accepted."
        );

        cy.clearAndType(dashboardSelector.workspaceSlugInputField, "my-workspace");
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Slug must be unique"
        );

        cy.get(dashboardSelector.workspaceSlugInputField).clear();
        cy.get(commonSelectors.cancelButton).click();

        cy.wait(3000);
        cy.get(commonSelectors.workspaceName).click();
        cy.get(commonSelectors.editRectangleIcon).click();
        cy.get(commonWidgetSelector.modalCloseButton).click();
        cy.get(commonSelectors.workspaceName).click();
        cy.get(commonSelectors.editRectangleIcon).click();

        cy.get(commonSelectors.workspaceNameInputField).verifyVisibleElement(
            "have.value",
            data.workspaceName
        );
        cy.get(dashboardSelector.workspaceSlugInputField).verifyVisibleElement(
            "have.value",
            data.workspaceSlug
        );
        cy.get(commonSelectors.saveButton).should("be.disabled");

        data.workspaceName = `${fake.firstName}-workspace`;
        data.workspaceSlug = `${data.workspaceName.toLowerCase()}-slug`;

        cy.clearAndType(
            commonSelectors.workspaceNameInputField,
            data.workspaceName
        );
        cy.wait(1000);
        cy.clearAndType(
            dashboardSelector.workspaceSlugInputField,
            data.workspaceSlug
        );
        cy.wait(1500);
        cy.get(commonSelectors.saveButton).should("be.enabled").click();

        cy.wait(1000);
        cy.get(commonSelectors.workspaceName).verifyVisibleElement(
            "have.text",
            data.workspaceName
        );
        cy.url().should("eq", `http://localhost:8082/${data.workspaceSlug}`);
    });
});
