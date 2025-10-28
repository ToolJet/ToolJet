import { commonSelectors, instanceWorkspaceSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { releaseApp } from "Support/utils/common";
import { onboardingSelectors } from "Selectors/onboarding";
import { visitWorkspaceInvitation, inviteUser } from "Support/utils/onboarding";
import { openInstanceSettings } from "Support/utils/platform/eeCommon";
import { commonEeText, instanceSettingsText, instanceWorksapceText } from "Texts/eeCommon";
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
        cy.get(instanceWorkspaceSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            instanceWorksapceText.breadcrumbTitle
        );
    };

    const assertWorkspaceTableControls = () => {
        cy.get(instanceWorkspaceSelectors.tabActive).should("be.visible");
        cy.get(instanceWorkspaceSelectors.tabArchived).should("be.visible");
        cy.get(instanceWorkspaceSelectors.searchBar).should("be.visible");
        cy.get(instanceWorkspaceSelectors.nameHeader).verifyVisibleElement(
            "have.text",
            instanceWorksapceText.nameHeader
        );
    };

    const assertWorkspaceRow = (workspaceName, isDefault = false) => {
        cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
            .contains(workspaceName)
            .should('be.visible')
            .within(() => {
                cy.contains(workspaceName).should('be.visible');
                if (isDefault) {
                    cy.get(instanceWorkspaceSelectors.defaultWorkspaceTag).should('be.visible');
                }
            });
    };

    const openAllWorkspaces = () => {
        openInstanceSettings();
        cy.get(instanceWorkspaceSelectors.navAllWorkspaces).click();
    };

    const findAndArchiveWorkspace = (workspaceName) => {
        cy.get(instanceWorkspaceSelectors.searchBar)
            .should('be.visible')
            .clear()
            .type(workspaceName);
        cy.get(instanceWorkspaceSelectors.statusChangeButton, { timeout: 10000 })
            .click({ force: true });
        cy.get(instanceWorkspaceSelectors.confirmButton, { timeout: 10000 })
            .should('be.visible')
            .click();
    };

    const findAndUnarchiveWorkspace = (workspaceName) => {
        cy.get(instanceWorkspaceSelectors.tabArchived).click();
        cy.get(instanceWorkspaceSelectors.searchBar, { timeout: 10000 })
            .should('be.visible')
            .clear()
            .type(workspaceName);
        cy.get(instanceWorkspaceSelectors.statusChangeButton, { timeout: 10000 })
            .click({ force: true });

        cy.get(commonSelectors.toastMessage).should(
            "contain.text",
            `${workspaceName} \n was successfully unarchived`
        );
    };

    const verifyDefaultWorkspaceTooltip = () => {
        cy.get(instanceWorkspaceSelectors.workspaceTableRow).each(($row) => {
            cy.wrap($row)
                .find(instanceWorkspaceSelectors.workspaceNameCellSuffix)
                .invoke('text')
                .then((name) => {
                    if (name.trim() === DEFAULT_WORKSPACE) {
                        cy.wrap($row)
                            .find(instanceWorkspaceSelectors.statusChangeButton)
                            .trigger('mouseover');

                        cy.get(instanceWorkspaceSelectors.tooltipDefaultWorkspace)
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
            .verifyVisibleElement("have.text", instanceWorksapceText.archiveCurrentWorkspaceTitle);

        cy.get(workspaceSelector.switchWsModalMessage)
            .should(
                "contain.text",
                instanceWorksapceText.archiveCurrentWorkspaceMessage
            );
        cy.get(`[data-cy="${DEFAULT_WORKSPACE.toLowerCase().replace(/\s+/g, '-')}-workspace-input"]`).check();
        cy.get(instanceWorkspaceSelectors.continueButton).click();

        cy.url().should("include", `/${DEFAULT_WORKSPACE.toLowerCase().replace(/\s+/g, '-')}`);
    };

    it("should verify all workspaces page UI elements including header, table, tabs and workspace rows", () => {
        const testWorkspace = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
        cy.apiCreateWorkspace(testWorkspace, testWorkspace);
        cy.apiLogin();

        openAllWorkspaces();
        assertAllWorkspacesHeader();
        assertWorkspaceTableControls();

        cy.get(instanceWorkspaceSelectors.selectControl).should('be.visible');
        cy.get(instanceWorkspaceSelectors.selectControl).click();
        cy.get(instanceWorkspaceSelectors.selectMenu).within(() => {
            cy.contains(instanceWorkspaceSelectors.selectOption, 'My workspace')
                .scrollIntoView()
                .should('be.visible');
            cy.contains(instanceWorkspaceSelectors.selectOption, testWorkspace)
                .scrollIntoView()
                .should('be.visible');
        });
        cy.get(instanceWorkspaceSelectors.selectControl).click();

        assertWorkspaceRow(DEFAULT_WORKSPACE, true);
        assertWorkspaceRow(testWorkspace, false);
        cy.get(instanceWorkspaceSelectors.tabActive).should('be.visible').and('contain', instanceWorksapceText.activeTab);
        cy.get(instanceWorkspaceSelectors.tabArchived).should('be.visible').and('contain', instanceWorksapceText.archivedTab);
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
        cy.get(instanceWorkspaceSelectors.tabArchived).click();
        cy.get(instanceWorkspaceSelectors.workspaceTableRow, { timeout: 10000 }).should("contain.text", workspace1);
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
        cy.get(instanceWorkspaceSelectors.acceptInviteButton).click();
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
        cy.get(instanceWorkspaceSelectors.tabArchived).click();
        cy.get(instanceWorkspaceSelectors.workspaceTableRow, { timeout: 10000 }).should("contain.text", workspaceName);
        findAndUnarchiveWorkspace(workspaceName);

        cy.apiLogout();
        cy.clearCookies();
        cy.clearLocalStorage();
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
        cy.get(instanceWorkspaceSelectors.noResultFoundText).should("have.text", instanceWorksapceText.noResultFound);
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
        cy.get(instanceWorkspaceSelectors.shareButtonLink).click();
        cy.clearAndType(instanceWorkspaceSelectors.appSlugInput, workspace1);
        cy.get(instanceWorkspaceSelectors.makePublicToggle).check();
        cy.wait(2000);
        cy.get(instanceWorkspaceSelectors.modalCloseButton).click();
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
            instanceWorksapceText.archivedWorkspaceTitle
        );
        cy.get(workspaceSelector.switchWsModalMessage).verifyVisibleElement(
            "have.text",
            instanceWorksapceText.archivedWorkspaceMessage
        );
    });

    it("should change default workspace to a new one, archive previous default, then restore and set it back as default", () => {
        const newDefault = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");

        cy.apiCreateWorkspace(newDefault, newDefault);
        cy.apiLogin();

        openAllWorkspaces();
        cy.reload()

        cy.get(instanceWorkspaceSelectors.selectControl).should('be.visible').click();
        cy.get(instanceWorkspaceSelectors.selectMenu)
            .contains(instanceWorkspaceSelectors.selectOption, newDefault)
            .scrollIntoView()
            .click();

        cy.get('[data-cy="confirm-button"]').should('be.visible').click();
        cy.pause();
        cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
            .contains(newDefault)
            .should('be.visible')
            .parent()
            .within(() => {
                cy.get(instanceWorkspaceSelectors.defaultWorkspaceTag).should('be.visible');
            });

        cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
            .contains(DEFAULT_WORKSPACE)
            .should('be.visible')
            .parent()
            .within(() => {
                cy.get(instanceWorkspaceSelectors.defaultWorkspaceTag).should('not.exist');
            });

        cy.get(instanceWorkspaceSelectors.searchBar)
            .clear()
            .type(DEFAULT_WORKSPACE);
        cy.get(instanceWorkspaceSelectors.statusChangeButton).click({ force: true });
        cy.get('[data-cy="confirm-button"]').should('be.visible').click();

        findAndUnarchiveWorkspace(DEFAULT_WORKSPACE);

        cy.get(instanceWorkspaceSelectors.tabActive).click();
        cy.get(instanceWorkspaceSelectors.searchBar).clear();
        cy.get(instanceWorkspaceSelectors.selectControl).should('be.visible').click();
        cy.get(instanceWorkspaceSelectors.selectMenu)
            .contains(instanceWorkspaceSelectors.selectOption, DEFAULT_WORKSPACE)
            .scrollIntoView()
            .click();
        cy.get('[data-cy="confirm-button"]').should('be.visible').click();
        cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
            .contains(DEFAULT_WORKSPACE)
            .should('be.visible')
            .parent()
            .within(() => {
                cy.get(instanceWorkspaceSelectors.defaultWorkspaceTag).should('be.visible');
            });
    });
});


