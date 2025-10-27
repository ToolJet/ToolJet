import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { releaseApp } from "Support/utils/common";
import { onboardingSelectors } from "Selectors/onboarding";
import { visitWorkspaceInvitation, inviteUser } from "Support/utils/onboarding";
import { openInstanceSettings } from "Support/utils/platform/eeCommon";
import { commonEeText, instanceSettingsText } from "Texts/eeCommon";
import { commonEeSelectors, instanceSettingsSelector, workspaceSelector } from "Selectors/eeCommon";
import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";

describe("Instance settings - All workspaces management", () => {
    const DEFAULT_WORKSPACE = "My workspace";

    beforeEach(() => {
        cy.defaultWorkspaceLogin();
    });

    const assertAllWorkspacesHeader = () => {
        cy.get(commonEeSelectors.pageTitle).verifyVisibleElement(
            "have.text",
            instanceSettingsText.pageTitle
        );
        cy.get('[data-cy="breadcrumb-page-title"]').verifyVisibleElement(
            "have.text",
            "All workspaces"
        );
    };

    const assertWorkspaceTableControls = () => {
        cy.get('[data-cy="active-link"]').should("be.visible");
        cy.get('[data-cy="archived-link"]').should("be.visible");
        cy.get('[data-cy="query-manager-search-bar"]').should("be.visible");
        cy.get('[data-cy="name-header"]').verifyVisibleElement(
            "have.text",
            "Workspace name"
        );
    };

    const assertWorkspaceRow = (workspaceName, isDefault = false) => {
        cy.get('.mx-3.tj-text-sm.d-flex.align-items-center')
            .contains(workspaceName)
            .should('be.visible')
            .within(() => {
                cy.contains(workspaceName).should('be.visible');
                if (isDefault) {
                    cy.get('.default-workspace-tag').should('be.visible');
                }
            });
    };

    const openAllWorkspaces = () => {
        openInstanceSettings();
        cy.get('[data-cy="all-workspaces-list-item"]').click();
    };

    const findAndArchiveWorkspace = (workspaceName) => {
        cy.get('[data-cy="query-manager-search-bar"]')
            .should('be.visible')
            .clear()
            .type(workspaceName);
        cy.wait(1000);
        cy.get('[data-cy="button-ws-status-change"]')
            .click({ force: true });
        cy.get('[data-cy="confirm-button"]', { timeout: 10000 })
            .should('be.visible')
            .click();
    };

    const findAndUnarchiveWorkspace = (workspaceName) => {
        cy.get('[data-cy="archived-link"]').click();
        cy.wait(500);
        cy.get('[data-cy="query-manager-search-bar"]')
            .should('be.visible')
            .clear()
            .type(workspaceName);
        cy.wait(1000);
        cy.get('[data-cy="button-ws-status-change"]')
            .click({ force: true });

        cy.get(commonSelectors.toastMessage).should(
            "contain.text",
            `${workspaceName} \n was successfully unarchived`
        );
    };

    const verifyDefaultWorkspaceTooltip = () => {
        cy.get('tr.workspace-table-row').each(($row) => {
            cy.wrap($row)
                .find('[data-cy$="-workspace"]')
                .invoke('text')
                .then((name) => {
                    if (name.trim() === DEFAULT_WORKSPACE) {
                        cy.wrap($row)
                            .find('[data-cy="button-ws-status-change"]')
                            .trigger('mouseover');

                        cy.get('[data-tooltip-id="default-workspace-tooltip"]')
                            .should('be.visible')
                            .and(
                                'have.attr',
                                'data-tooltip-content',
                                'Default workspace cannot be archived. Set another workspace as default to proceed with archiving.'
                            );
                    }
                });
        });
    };

    const handleArchiveWorkspaceModal = () => {
        cy.get(workspaceSelector.switchWsModalTitle)
            .verifyVisibleElement("have.text", "Archive current workspace");

        cy.get(workspaceSelector.switchWsModalMessage)
            .should(
                "contain.text",
                "The current workspace will be archived. Select an active workspace to continue this session."
            );
        cy.get(`[data-cy="${DEFAULT_WORKSPACE.toLowerCase().replace(/\s+/g, '-')}-workspace-input"]`).check();
        cy.get('[data-cy="continue-button"]').click();

        cy.url().should("include", `/${DEFAULT_WORKSPACE.toLowerCase().replace(/\s+/g, '-')}`);
    };

    it("should verify all workspaces page UI elements including header, table, tabs and workspace rows", () => {
        const testWorkspace = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
        cy.apiCreateWorkspace(testWorkspace, testWorkspace);
        cy.apiLogin();

        openAllWorkspaces();
        assertAllWorkspacesHeader();
        assertWorkspaceTableControls();

        cy.get('.tj-select .react-select__control').should('be.visible');
        cy.get('.tj-select .react-select__control').click();
        cy.get('.react-select__menu').within(() => {
            cy.contains('.react-select__option', 'My workspace')
                .scrollIntoView()
                .should('be.visible');
            cy.contains('.react-select__option', testWorkspace)
                .scrollIntoView()
                .should('be.visible');
        });
        cy.get('.tj-select .react-select__control').click();

        assertWorkspaceRow(DEFAULT_WORKSPACE, true);
        assertWorkspaceRow(testWorkspace, false);
        cy.get('[data-cy="active-link"]').should('be.visible').and('contain', 'Active');
        cy.get('[data-cy="archived-link"]').should('be.visible').and('contain', 'Archived');
    });

    it("should archive non-default workspace and show workspace switcher modal when archiving current workspace", () => {
        const workspace1 = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
        cy.apiCreateWorkspace(workspace1, workspace1);
        cy.visit(`/${workspace1}`);
        cy.wait(2000);

        openAllWorkspaces();
        findAndArchiveWorkspace(workspace1);
        handleArchiveWorkspaceModal();
        openAllWorkspaces();
        cy.get('[data-cy="archived-link"]').click();
        cy.wait(500);
        cy.get('tr.workspace-table-row').should("contain.text", workspace1);
    });

    it("should not allow archiving default workspace", () => {
        cy.apiLogin();
        cy.reload();
        openAllWorkspaces();
        verifyDefaultWorkspaceTooltip();
    });

    // need to fix after bug fix
    it.skip("should prevent login to archived workspace and show error toast", () => {
        // Create workspace and invite user
        const workspaceName = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
        const userName = fake.firstName;
        const userEmail = fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "");

        cy.apiCreateWorkspace(workspaceName, workspaceName);
        cy.visit(`/${workspaceName}`);
        cy.wait(2000);
        cy.apiLogin();
        cy.reload();
        cy.apiFullUserOnboarding(userName, userEmail, "end-user", "password", workspaceName, {});
        cy.apiLogout();
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visitTheWorkspace(DEFAULT_WORKSPACE);
        cy.apiLogin();
        cy.reload();
        openAllWorkspaces();
        findAndArchiveWorkspace(workspaceName);

        cy.get(commonSelectors.toastMessage).should(
            "contain.text",
            `${workspaceName} \n was successfully archived`
        );

        // Try to login as invited user
        cy.apiLogout();
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.wait(1000);

        // Try to access workspace
        cy.visit(`/${workspaceName}`);
        cy.clearAndType(onboardingSelectors.loginEmailInput, userEmail);
        cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
        cy.get(onboardingSelectors.signInButton).click();

        // Verify toast message
        cy.get(commonSelectors.toastMessage).should(
            "contain.text",
            "This workspace has been archived. Contact superadmin to know more."
        );
    });

    it("should allow user to login to active workspace when one of their workspaces is archived", () => {
        const workspace1 = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
        const workspace2 = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
        const userName = fake.firstName;
        const userEmail = fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "");

        cy.apiCreateWorkspace(workspace1, workspace1);
        cy.visit(`/${workspace1}`);
        cy.wait(2000);
        cy.apiLogin();
        cy.reload();
        cy.apiFullUserOnboarding(userName, userEmail, "end-user", "password", workspace1, {});
        cy.apiLogout();
        cy.reload();

        cy.defaultWorkspaceLogin();

        cy.apiCreateWorkspace(workspace2, workspace2);
        cy.visit(`/${workspace2}`);
        cy.wait(2000);
        cy.apiLogin();
        cy.reload();
        cy.apiUserInvite(userName, userEmail);
        cy.wait(2000);

        visitWorkspaceInvitation(userEmail, workspace2);
        cy.clearAndType(onboardingSelectors.signupEmailInput, userEmail);
        cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
        cy.get(onboardingSelectors.signInButton).click();
        cy.get('[data-cy="accept-invite-button"]').click();
        cy.apiLogout();
        cy.reload();

        cy.visitTheWorkspace(DEFAULT_WORKSPACE);
        cy.apiLogin();
        cy.reload()
        openAllWorkspaces();
        findAndArchiveWorkspace(workspace1);
        cy.get(commonSelectors.toastMessage).should(
            "contain.text",
            `${workspace1} \n was successfully archived`
        );

        cy.apiLogout();
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.wait(1000);
        cy.visit(`/${workspace2}`);
        cy.clearAndType(onboardingSelectors.loginEmailInput, userEmail);
        cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
        cy.get(onboardingSelectors.signInButton).click();

        cy.get(commonSelectors.mainWrapper, { timeout: 10000 }).should("be.visible");
        cy.url().should("include", `/${workspace2}`);
    });

    it("should allow login after unarchiving workspace", () => {
        const workspaceName = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
        const userName = fake.firstName;
        const userEmail = fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "");

        cy.apiCreateWorkspace(workspaceName, workspaceName);
        cy.visit(`/${workspaceName}`);
        cy.wait(2000);
        cy.apiLogin();
        cy.reload();
        cy.apiFullUserOnboarding(userName, userEmail, "end-user", "password", workspaceName, {});

        cy.visitTheWorkspace(DEFAULT_WORKSPACE);
        cy.apiLogin();
        cy.reload();
        openAllWorkspaces();
        findAndArchiveWorkspace(workspaceName);
        cy.get(commonSelectors.toastMessage).should(
            "contain.text",
            `${workspaceName} \n was successfully archived`
        );
        cy.get('[data-cy="archived-link"]').click();
        cy.wait(500);
        cy.get('tr.workspace-table-row').should("contain.text", workspaceName);
        findAndUnarchiveWorkspace(workspaceName);

        cy.apiLogout();
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.wait(1000);
        cy.visitTheWorkspace(workspaceName);
        cy.clearAndType(onboardingSelectors.loginEmailInput, userEmail);
        cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
        cy.get(onboardingSelectors.signInButton).click();
        cy.get(commonSelectors.mainWrapper, { timeout: 10000 }).should("be.visible");
    });

    it("should verify user with no active workspaces shows correct modal in instance settings", () => {
        const userName = fake.firstName;
        const userEmail = fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "");
        const workspaceName = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");

        cy.apiCreateWorkspace(workspaceName, workspaceName);
        cy.visit(`/${workspaceName}`);
        cy.wait(2000);
        cy.apiLogin();
        cy.reload();
        cy.apiFullUserOnboarding(userName, userEmail, "end-user", "password", workspaceName, {});
        cy.apiLogout();
        cy.reload();
        cy.visitTheWorkspace(DEFAULT_WORKSPACE);
        cy.apiLogin();
        cy.reload();
        openAllWorkspaces();
        findAndArchiveWorkspace(workspaceName);
        cy.get(commonSelectors.toastMessage).should(
            "contain.text",
            `${workspaceName} \n was successfully archived`
        );
        openInstanceSettings();
        cy.clearAndType(commonSelectors.inputUserSearch, userEmail);
        cy.get('[data-cy="text-no-result-found"]').should("have.text", "No result found");
    });

    it("should prevent access to public app from archived workspace", () => {
        const workspace1 = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
        const workspace2 = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
        const userName = fake.firstName;
        const userEmail = fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "");

        cy.apiCreateWorkspace(workspace1, workspace1);
        cy.visit(`/${workspace1}`);
        cy.wait(2000);
        cy.apiLogin();
        cy.reload();
        cy.apiFullUserOnboarding(userName, userEmail, "end-user", "password", workspace1, {});
        cy.apiLogout();
        cy.reload();
        cy.apiLogin();
        cy.reload();
        cy.createApp(userName)
        cy.dragAndDropWidget("Table", 250, 250);
        releaseApp();
        cy.get('[data-cy="share-button-link"]').click();
        cy.clearAndType('[data-cy="app-name-slug-input"]', workspace1);
        cy.get('[data-cy="make-public-app-toggle"]').check();
        cy.wait(2000);
        cy.get('[data-cy="modal-close-button"]').click();
        cy.visitTheWorkspace(DEFAULT_WORKSPACE);
        cy.apiLogin();
        cy.reload();
        openAllWorkspaces();
        findAndArchiveWorkspace(workspace1);
        cy.get(commonSelectors.toastMessage).should(
            "contain.text",
            `${workspace1} \n was successfully archived`
        );

        cy.apiLogout();
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visit(`/applications/${workspace1}`);

        cy.get(workspaceSelector.switchWsModalTitle).verifyVisibleElement(
            "have.text",
            "Archived workspace"
        );
        cy.get(workspaceSelector.switchWsModalMessage).verifyVisibleElement(
            "have.text",
            "Your workspace and all app in it have been archived. Contact super admin to know more"
        );
    });
});


