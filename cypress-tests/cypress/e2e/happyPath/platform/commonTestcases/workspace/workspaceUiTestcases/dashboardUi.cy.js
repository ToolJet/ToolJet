import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { dashboardUiSelector } from "Selectors/dashboardUi";
import {
  cancelModal,
  createFolder,
  deleteDownloadsFolder,
  deleteFolder,
  openFolderDropdown,
  selectFolderFromDropdown,
  viewAppCardOptions
} from "Support/utils/common";
import {
  deleteApp,
  modifyAndVerifyAppCardIcon,
  verifyCloneApp,
  verifyContentTabs,
  verifyCreateFolderDialog,
  verifyEmptyState,
  verifyExportApp,
  verifyFolderAddAndRemove,
  verifyFolderBreadcrumb,
  verifyFolderDeleteDialog,
  verifyFolderEditAndRename,
  verifyFolderEmptyState,
  verifyImportDropdown,
  verifyModeToggle,
  verifyNotificationsPanel,
  verifyPagination,
  verifyRenameAndCleanup,
  verifyRenameAppDialog,
  verifySettingsMenu,
  verifySidebarIcons,
  verifyTopBar
} from "Support/utils/dashboard";
import {
  deleteItemForType,
  verifyCardOptionsForType,
  verifyCloneForType,
  verifyEmptyStateForType,
  verifyExportForType,
  verifyFolderBreadcrumbForType,
  verifyFolderEmptyStateForType,
  verifyImportDropdownForType,
  verifyTopBarForType,
} from "Support/utils/dashboard";
import { commonText } from "Texts/common";
import { dashboardUiText } from "Texts/dashboardUi";



