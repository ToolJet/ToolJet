import {
    insertGitSyncSSHKey,
    insertGitSyncSSHSecondKey,
} from "Support/utils/eeCommon";
import { fake } from "Fixtures/fake";
import { navigateToAppEditor, releaseApp } from "Support/utils/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { importSelectors } from "Selectors/exportImport";
import { commonEeSelectors, gitSyncSelector } from "Selectors/eeCommon";
import { createNewVersion } from "Support/utils/exportImport";
import { navigateToCreateNewVersionModal } from "Support/utils/version";
import {
    editAndVerifyWidgetName,
} from "Support/utils/commonWidget";
import { promoteApp } from "Support/utils/multiEnv";

describe("", () => {
    const data = {};
    let newVersion = [];
    let versionFrom = "";
    let currentVersion = "";
    let newWorkspaceId;

    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        cy.skipWalkthrough();
    });

    it("Verify git push and pull functionalities", () => {
        data.appName = `${fake.companyName}-template-app`;
        data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
        data.workspaceName = `${fake.companyName.toLowerCase()}-workspace`;
        data.text1 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");

        insertGitSyncSSHKey(Cypress.env("workspaceId"));
        cy.wait(3000);
        cy.reload();
        cy.logoutApi();
        cy.defaultWorkspaceLogin();
        cy.wait(1000);

        cy.get(commonSelectors.appCreateButton).click();
        cy.clearAndType('[data-cy="app-name-input"]', data.appName);
        cy.get(gitSyncSelector.gitCommitInput).check();
        cy.get(commonSelectors.createAppButton).click();
        cy.wait(3000);
        cy.dragAndDropWidget("Text", 300, 250);
        editAndVerifyWidgetName(data.text1, []);
        cy.waitForAutoSave();

        navigateToCreateNewVersionModal((currentVersion = "v1"));
        cy.verifyLabel("Commit changes");
        cy.get(gitSyncSelector.commitHelperText).verifyVisibleElement(
            "have.text",
            "This will commit the creation of the new version to the git repo"
        );
        cy.get(gitSyncSelector.gitCommitInput).should("be.visible").check();
        createNewVersion((newVersion = ["v2"]), (versionFrom = "v1"));

        cy.wait(3000);
        navigateToCreateNewVersionModal((currentVersion = "v2"));
        createNewVersion((newVersion = ["v3"]), (versionFrom = "v2"));

        cy.wait(3000);
        cy.get(commonWidgetSelector.draggableWidget(data.text1)).click();
        cy.get(
            '[data-cy="textcomponenttextinput-input-field"]'
        ).clearAndTypeOnCodeMirror("Git sync testing");
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();

        cy.get(commonEeSelectors.gitSyncIcon).click();
        cy.get(gitSyncSelector.lastCommitInput).verifyVisibleElement(
            "have.text",
            `Version v2 Created of app ${data.appName}`
        );
        cy.get(gitSyncSelector.lastCommitVersion).verifyVisibleElement(
            "have.text",
            "v2"
        );
        cy.get(gitSyncSelector.autherInfo).should(
            "include.text",
            "Done by The Developer at"
        );
        cy.clearAndType(gitSyncSelector.commitMessageInput, "Git sync test commit");
        cy.get(commonSelectors.cancelButton).click();

        cy.get(commonEeSelectors.gitSyncIcon).click();
        cy.get(gitSyncSelector.commitMessageInput).verifyVisibleElement(
            "have.attr",
            "placeholder",
            "Briefly describe the changes you've made"
        );
        cy.clearAndType(gitSyncSelector.commitMessageInput, "Git sync test commit");
        cy.get(commonEeSelectors.modalCloseButton).click();

        cy.get(commonEeSelectors.gitSyncIcon).click();
        cy.get(gitSyncSelector.commitMessageInput).verifyVisibleElement(
            "have.attr",
            "placeholder",
            "Briefly describe the changes you've made"
        );
        cy.clearAndType(gitSyncSelector.commitMessageInput, "Git sync test commit");
        cy.get(gitSyncSelector.commitButton).click();

        cy.wait(3000);
        cy.get(commonEeSelectors.modalTitle).verifyVisibleElement(
            "have.text",
            "Commit changes"
        );
        cy.get(commonEeSelectors.modalCloseButton).should("be.visible");
        cy.get(commonSelectors.modalMessage).verifyVisibleElement(
            "have.text",
            "Commiting changes to v3 will replace v2 in the git repo. Are you sure you want to continue?"
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(commonEeSelectors.confirmButton).verifyVisibleElement(
            "have.text",
            "Continue"
        );
        cy.get(commonEeSelectors.confirmButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Changes commited successfully"
        );
        cy.wait(3000);

        cy.apiCreateWorkspace(data.workspaceName, data.workspaceName);
        cy.intercept("GET", "api/authorize").as("workspaceId");
        cy.visit(`${data.workspaceName}`);
        cy.wait("@workspaceId").then((id) => {
            newWorkspaceId = id.response.body.current_organization_id;
            cy.log(newWorkspaceId);
            cy.wait(3000);
            insertGitSyncSSHSecondKey(`${newWorkspaceId}`);
            cy.wait(3000);
        });

        cy.reload();
        cy.logoutApi();
        cy.apiLogin();
        cy.visit(`${data.workspaceName}`);
        cy.wait(3000);
        cy.get(importSelectors.dropDownMenu).click();
        cy.get(commonEeSelectors.importFromGit).click();

        cy.get(commonEeSelectors.modalTitle).verifyVisibleElement(
            "have.text",
            "Import app from git repository"
        );
        cy.get(commonEeSelectors.modalCloseButton).should("be.visible");
        cy.verifyLabel("Create app from");
        cy.get('[data-cy="app-select"]').should("be.visible");
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(commonEeSelectors.confirmButton).verifyVisibleElement(
            "have.text",
            "Import app"
        );
        cy.get('[data-cy="app-select"]>>>>.react-select__input-container').click();
        cy.get('[data-cy="app-select"]>>>>.react-select__input-container').type(
            data.appName
        );
        cy.wait(1000);
        cy.get(".react-select__menu-list").contains(data.appName).click();

        cy.get(commonEeSelectors.modalTitle);
        cy.verifyLabel("Create app from");
        cy.get(".react-select__single-value").should("be.visible");
        cy.verifyLabel("App name");
        cy.get(gitSyncSelector.appNameField).verifyVisibleElement(
            "have.value",
            data.appName
        );
        cy.verifyLabel("Last commit");
        cy.get(gitSyncSelector.lastCommitInput).verifyVisibleElement(
            "have.text",
            "Git sync test commit"
        );
        cy.get(gitSyncSelector.lastCommitVersion).verifyVisibleElement(
            "have.text",
            "v3"
        );
        cy.get(gitSyncSelector.autherInfo).should(
            "include.text",
            "Done by The Developer at"
        );
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(commonEeSelectors.confirmButton).verifyVisibleElement(
            "have.text",
            "Import app"
        );
        cy.get(commonEeSelectors.confirmButton).click();

        cy.get(commonSelectors.warningText, { timeout: 50000 });
        cy.get(commonSelectors.warningText).verifyVisibleElement(
            "have.text",
            "Apps imported from git repository cannot be edited"
        );

        cy.waitForAppLoad();
        cy.wait(1000);
        cy.get(".datasource-picker").should("have.class", "disabled");
        cy.get(commonEeSelectors.AddQueryButton).should("be.disabled");
        cy.get(".components-container").should("have.class", "disabled");

        cy.wait(2000);
        cy.get(commonEeSelectors.gitSyncIcon).click();
        cy.wait(2000);
        cy.get(commonEeSelectors.modalTitle).verifyVisibleElement(
            "have.text",
            "GitSync"
        );
        cy.get(commonEeSelectors.modalCloseButton).should("be.visible");
        cy.verifyLabel("Git repo URL");
        cy.get(gitSyncSelector.gitRepoInfo).verifyVisibleElement(
            "have.value",
            "git@github.com:ajith-k-v/test.git"
        );
        cy.verifyLabel("Check for updates");
        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(gitSyncSelector.pullButton).verifyVisibleElement(
            "have.text",
            "Pull changes"
        );
        cy.get(commonSelectors.cancelButton).click();

        promoteApp();
        cy.get(".git-sync-btn").should("have.class", "disabled-action-tooltip");
        promoteApp();
        cy.get(".git-sync-btn").should("have.class", "disabled-action-tooltip");

        cy.get(commonSelectors.releaseButton).click();
        cy.get(commonSelectors.yesButton).click();

        cy.get(commonWidgetSelector.shareAppButton).click();
        cy.clearAndType(commonWidgetSelector.appNameSlugInput, data.slug);
        cy.wait(2000);
        cy.visit(`/applications/${data.slug}`);
        cy.get(
            commonWidgetSelector.draggableWidget(data.text1)
        ).verifyVisibleElement("have.text", "Git sync testing");
    });

    it("Verify git sync modal UI", () => {
        data.appName = `${fake.companyName}-App`;

        insertGitSyncSSHKey(Cypress.env("workspaceId"));
        cy.wait(3000);
        cy.reload();
        cy.logoutApi();
        cy.defaultWorkspaceLogin();

        cy.get(commonSelectors.appCreateButton).click();
        cy.get(gitSyncSelector.gitCommitInput).should("be.visible");
        cy.verifyLabel("Commit changes");
        cy.get(gitSyncSelector.commitHelperText).verifyVisibleElement(
            "have.text",
            "This action commits the app's creation to the git repository"
        );

        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.get(gitSyncSelector.gitCommitInput).check();
        cy.get(commonSelectors.createAppButton).click();
        cy.wait(3000);
        cy.wait(1000);

        cy.get(commonEeSelectors.gitSyncIcon).click();
        cy.get(commonEeSelectors.modalTitle).verifyVisibleElement(
            "have.text",
            "GitSync"
        );
        cy.get(commonEeSelectors.modalCloseButton).should("be.visible");
        cy.verifyLabel("Git repo URL");
        cy.get(gitSyncSelector.gitRepoInput).verifyVisibleElement(
            "have.value",
            "git@github.com:ajith-k-v/test.git"
        );
        cy.verifyLabel("Commit message");
        cy.get(gitSyncSelector.commitMessageInput).verifyVisibleElement(
            "have.attr",
            "placeholder",
            "Briefly describe the changes you've made"
        );
        cy.verifyLabel("Last commit");
        cy.get(gitSyncSelector.lastCommitInput).verifyVisibleElement(
            "have.text",
            `App ${data.appName} created`
        );
        cy.get(gitSyncSelector.lastCommitVersion).verifyVisibleElement(
            "have.text",
            "v1"
        );
        cy.get(gitSyncSelector.autherInfo).should(
            "include.text",
            "Done by The Developer at"
        );

        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(gitSyncSelector.commitButton).verifyVisibleElement(
            "have.text",
            "Commit changes"
        );
        cy.get(gitSyncSelector.commitButton).should("be.disabled");
        cy.visit("my-workspace/workspace-settings/configure-git");
        cy.wait(3000);
        cy.get(gitSyncSelector.gitSyncToggleInput, { timeout: 10000 });
        cy.get(gitSyncSelector.gitSyncToggleInput).uncheck();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "GitSync has been successfully \n disconnected!"
        );

        cy.get(commonSelectors.homePageLogo).click();
        navigateToAppEditor(data.appName);

        cy.wait(3000);
        cy.wait(1000);

        cy.get(commonEeSelectors.gitSyncIcon).click();
        cy.get(commonEeSelectors.modalTitle).verifyVisibleElement(
            "have.text",
            "GitSync"
        );
        cy.get(commonEeSelectors.modalCloseButton).should("be.visible");
        cy.get(commonEeSelectors.gitSyncIcon).should("be.visible");
        cy.verifyLabel("No connection yet");
        cy.get(gitSyncSelector.gitSyncApphelperText).verifyVisibleElement(
            "have.text",
            "Sync applications to your git repository and never lose your progress!"
        );
        cy.get(gitSyncSelector.connectRepoButton).verifyVisibleElement(
            "have.text",
            "Connect to repository"
        );

        cy.visit("my-workspace/workspace-settings/configure-git");
        cy.wait(3000);
        cy.get(gitSyncSelector.gitSyncToggleInput, { timeout: 10000 });
        cy.get(gitSyncSelector.gitSyncToggleInput).check();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "GitSync has been successfully connected!"
        );
        //app clone,import app
    });

    it("Verify git sync config page UI", () => {
        data.workspaceName = `${fake.companyName.toLowerCase()}-workspace`;

        cy.apiCreateWorkspace(data.workspaceName, data.workspaceName);
        cy.visit(`${data.workspaceName}`);
        cy.get(commonSelectors.settingsIcon).click();
        cy.get(commonSelectors.workspaceSettings).click();
        cy.get(commonSelectors.listItem("Configure git")).click();
        cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Workspace settings");
        });
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " Configure git"
        );

        cy.get('[data-cy="git-header-text"]').verifyVisibleElement(
            "have.text",
            "Configure git"
        );

        cy.get(gitSyncSelector.gitSyncToggleInput).should("be.visible");

        cy.verifyLabel("Connect");

        cy.get(gitSyncSelector.toggleMessage).verifyVisibleElement(
            "have.text",
            "Enable it to sync data within apps"
        );
        cy.verifyLabel("Git repo URL");

        cy.get(gitSyncSelector.sshInput).verifyVisibleElement(
            "have.attr",
            "placeholder",
            "Enter Git SSH URL"
        );
        cy.get(gitSyncSelector.generateSshButton).verifyVisibleElement(
            "have.text",
            "Generate SSH key"
        );
        cy.get(gitSyncSelector.sshInputHelperText).verifyVisibleElement(
            "have.text",
            "Creating an empty git repository is recommended"
        );
        cy.get(commonSelectors.linkReadDocumentation).verifyVisibleElement(
            "have.text",
            "Read documentation"
        );
        cy.get(gitSyncSelector.configDeleteButton).verifyVisibleElement(
            "have.text",
            "Delete configuration"
        );
        cy.get(gitSyncSelector.configDeleteButton).should("be.disabled");
        cy.get(gitSyncSelector.testConnectionButton).verifyVisibleElement(
            "have.text",
            "Finalize setup"
        );
        cy.get(gitSyncSelector.testConnectionButton).should("be.disabled");

        cy.clearAndType(
            gitSyncSelector.sshInput,
            "https://github.com/ajith-k-v-r/test.git"
        );

        cy.clearAndType(
            gitSyncSelector.sshInput,
            "git@github.com:ajith-k-v/test.git"
        );
        cy.get(gitSyncSelector.generateSshButton).click();
        cy.verifyLabel("Connect");
        cy.get(gitSyncSelector.sshKey).should("be.visible");
        cy.get(commonSelectors.copyIcon).should("be.visible");
        cy.get(gitSyncSelector.deployKeyHelperText).verifyVisibleElement(
            "have.text",
            "This is your repository’s deploy key"
        );
        cy.get(commonSelectors.warningText).verifyVisibleElement(
            "have.text",
            "While deploying the key, please ensure write access permission has been granted for the connection to be successful"
        );
        cy.get(gitSyncSelector.gitRepoLink).verifyVisibleElement(
            "have.text",
            "Open Git Repository"
        );
    });
});
