import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";
import { groupsSelector } from "Selectors/manageGroups";
import { navigateToManageGroups } from "Support/utils/common";
import {
  createGroupsAndAddUserInGroup,
  setupWorkspaceAndInviteUser,
  updateRole
} from "Support/utils/manageGroups";
import {
  getGroupPermissionInput,
  verifyBuilderPermissions,
} from "Support/utils/userPermissions";
import { groupsText } from "Texts/manageGroups";
import { verifyUserInGroups } from 'Support/utils/externalApi';

describe("Custom Group Permissions", () => {
  let data = {};
  const isEnterprise = Cypress.env("environment") === "Enterprise";

  before(() => {
    cy.exec("mkdir -p ./cypress/downloads/");
    cy.wait(3000);
  });

  beforeEach(() => {
    data = {
      firstName: fake.firstName,
      appName: fake.companyName,
      email: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
      workspaceName: fake.lastName.toLowerCase().replace(/[^A-Za-z]/g, ""),
      workspaceSlug: fake.lastName.toLowerCase().replace(/[^A-Za-z]/g, ""),
      folderName: fake.companyName,
      dsName: fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", ""),
    };

    cy.defaultWorkspaceLogin();
    cy.intercept("DELETE", "/api/folders/*").as("folderDeleted");
    cy.skipWalkthrough();
    cy.viewport(2400, 2000);
  });

  it("should verify user permissions in custom groups", () => {
    const groupName = fake.firstName.replace(/[^A-Za-z]/g, "");
    const workflowName1 = fake.companyName;
    const datasourceName1 = fake.companyName
      .toLowerCase()
      .replace(/[^A-Za-z]/g, "");

    setupWorkspaceAndInviteUser(
      data.workspaceName,
      data.workspaceSlug,
      data.firstName,
      data.email
    );
    cy.apiLogout();

    // Setup custom group
    cy.apiLogin();
    cy.visit(data.workspaceSlug);
    //cy.get(".basic-plan-migration-banner").invoke("css", "display", "none");

    cy.apiUpdateGroupPermission(
      "builder",
      getGroupPermissionInput(isEnterprise, false)
    );

    cy.visit(data.workspaceSlug);
    navigateToManageGroups();

    createGroupsAndAddUserInGroup(groupName, data.email);

    // Permission configuration and verification
    cy.get(groupsSelector.permissionsLink).click();

    // App creation permission
    cy.get(groupsSelector.appsCreateCheck).check();
    cy.get(commonSelectors.modalIcon).should("be.visible");
    cy.get(groupsSelector.addEditPermissionModalTitle).should(
      "have.text",
      groupsText.cantCreatePermissionModalTitle
    );
    cy.get(commonSelectors.modalDescription).contains(
      groupsText.cantCreatePermissionModalDescription
    );
    cy.get(`${commonSelectors.modalDescription} a`)
      .should("have.text", "Learn more")
      .and("have.attr", "href");
    cy.get(groupsSelector.changeRoleModalDescription2).contains(
      groupsText.cantCreatePermissionModalDescription2
    );
    cy.get("[data-cy='item-list']").contains(data.email);
    cy.get(commonWidgetSelector.modalCloseButton).click();

    // Other permissions
    const permissions =
      Cypress.env("environment") === "Community"
        ? [
          groupsSelector.appsDeleteCheck,
          groupsSelector.foldersCreateCheck,
          groupsSelector.workspaceVarCheckbox,
        ]
        : [
          groupsSelector.appsDeleteCheck,
          groupsSelector.appPromoteCheck,
          groupsSelector.appReleaseCheck,
          groupsSelector.workflowsCreateCheck,
          groupsSelector.workflowsDeleteCheck,
          groupsSelector.datasourcesCreateCheck,
          groupsSelector.datasourcesDeleteCheck,
          groupsSelector.foldersCreateCheck,
          groupsSelector.workspaceVarCheckbox,
        ];

    permissions.forEach((permission) => {
      cy.get(permission).check();
      cy.wait(1000);
      cy.get(".modal-content").should("be.visible");
      cy.get(commonWidgetSelector.modalCloseButton).click();
      //Note:Please add assertions instead hardcode wait
    });

    // Granular permissions
    cy.get(groupsSelector.granularLink).click();

    cy.ifEnv("Community", () => {
      cy.get(groupsSelector.addAppsButton).click();
    });
    cy.ifEnv("Enterprise", () => {
      cy.get(groupsSelector.addPermissionButton).click();
      cy.get(groupsSelector.addAppButton).click();
    });

    cy.clearAndType(groupsSelector.permissionNameInput, data.firstName);
    cy.get(groupsSelector.editPermissionRadio).click();
    cy.get(groupsSelector.confimButton).click();

    // Verify modal
    cy.get(".modal-content").should("be.visible");
    cy.get(groupsSelector.modalHeader).should(
      "have.text",
      groupsText.cantCreatePermissionModalTitle
    );
    cy.get(groupsSelector.modalMessage).should(
      "have.text",
      groupsText.cantCreatePermissionModalDescription3
    );

    cy.get(".item-list").contains(data.email);
    cy.get(commonSelectors.closeButton).click();

    // Role transition
    verifyUserInGroups(data.email, ["builder"], false, data.workspaceSlug);

    updateRole("End-user", "Builder", data.email);
    verifyUserInGroups(data.email, ["builder"], true, data.workspaceSlug);

    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.appsCreateCheck).check();

    permissions.forEach((permission) => {
      cy.get(permission).check();
      cy.wait(500);
      //Note:Please add assertions instead hardcode wait
    });
    cy.apiLogout();
    cy.apiLogin(data.email);
    cy.visit(data.workspaceSlug);

    verifyBuilderPermissions(
      data.appName,
      data.folderName,
      data.firstName,
      data.appName,
      true
    );

    cy.apiLogout();

    cy.apiLogin();
    cy.visit(data.workspaceSlug);

    // Reset permissions
    cy.apiDeleteGranularPermission("builder", []);
    cy.apiDeleteGranularPermission(groupName, []);
    cy.apiCreateApp(data.appName);

    cy.ifEnv("Enterprise", () => {
      cy.apiCreateWorkflow(workflowName1);
      cy.apiCreateDataSource(
        `${Cypress.env("server_host")}/api/data-sources`,
        datasourceName1,
        "restapi",
        [{ key: "url", value: "https://jsonplaceholder.typicode.com/users" }]
      );
    });

    cy.apiLogout();
    cy.apiLogin(data.email);
    cy.visit(data.workspaceSlug);

    cy.get(commonSelectors.appCreateButton).should("be.enabled");
    cy.get(commonSelectors.appCard(data.appName)).should("not.exist");

    cy.ifEnv("Enterprise", () => {
      cy.get(commonSelectors.globalWorkFlowsIcon).click();
      cy.get('[data-cy="create-new-workflows-button"]').should("exist");
      cy.get(commonSelectors.appCard(workflowName1)).should("not.exist");

      cy.get(commonSelectors.globalDataSourceIcon).click();
      cy.get(dataSourceSelector.dataSourceNameButton(datasourceName1)).should(
        "exist"
      );
      cy.get(dataSourceSelector.commonDsLabelAndCount).click();
      cy.get('[data-cy="rest-api-add-button"]').should("be.enabled");
    });
  });
});
