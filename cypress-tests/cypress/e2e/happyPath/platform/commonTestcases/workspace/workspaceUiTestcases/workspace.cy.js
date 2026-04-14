import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { inviteUser } from "Support/utils/manageUsers";
import { resolveHost } from "Support/utils/apps";

const data = {};
const host = resolveHost();
data.firstName = fake.firstName;
data.workspaceName = `${fake.firstName}-workspace`;
data.workspaceSlug = `${data.workspaceName.toLowerCase()}-slug`;

describe("Workspace", () => {
    before(() => {
        cy.defaultWorkspaceLogin();
        cy.intercept('GET', '**/api/library_apps').as('libraryApps');
    });

    it("Should verify create and edit workspace modal and flow", () => {
        cy.get(commonSelectors.workspaceName).click();
        cy.get(commonSelectors.addWorkspaceButton).click();
        cy.get(dashboardSelector.createWorkspaceTitle).verifyVisibleElement(
            "have.text",
            "Create workspace"
        );

        cy.get(dashboardSelector.workspaceNameLabel).verifyVisibleElement(
            "have.text",
            "Workspace name"
        );

        cy.get(commonSelectors.workspaceNameinput).verifyVisibleElement(
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
            "Unique slug"
        );

        cy.get(dashboardSelector.workspaceSlugInputField).verifyVisibleElement(
            "have.attr",
            "placeholder",
            "Unique slug"
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
            `${host}/<workspace-slug>`
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
        cy.get(commonSelectors.workspaceNameinput).type("empty").clear();
        cy.get(dashboardSelector.workspaceErrorLabel).verifyVisibleElement(
            "have.text",
            "Workspace name can't be empty"
        );

        cy.get(commonSelectors.cancelButton).click();

        // cy.get(commonSelectors.workspaceName).click();
        cy.get(commonSelectors.addWorkspaceButton).click();
        cy.clearAndType(commonSelectors.workspaceNameinput, "My workspace");
        cy.get(dashboardSelector.workspaceErrorLabel).verifyVisibleElement(
            "have.text",
            "Workspace name already exists"
        );


        // Verify that the slug input derived from the workspace name is correct.

        cy.clearAndType(commonSelectors.workspaceNameinput, data.workspaceName);
        cy.wait(500);
        cy.get(dashboardSelector.workspaceSlugInputField).should(
            "have.value",
            data.workspaceName.toLowerCase()
        );

        cy.get(commonSelectors.workspaceNameinput).clear();
        cy.get(dashboardSelector.workspaceSlugInputField).type(" ").clear();
        cy.wait(1000)
        cy.get(dashboardSelector.createWorkspaceButton).should("be.disabled");
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Workspace slug can't be empty"
        );

        cy.clearAndType(dashboardSelector.workspaceSlugInputField, " test");
        cy.wait(1000)
        cy.get(dashboardSelector.inputLabelError, { timeout: 20000 }).verifyVisibleElement(
            "have.text",
            "Cannot contain spaces"
        );

        cy.clearAndType(dashboardSelector.workspaceSlugInputField, "!@#$%_^");
        cy.wait(1000)
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Special characters are not accepted."
        );

        cy.clearAndType(dashboardSelector.workspaceSlugInputField, "my-workspace");
        cy.wait(1000)
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Workspace slug already exists"
        );

        cy.clearAndType(
            dashboardSelector.workspaceSlugInputField,
            data.workspaceSlug
        );
        cy.wait(1000)
        cy.get(dashboardSelector.slugSuccessLabel).verifyVisibleElement(
            "have.text",
            "Slug accepted!"
        );

        cy.get(dashboardSelector.slugField).verifyVisibleElement(
            "have.text",
            `${host}/${data.workspaceSlug}`
        );
        cy.wait(1000)
        cy.get(dashboardSelector.slugErrorLabel).verifyVisibleElement(
            "have.text",
            "Link updated successfully!"
        );

        cy.get(dashboardSelector.createWorkspaceButton).should("be.disabled");
        cy.clearAndType(dashboardSelector.workspaceSlugInputField, "my-workspace");
        cy.wait(1000);

        cy.clearAndType(commonSelectors.workspaceNameinput, data.workspaceName);
        cy.wait(1000);
        cy.get(commonSelectors.cancelButton).click();

        cy.wait(1000)
        cy.closeDropdown();

        cy.wait(2000);
        cy.get(commonSelectors.workspaceName).click();
        cy.get(commonSelectors.addWorkspaceButton).click();
        cy.get(commonSelectors.workspaceNameinput).verifyVisibleElement(
            "have.attr",
            "placeholder",
            "Workspace name"
        );

        cy.get(dashboardSelector.workspaceSlugInputField).verifyVisibleElement(
            "have.attr",
            "placeholder",
            "Unique slug"
        );

        cy.get(dashboardSelector.createWorkspaceButton).should("be.disabled");
        cy.wait(1000);
        cy.get(commonSelectors.workspaceNameinput).clear().type(data.workspaceName);
        cy.wait(1000);
        cy.get(dashboardSelector.workspaceSlugInputField).click({ force: true })
            .clear()
            .type(data.workspaceSlug);
        cy.wait(1000);
        cy.get(dashboardSelector.createWorkspaceButton)
            .should("be.enabled")
            .click();
        cy.wait('@libraryApps');
        cy.wait(2000);
        cy.get(commonSelectors.workspaceName).verifyVisibleElement(
            "have.text",
            data.workspaceName
        );

        cy.url().should("eq", `${Cypress.config("baseUrl")}/${data.workspaceSlug}`);
        cy.get(commonSelectors.workspaceName).click();
        cy.get('[data-cy="edit-workspace-button"]').click();

        cy.get(dashboardSelector.editWorkspaceTitle).verifyVisibleElement(
            "have.text",
            "Edit workspace"
        );

        cy.get(dashboardSelector.workspaceNameLabel).verifyVisibleElement(
            "have.text",
            "Workspace name"
        );

        cy.get(commonSelectors.workspaceNameinput).verifyVisibleElement(
            "have.value",
            data.workspaceName
        );

        cy.get(dashboardSelector.workspaceNameInfoLabel).verifyVisibleElement(
            "have.text",
            "Name must be unique and max 50 characters"
        );

        cy.get(dashboardSelector.slugNameInputLabel).verifyVisibleElement(
            "have.text",
            "Unique slug"
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
            `${host}/${data.workspaceSlug}`
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
        cy.get(commonSelectors.workspaceNameinput).clear();
        cy.get(dashboardSelector.workspaceErrorLabel).verifyVisibleElement(
            "have.text",
            "Workspace name can't be empty"
        );

        cy.clearAndType(commonSelectors.workspaceNameinput, "My workspace");
        cy.wait(1000)
        cy.get(dashboardSelector.workspaceErrorLabel).verifyVisibleElement(
            "have.text",
            "Workspace name already exists"
        );

        cy.get(dashboardSelector.workspaceSlugInputField).clear();
        cy.wait(1000)
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Workspace slug can't be empty"
        );

        cy.clearAndType(dashboardSelector.workspaceSlugInputField, " test");
        cy.wait(1000)
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Cannot contain spaces"
        );

        cy.clearAndType(dashboardSelector.workspaceSlugInputField, "!@#$%_^");
        cy.wait(1000)
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Special characters are not accepted."
        );

        cy.clearAndType(dashboardSelector.workspaceSlugInputField, "my-workspace");
        cy.wait(1000)
        cy.get(dashboardSelector.inputLabelError).verifyVisibleElement(
            "have.text",
            "Workspace slug already exists"
        );

        cy.get(dashboardSelector.workspaceSlugInputField).clear();
        cy.get(commonSelectors.cancelButton).click();
        cy.wait(3000);
        cy.closeDropdown();

        cy.get(commonSelectors.workspaceName).click();
        cy.get('[data-cy="edit-workspace-button"]').click();

        cy.get(commonSelectors.workspaceNameinput).verifyVisibleElement(
            "have.value",
            data.workspaceName
        );

        cy.get(commonSelectors.saveButton).should("be.disabled");
        data.workspaceName = `${fake.firstName}-workspace`;
        data.workspaceSlug = `${data.workspaceName.toLowerCase()}-slug`;
        cy.clearAndType(commonSelectors.workspaceNameinput, data.workspaceName);

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

        cy.url().should("eq", `${Cypress.config("baseUrl")}/${data.workspaceSlug}`);
    });
});