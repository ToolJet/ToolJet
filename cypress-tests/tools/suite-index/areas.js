const AREAS = [
  "modules", "access", "apps", "workspace", "licensing", "superAdmin", "onboarding",
  "externalApi", "gitSync", "tooljetDatabase", "workflows", "cloud", "shared",
];

const APP_BUILDER_BLOCKS = [
  "properties", "styles", "events", "csa", "inspector", "canvas", "contexts", "common",
  "pages", "editor", "querymanager",
];

const PLATFORM_BLOCKS = [
  "modules", "access", "apps", "workspace", "licensing", "superAdmin", "onboarding",
  "externalApi", "gitSync", "cloud", "shared",
];

// First match wins. Paths are relative to cypress-tests/.
const PATH_RULES = [
  { prefixes: ["cypress/support/utils/appBuilder/", "cypress/commands/appbuilder/", "cypress/constants/selectors/appBuilder/"], suite: "appBuilder", area: null },
  { prefixes: ["cypress/commands/platform/gitSync", "cypress/support/utils/platform/apiUtils/gitSyncApi.js", "cypress/constants/selectors/platform/gitsync.js"], suite: "platform", area: "gitSync" },
  { prefixes: ["cypress/commands/platform/cloudApiCommands.js", "cypress/support/utils/platform/cloudSubscription.js", "cypress/support/utils/platform/ai.js"], suite: "platform", area: "cloud" },
  { prefixes: ["cypress/support/utils/platform/modules.js"], suite: "platform", area: "modules" },
  { prefixes: ["cypress/support/utils/externalApi.js"], suite: "platform", area: "externalApi" },
  { prefixes: ["cypress/support/utils/workflows/", "cypress/commands/workflows/"], suite: "workflows", area: "workflows" },
  { prefixes: ["cypress/support/utils/tooljetDatabase/", "cypress/constants/selectors/tooljetDatabase/"], suite: "tooljetDatabase", area: "tooljetDatabase" },
  { prefixes: ["cypress/support/utils/platform/", "cypress/commands/platform/", "cypress/support/utils/manage", "cypress/support/utils/license.js", "cypress/support/utils/onboarding.js", "cypress/constants/selectors/platform/"], suite: "platform", area: "shared" },
  { prefixes: ["cypress/support/", "cypress/commands/", "cypress/constants/selectors/"], suite: "shared", area: "shared" },
];

const BLOCKS_BY_SUITE = {
  appBuilder: APP_BUILDER_BLOCKS,
  platform: PLATFORM_BLOCKS,
  workflows: ["workflows", "shared"],
  tooljetDatabase: ["tooljetDatabase", "shared"],
  // shared files such as utils/commonWidget.js still carry legacy App Builder tags
  shared: ["shared", ...APP_BUILDER_BLOCKS],
};

const H = "cypress/e2e/happyPath/";
const EE_PLATFORM = "cypress-ee-platform.config.js";
const SPEC_AREAS = [
  { area: "onboarding", specGlobs: [`${H}platform/firstUser/**`, `${H}platform/commonTestcases/userManagment/**`, `${H}platform/eeTestcases/sso/**`], config: EE_PLATFORM },
  { area: "access", specGlobs: [`${H}platform/commonTestcases/workspace/groups/**`, `${H}platform/eeTestcases/apps/folderPermissions/**`, `${H}platform/eeTestcases/dataSourceFolders/**`], config: EE_PLATFORM },
  { area: "apps", specGlobs: [`${H}platform/commonTestcases/apps/**`], config: EE_PLATFORM },
  { area: "modules", specGlobs: [`${H}platform/eeTestcases/modules/**`], config: EE_PLATFORM },
  { area: "workspace", specGlobs: [`${H}platform/commonTestcases/workspace/workspaceUiTestcases/**`, `${H}platform/commonTestcases/workspaceConstants/**`, `${H}platform/ceTestcases/**`, `${H}platform/eeTestcases/settings/**`, `${H}platform/eeTestcases/multi-env/**`, `${H}platform/eeTestcases/userMetadata/**`], config: EE_PLATFORM },
  { area: "licensing", specGlobs: [`${H}platform/eeTestcases/licensing/basicPlanTestcases/**`, `${H}platform/eeTestcases/licensing/paidPlanTestcases/**`, `${H}platform/eeTestcases/licensing/updateLicense.cy.js`], config: EE_PLATFORM },
  { area: "licensing", specGlobs: [`${H}platform/eeTestcases/licensing/ai/**`], config: "cypress.config.js" },
  { area: "superAdmin", specGlobs: [`${H}platform/eeTestcases/superAdmin/**`], config: EE_PLATFORM },
  { area: "externalApi", specGlobs: [`${H}platform/eeTestcases/externalApi/**`], config: EE_PLATFORM },
  { area: "gitSync", specGlobs: [`${H}platform/eeTestcases/gitSync/**`], config: "cypress-gitsync.config.js" },
  { area: "cloud", specGlobs: [`${H}platform/cloudTestcases/**`], config: "cypress-cloud-platform.config.js" },
  { area: "workflows", specGlobs: [`${H}workflows/**`], config: "cypress-workflows.config.js" },
  { area: "workflows", specGlobs: [`${H}platform/eeTestcases/workflows/**`], config: EE_PLATFORM },
  { area: "tooljetDatabase", specGlobs: [`${H}tooljetDatabase/**`], config: "cypress-tooljet-database.config.js" },
];

function rule(relPath) {
  return PATH_RULES.find(r => r.prefixes.some(p => relPath.startsWith(p))) || null;
}

function suiteForPath(relPath) {
  const r = rule(relPath);
  return r ? r.suite : "shared";
}

function defaultAreaForPath(relPath) {
  const r = rule(relPath);
  return r ? r.area : "shared";
}

function validBlocks(suite) {
  return BLOCKS_BY_SUITE[suite] || [];
}

module.exports = { AREAS, APP_BUILDER_BLOCKS, suiteForPath, defaultAreaForPath, validBlocks, SPEC_AREAS };