const buildTypeConfigs = () => ({

  app: {
    label: "app",
    pluralLabel: "Applications",
    breadcrumbTitle: dashboardUiText.appBreadcrumbTitle,
    allItemsLinkText: commonText.allApplicationsLink,

    listingUrl: "/my-workspace",
    navigateToListing: () => { },

    createButtonSelector: dashboardUiSelector.createNewAppButton,
    createButtonText: dashboardUiText.createNewAppButton,

    emptyStateSelector: dashboardSelector.emptyPageContainer,
    emptyStateImageSelector: dashboardSelector.emptyPageImage,
    emptyStateHeaderSelector: dashboardSelector.emptyPageHeader,
    emptyStateDescSelector: dashboardSelector.emptyPageDescription,
    emptyStateHeaderText: dashboardUiText.appEmptyStateHeader,
    emptyStateDescText: dashboardUiText.appEmptyStateDescription,

    hasTemplateImport: true,

    renameOptionSelector: dashboardUiSelector.renameAppCardOption,
    renameOptionText: dashboardUiText.renameAppOption,
    hasClone: true,
    cloneOptionSelector: dashboardUiSelector.cloneAppCardOption,
    cloneOptionText: dashboardUiText.cloneAppOption,
    cloneToast: dashboardUiText.cloneAppToast,
    cloneNameInputSelector: null,
    cloneConfirmButtonSelector: null,
    exportOptionSelector: dashboardUiSelector.exportAppCardOption,
    exportOptionText: dashboardUiText.exportAppOption,
    deleteOptionSelector: dashboardUiSelector.deleteAppCardOption,
    deleteOptionText: dashboardUiText.deleteAppOption,
    deleteConfirmSelector: dashboardUiSelector.deleteFrontEndButton,

    exportToast: dashboardUiText.appExportedToast,
    deleteToast: commonText.appDeletedToast,
    exportFileContains: dashboardUiText.appExportFileContains,

    folderType: "applications",
    folderEmptyStateImageSelector: commonSelectors.empytyFolderImage,
    folderEmptyStateHeaderSelector: commonSelectors.emptyFolderText,
    folderEmptyStateHeaderText: commonText.emptyFolderText,

    apiCreate: (name) => cy.apiCreateApp(name),
    apiDelete: (name) => deleteApp(name),

    generateData: () => ({
      itemName: `${fake.companyName}-App`,
      folderName: `${fake.companyName.toLowerCase()}-folder`,
      cloneItemName: `cloned-${fake.companyName}-App`,
      updatedFolderName: `new-${fake.companyName.toLowerCase()}-folder`,
    }),

    hasDashboardOnlyTests: true,
    hasViewport: true,
    uiCreate: (name)=>{
        cy.createApp(name);
        cy.wait(3000);
        cy.backToApps();  
    },
  },

  module: {
    label: "module",
    pluralLabel: "Modules",
    breadcrumbTitle: dashboardUiText.moduleBreadcrumbTitle,
    allItemsLinkText: dashboardUiText.allModulesLink,

    listingUrl: "/my-workspace/modules",
    navigateToListing: () => {
      cy.get(dashboardUiSelector.modulesTabLabel, { timeout: 20000 }).click();
    },

    createButtonSelector: dashboardUiSelector.createNewModuleButton,
    createButtonText: dashboardUiText.createNewModuleButton,

    emptyStateSelector: dashboardUiSelector.moduleEmptyState,
    emptyStateImageSelector: dashboardUiSelector.moduleEmptyStateImage,
    emptyStateHeaderSelector: dashboardUiSelector.moduleEmptyStateHeader,
    emptyStateDescSelector: dashboardUiSelector.moduleEmptyStateDescription,
    emptyStateHeaderText: dashboardUiText.moduleEmptyStateHeader,
    emptyStateDescText: dashboardUiText.moduleEmptyStateDescription,

    hasTemplateImport: false,

    renameOptionSelector: dashboardUiSelector.renameModuleCardOption,
    renameOptionText: dashboardUiText.renameModuleOption,
    hasClone: true,
    cloneOptionSelector: dashboardUiSelector.cloneModuleCardOption,
    cloneOptionText: dashboardUiText.cloneModuleOption,
    cloneNameInputSelector: dashboardUiSelector.moduleNameInput,
    cloneConfirmButtonSelector: dashboardUiSelector.cloneModuleButton,
    exportOptionSelector: dashboardUiSelector.exportModuleCardOption,
    exportOptionText: dashboardUiText.exportModuleOption,
    deleteOptionSelector: dashboardUiSelector.deleteModuleCardOption,
    deleteOptionText: dashboardUiText.deleteModuleOption,
    deleteConfirmSelector: dashboardUiSelector.deleteModuleButton,

    exportToast: dashboardUiText.moduleExportedToast,
    deleteToast: dashboardUiText.moduleDeletedToast,
    exportFileContains: dashboardUiText.moduleExportFileContains,

    folderType: "modules",
    folderEmptyStateImageSelector: dashboardUiSelector.moduleEmptyStateImage,
    folderEmptyStateHeaderSelector: dashboardUiSelector.moduleEmptyStateHeader,
    folderEmptyStateHeaderText: dashboardUiText.moduleFolderEmptyStateHeader,

    apiCreate: (name) => cy.apiCreateModule(name),
    apiDelete: () => cy.apiDeleteModule(),

    generateData: () => ({
      itemName: `${fake.companyName.toLowerCase()}-module`,
      folderName: `${fake.companyName.toLowerCase()}-folder`,
      cloneItemName: `cloned-${fake.companyName.toLowerCase()}-module`,
      updatedFolderName: `new-${fake.companyName.toLowerCase()}-folder`,
    }),

    uiCreate: (name) => {
      cy.get(dashboardUiSelector.createNewModuleButton, { timeout: 10000 })
        .first()
        .click();
      cy.clearAndType(dashboardUiSelector.moduleNameInput, name);
      cy.get(dashboardUiSelector.createModuleButton).click();
      cy.wait(3000);
    },

    hasDashboardOnlyTests: false,
    hasViewport: true,
  },

  workflow: {
    label: "workflow",
    pluralLabel: "Workflows",
    breadcrumbTitle: dashboardUiText.workflowBreadcrumbTitle,
    allItemsLinkText: dashboardUiText.allWorkflowsLink,

    listingUrl: "/my-workspace/workflows",
    navigateToListing: () => {
      cy.get(commonSelectors.globalWorkFlowsIcon).click();
    },

    createButtonSelector: dashboardUiSelector.createNewWorkflowButton,
    createButtonText: dashboardUiText.createNewWorkflowButton,

    emptyStateSelector: dashboardUiSelector.workflowEmptyState,
    emptyStateImageSelector: dashboardUiSelector.workflowEmptyStateImage,
    emptyStateHeaderSelector: dashboardUiSelector.workflowEmptyStateHeader,
    emptyStateDescSelector: dashboardUiSelector.workflowEmptyStateDescription,
    emptyStateHeaderText: dashboardUiText.workflowEmptyStateHeader,
    emptyStateDescText: dashboardUiText.workflowEmptyStateDescription,

    hasTemplateImport: false,

    renameOptionSelector: dashboardUiSelector.renameWorkflowCardOption,
    renameOptionText: dashboardUiText.renameWorkflowOption,
    hasClone: false,
    cloneOptionSelector: null,
    cloneOptionText: null,
    cloneNameInputSelector: null,
    cloneConfirmButtonSelector: null,
    exportOptionSelector: dashboardUiSelector.exportWorkflowCardOption,
    exportOptionText: dashboardUiText.exportWorkflowOption,
    deleteOptionSelector: dashboardUiSelector.deleteWorkflowCardOption,
    deleteOptionText: dashboardUiText.deleteWorkflowOption,
    deleteConfirmSelector: dashboardUiSelector.deleteWorkflowButton,

    exportToast: dashboardUiText.workflowExportedToast,
    deleteToast: dashboardUiText.workflowDeletedToast,
    exportFileContains: dashboardUiText.workflowExportFileContains,

    folderType: "workflows",
    folderEmptyStateImageSelector: dashboardUiSelector.workflowEmptyStateImage,
    folderEmptyStateHeaderSelector: dashboardUiSelector.workflowEmptyStateHeader,
    folderEmptyStateHeaderText: dashboardUiText.workflowFolderEmptyStateHeader,

    apiCreate: (name) => cy.apiCreateWorkflow(name),
    apiDelete: (name) => cy.apiDeleteWorkflow(name),

    generateData: () => ({
      itemName: `${fake.companyName}-Workflow`,
      folderName: `${fake.companyName.toLowerCase()}-folder`,
      cloneItemName: null,
      updatedFolderName: `new-${fake.companyName.toLowerCase()}-folder`,
    }),

    uiCreate: (name) => {
      cy.get(dashboardUiSelector.createNewWorkflowButton).first().click();
      cy.clearAndType(dashboardUiSelector.workflowNameInput, name);
      cy.get(dashboardUiSelector.createWorkflowButton).click();
      cy.wait(3000);
    },

    hasDashboardOnlyTests: false,
    hasViewport: false,
  },
});


