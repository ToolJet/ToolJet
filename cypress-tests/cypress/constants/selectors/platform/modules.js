import { cyParamName } from "Selectors/common";


export const moduleSelectors = {

  appCardMenuIcon: '[data-cy="app-card-menu-icon"]',

  allModulesLink: '[data-cy="all-modules-link"]',


  moduleNameInput: '[data-cy="module-name-input"]',
  moduleNameLabel: '[data-cy="module-name-label"]',
  moduleNameInfoLabel: '[data-cy="module-name-info-label"]',
  createModuleSubmitButton: 'button[data-cy="create-module"]',
  renameModuleSubmitButton: 'button[data-cy="rename-module"]',
  cloneModuleButton: '[data-cy="clone-module"]',

  // ─── Module editor (module-mode app builder) ──────────────────────────────
  editAppNameButton: '[data-cy="edit-app-name-button"]', // pencil icon -> opens Rename module modal
  versionSwitcherButton: '[data-cy="version-switcher-button"]',
  versionLockBanner: '[data-cy="version-lock-banner"]',

  moduleContainerWidget: '[data-cy="draggable-widget-ModuleContainer"]',

  // ─── ModuleContainerInspector (module contract editor) ────────────────────

  inputItem: (name) => `[data-cy="input-item-${cyParamName(name)}"]`,
  outputItem: (name) => `[data-cy="output-item-${cyParamName(name)}"]`,

  blankModuleContent: '.module-blank-content',

  // ─── ModuleManager (RightSideBar "Modules" tab, inside a consuming app) ───

  moduleManagerCardTitle: (moduleName) => `.module-title:contains("${moduleName}")`,

  // ─── Workspace Settings -> Groups -> Permissions (coarse, Modules row) ────
  resourceModules: '[data-cy="resource-modules"]',
  moduleCreateCheckbox: '[data-cy="module-create-checkbox"]',
  moduleDeleteCheckbox: '[data-cy="module-delete-checkbox"]',

  // ─── Workspace Settings -> Groups -> Granular access (Modules row) ────────
  moduleGranularAccess: '[data-cy="module-granular-access"]',
  moduleEditRadio: '[data-cy="module-edit-radio"]',
  moduleBuildWithRadio: '[data-cy="module-build-with-radio"]',
  moduleHideFromDashboardCheckbox: '[data-cy="module-hide-from-dashboard-checkbox"]',

  // ─── "Add permission" modal — Modules resource type ───────────────────────

  addModuleButton: '[data-cy="add-module-button"]',
  buildWithPermissionRadio: '[data-cy="build-with-permission-radio"]',
};
