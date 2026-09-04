import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { multiEnvSelector, versionModalSelector } from "Selectors/eeCommon";
import { moduleSelectors } from "Selectors/platform/modules";
import {
  createFolder,
  verifyModal,
  viewAppCardOptions,
} from "Support/utils/common";
import { modifyAndVerifyAppCardIcon } from "Support/utils/dashboard";
import {
  attemptDeleteModuleFromList,
  createModuleViaUI,
  defineModuleContract,
  dropModuleComponent,
  openModulesList,
  renameModuleFromList,
} from "Support/utils/platform/modules";
import { commonText } from "Texts/common";
import { dashboardText } from "Texts/dashboard";

describe(
  "Modules — Empty State, Creation & Card Operations",
  () => {
    const testId = Date.now();
    const wsName = `modules-crud-${testId}`;
    const wsSlug = wsName;
    const moduleName = `QA Module ${testId}`;
    const renamedModuleName = `QA Module ${testId} Renamed`;
    const clonedModuleName = `QA Module ${testId} Clone`;
    const folderName = `QA Modules Folder ${testId}`;
    const lifecycleModuleName = `QA Lifecycle ${testId}`;
    const lifecycleRenamedModuleName = `QA Lifecycle ${testId} Ren`;
    const lifecycleClonedModuleName = `QA Lifecycle ${testId} Clone`;

    let workspaceId;

    before(() => {
      cy.apiLogin();
      cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
        workspaceId = res.body.organization_id;
        Cypress.env("workspaceId", workspaceId);
        Cypress.env("workspaceSlug", wsSlug);
      });
    });

    after(() => {
      cy.apiLogin();
      cy.then(() => cy.apiArchiveWorkspace(workspaceId));
    });

    beforeEach(() => {
      cy.apiLogin();
    });

    it("verifies the empty state of the Modules list page", () => {
      cy.visit(`/${Cypress.env("workspaceSlug")}/modules`);

      cy.get(commonSelectors.pageSectionHeader).should(
        "contain.text",
        "Modules",
      );
      cy.get(commonSelectors.buttonSelector("create new modules")).should(
        "be.visible",
      );
      cy.get('[data-cy="import-dropdown-menu"]').should("be.visible");
      cy.get('[data-cy="create-new-folder-button"]').should("be.visible");
      cy.get(moduleSelectors.allModulesLink)
        .should("be.visible")
        .and("have.text", "All modules");

      // Empty-state illustration, copy, and its own "Create module" CTA.
      cy.get(".empty-module-container").should("be.visible");
      cy.get(".empty-module-container").should(
        "contain.text",
        "Create reusable groups of components and queries via modules.",
      );
      cy.contains(".empty-module-container a", "Check out our guide")
        .should("be.visible")
        .and(
          "have.attr",
          "href",
          "https://docs.tooljet.com/docs/app-builder/modules/overview",
        );
      cy.get(".empty-module-container").should(
        "contain.text",
        "on creating modules.",
      );
      cy.get('[data-cy="button-import-an-app"]').should("be.visible");
      cy.get('[data-cy="create-module"]').should(
        "contain.text",
        "Create new module",
      );
    });

    it("creates a module via UI, drags a component onto the canvas, and shows version/environment/sidebar details", () => {
      createModuleViaUI(moduleName);
      dropModuleComponent();

      // Environment tag.
      cy.get(multiEnvSelector.environmentsTag("development")).should(
        "be.visible",
      );

      // Version tag details
      cy.get(moduleSelectors.versionSwitcherButton).click();
      cy.get(versionModalSelector.versionName("v1")).should("be.visible");
      cy.get(versionModalSelector.draftTag("v1")).should("be.visible");
      cy.get(moduleSelectors.versionSwitcherButton).click();

      // Builder — sidebar, canvas, query manager.
      cy.get(commonWidgetSelector.sidebarinspector).should("be.visible");
      cy.get(commonSelectors.canvas).should("be.visible");
      cy.get(commonSelectors.rightSidebarPlusButton).should("be.visible");
      cy.get('[data-cy="query-manager-toggle-button"]').should("be.visible");

      // Input/Output contract.
      defineModuleContract();

      openModulesList();
      cy.get(commonSelectors.appCard(moduleName)).should("be.visible");

      // Duplicate name rejection.
      cy.get(commonSelectors.buttonSelector("create new modules"))
        .first()
        .click();
      cy.get(moduleSelectors.moduleNameInput).type(moduleName);
      cy.get(moduleSelectors.createModuleSubmitButton).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        "This app name is already taken.",
      );
      cy.get(commonSelectors.cancelButton).click();
    });

    it("runs the full card-menu lifecycle on a fresh module — change icon, add to folder, rename, clone, export, delete", () => {
      createModuleViaUI(lifecycleModuleName);
      openModulesList();

      // Change icon
      viewAppCardOptions(lifecycleModuleName);
      modifyAndVerifyAppCardIcon(lifecycleModuleName);

      // Add to folder.
      createFolder(folderName);
      viewAppCardOptions(lifecycleModuleName);
      cy.get(
        commonSelectors.appCardOptions(commonText.addToFolderOption),
      ).click();
      verifyModal(
        dashboardText.updateFolderTitle,
        dashboardText.addToFolderButton,
        dashboardSelector.selectFolder,
      );
      cy.get(dashboardSelector.moveAppText).within(() => {
        cy.get("label").first().should("have.text", "Move selected apps");
        cy.get(".selected-value").should("contain.text", lifecycleModuleName);
      });
      cy.get(dashboardSelector.selectFolder).click();
      cy.get(commonSelectors.folderList).contains(folderName).click();
      cy.get(dashboardSelector.addToFolderButton).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        dashboardText.bulkMoveSuccessToast(folderName),
        false,
      );
      cy.get(dashboardSelector.folderName(folderName)).verifyVisibleElement(
        "have.text",
        dashboardText.folderName(`${folderName} (1)`),
      );

      cy.get(dashboardSelector.folderName(folderName)).click();
      cy.get(commonSelectors.appCard(lifecycleModuleName))
        .contains(lifecycleModuleName)
        .should("be.visible");

      // Rename.
      cy.get(moduleSelectors.allModulesLink).click({ force: true });
      renameModuleFromList(lifecycleModuleName, lifecycleRenamedModuleName);
      cy.get(commonSelectors.toastMessage).should("be.visible");
      cy.get(commonSelectors.appCard(lifecycleRenamedModuleName)).should(
        "be.visible",
      );
      cy.get(commonSelectors.appCard(lifecycleModuleName)).should("not.exist");

      // Clone
      viewAppCardOptions(lifecycleRenamedModuleName);
      cy.get(commonSelectors.appCardOptions("clone module")).click();
      cy.get(commonSelectors.modalTitle("clone module")).verifyVisibleElement(
        "have.text",
        "Clone module",
      );
      cy.get(moduleSelectors.moduleNameLabel).verifyVisibleElement(
        "have.text",
        "Module name",
      );
      cy.get(moduleSelectors.moduleNameInput).verifyVisibleElement(
        "have.value",
        `${lifecycleRenamedModuleName}_Copy`,
      );
      cy.get(moduleSelectors.moduleNameInfoLabel).verifyVisibleElement(
        "have.text",
        "Module name must be unique and max 100 characters",
      );
      cy.get(commonSelectors.cancelButton).verifyVisibleElement(
        "have.text",
        commonText.cancelButton,
      );
      cy.get(moduleSelectors.cloneModuleButton).verifyVisibleElement(
        "have.text",
        "Clone module",
      );
      cy.get(moduleSelectors.cloneModuleButton).should("be.enabled");
      cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");

      // Cancel via the X — editing the name first has no effect.
      cy.clearAndType(
        moduleSelectors.moduleNameInput,
        lifecycleClonedModuleName,
      );
      cy.get(commonWidgetSelector.modalCloseButton).click();

      // Cancel via the Cancel button — also has no effect.
      viewAppCardOptions(lifecycleRenamedModuleName);
      cy.get(commonSelectors.appCardOptions("clone module")).click();
      cy.get(moduleSelectors.moduleNameInput).verifyVisibleElement(
        "have.value",
        `${lifecycleRenamedModuleName}_Copy`,
      );
      cy.clearAndType(
        moduleSelectors.moduleNameInput,
        lifecycleClonedModuleName,
      );
      cy.get(commonSelectors.cancelButton).click();

      // Reopen and confirm for real this time.
      viewAppCardOptions(lifecycleRenamedModuleName);
      cy.get(commonSelectors.appCardOptions("clone module")).click();
      cy.get(moduleSelectors.moduleNameInput).verifyVisibleElement(
        "have.value",
        `${lifecycleRenamedModuleName}_Copy`,
      );
      cy.clearAndType(
        moduleSelectors.moduleNameInput,
        lifecycleClonedModuleName,
      );
      cy.get(moduleSelectors.cloneModuleButton).should("be.enabled").click();

      // Cloning navigates straight into the new module's editor.
      cy.url({ timeout: 15000 }).should("include", "/apps/");

      openModulesList();
      cy.get(commonSelectors.appCard(lifecycleRenamedModuleName)).should(
        "be.visible",
      );
      cy.get(commonSelectors.appCard(lifecycleClonedModuleName)).should(
        "be.visible",
      );

      // Export
      viewAppCardOptions(lifecycleClonedModuleName);
      cy.get(commonSelectors.appCardOptions("export module")).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        "Module has been exported successfully!",
      );

      // Delete both modules created in this test.
      attemptDeleteModuleFromList(lifecycleClonedModuleName);
      cy.get(commonSelectors.appCard(lifecycleClonedModuleName)).should(
        "not.exist",
      );

      attemptDeleteModuleFromList(lifecycleRenamedModuleName);
      cy.get(commonSelectors.appCard(lifecycleRenamedModuleName)).should(
        "not.exist",
      );
    });
  },
);