[ "app", "module", "workflow" ].forEach((type) => {
  describe(`Dashboard UI — ${type} listing`, () => {
    let data = {};
    let config = {};

    beforeEach(() => {
      config = buildTypeConfigs()[type];
      data = config.generateData();

      cy.intercept("GET", "/api/library_apps").as("appLibrary");
      cy.intercept("DELETE", "/api/folders/*").as("folderDeleted");
      deleteDownloadsFolder();
      cy.apiLogin();
      if (config.hasViewport) {
        cy.viewport(1440, 1200);
      }
    });

    it(`should verify the elements on empty ${type} listing page`, () => {
      cy.intercept("GET", "/api/apps*", {
        fixture: "intercept/emptyDashboard.json",
      }).as(`${type}Page`);

      cy.visit("/my-workspace");

      if (type === "app") {
        cy.intercept("GET", "/api/metadata", {
          body: { installed_version: "2.9.2", version_ignored: false },
        }).as("version");

        verifyTopBar();
        verifyFolderBreadcrumb();
        verifyContentTabs();
        verifyNotificationsPanel();
        verifyModeToggle();
        verifySettingsMenu("2.9.2");
        verifyEmptyState();
        verifyImportDropdown();
        verifyPagination();
        verifySidebarIcons();
      } else {
        cy.wait(2000);
        config.navigateToListing();

        verifyTopBarForType(config);
        verifyFolderBreadcrumbForType(config);
        verifyEmptyStateForType(config);
        verifyImportDropdownForType(config);
        verifyPagination();
      }
    });

    it(`should verify ${type} card elements and card operations`, () => {
      cy.exec("mkdir -p ./cypress/downloads/");
      if (type === "app") {
        cy.exec("cd ./cypress/downloads/ && rm -rf '*'");
      }

      if (type === "app") {
        const renamedItemName = `${data.itemName}-Renamed`;

        cy.visit("/my-workspace");
        config.uiCreate(data.itemName);
        cy.wait(2000);
        cy.get(commonSelectors.appCreationDetails, {timeout: 20000}).first().should("exist");
        cy.get(commonSelectors.appCard(data.itemName)).should("be.visible");
        cy.get(commonSelectors.appTitle(data.itemName))
          .first()
          .should("have.text", data.itemName);

        verifyRenameAppDialog(data.itemName, renamedItemName);
        cy.wait(500);
        modifyAndVerifyAppCardIcon(data.itemName);
        cy.wait(500);
        createFolder(data.folderName);
        cy.wait(500);
        cy.get('[data-cy="apps-tab-label"]').click();
        verifyFolderAddAndRemove(data.itemName, data.folderName);
        cy.wait(500);
        verifyExportApp(data.itemName);
        cy.wait(500)
        verifyCloneApp(data.itemName, data.cloneItemName);
        cy.wait(500);
        verifyRenameAndCleanup(data.itemName, renamedItemName);
      } else {
        cy.visit(config.listingUrl);
        cy.wait(1500);
        config.uiCreate(data.itemName);

        if (type === "module") {
          cy.url().should("include", "/apps/");
        }
        cy.visit(config.listingUrl);
        cy.wait(2000);

        cy.get(commonSelectors.appCard(data.itemName), { timeout: 10000 })
          .should("contain.text", data.itemName)
          .and("be.visible");
        cy.get(commonSelectors.appTitle(data.itemName))
          .first()
          .should("have.text", data.itemName);

        verifyCardOptionsForType(data.itemName, config);
        cy.wait(500);
        modifyAndVerifyAppCardIcon(data.itemName);
        cy.wait(500);
        createFolder(data.folderName);
        cy.wait(500);

        type==='module'?cy.get('[data-cy="modules-tab-label"]').click():cy.get('[data-cy="icon-workflows"]').click();
        
        verifyFolderAddAndRemove(data.itemName, data.folderName, config.folderType);
        cy.wait(500);
        verifyExportForType(data.itemName, config, type);
        cy.wait(500);
        if (config.hasClone) {
          verifyCloneForType(data.itemName, data.cloneItemName, config);
        }

        if (type === "workflow") {
          viewAppCardOptions(data.itemName);
          cy.get(config.deleteOptionSelector).click();
          cy.get(commonSelectors.modalMessage).should("be.visible");
          cy.get(
            commonSelectors.buttonSelector(commonText.cancelButton)
          ).verifyVisibleElement("have.text", commonText.cancelButton);
          cy.get(config.deleteConfirmSelector).verifyVisibleElement(
            "have.text",
            config.deleteOptionText
          );
          cancelModal(commonText.cancelButton);
        }
        cy.wait(500);
        deleteItemForType(data.itemName, config);
      }
    });

    it(`should verify folder CRUD operation on ${type} page`, () => {
      config.apiCreate(data.itemName);
      cy.visit(config.listingUrl);
      cy.wait(2000);

      verifyCreateFolderDialog(data.folderName);

      if (type === "app") {
        verifyFolderEmptyState(data.folderName);
        verifyFolderEditAndRename(data.folderName, data.updatedFolderName);
        verifyFolderDeleteDialog(data.updatedFolderName);
        deleteFolder(data.updatedFolderName);

        openFolderDropdown();
        cy.get(dashboardSelector.folderName(data.updatedFolderName)).should("not.exist");
        cy.wait(2000);
        selectFolderFromDropdown(commonText.allApplicationsLink.toLowerCase());
        cy.apiDeleteApp();
      } else {
        verifyFolderEmptyStateForType(data.folderName, config);
        verifyFolderEditAndRename(data.folderName, data.updatedFolderName);
        verifyFolderDeleteDialog(data.updatedFolderName);
        deleteFolder(data.updatedFolderName);

        openFolderDropdown();
        cy.get(dashboardSelector.folderName(data.updatedFolderName)).should("not.exist");

        if (type === "module") {
          cy.apiDeleteModule();
        } else {
          cy.apiDeleteWorkflow(data.itemName);
        }
      }
    });
  });
});
