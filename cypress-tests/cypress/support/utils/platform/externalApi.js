// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// externalApi.js
//   invalidAuthHeader                -                    → externalApi
//   emptyAuthHeader                  -                    → externalApi
//   apiRequest                       -                    → externalApi
//   createUser                       extUser.create       → externalApi
//   getUser                          extUser.get          → externalApi
//   getAllUsers                      extUser.list         → externalApi
//   updateUser                       extUser.update       → externalApi
//   updateUserRole                   extUser.updateRole   → externalApi
//   replaceUserWorkspace             extUser.replaceWorkspace → externalApi
//   replaceUserWorkspacesRelations   extUser.replaceWorkspaceRelations → externalApi
//   getAllWorkspaces                 extWorkspace.list    → externalApi
//   importApp                        extApp.import        → externalApi
//   exportApp                        extApp.export        → externalApi
//   fetchWorkspaceApps               extApp.listByWorkspace → externalApi
//   allAppsDetails                   extApp.listAll       → externalApi
//   listWorkspaceModules             extModule.list       → externalApi
//   exportModule                     extModule.export     → externalApi
//   importModule                     extModule.import     → externalApi
//   getUserMetadata                  extUserMetadata.get  → externalApi
//   updateUserMetadata               extUserMetadata.update → externalApi
//   configureOrganizationGit         extGitSync.configure → gitSync
//   pushAppVersionToGit              extGitSync.push      → gitSync
//   createAppFromGit                 extGitSync.createApp → gitSync
//   pullAppChangesFromGit            extGitSync.pull      → gitSync
//   releaseAppFromGit                extGitSync.release   → gitSync
//   saveAppVersion                   extApp.saveVersion   → externalApi
//   createGroup                      extGroup.create      → externalApi
//   verifyUserInGroups               extUser.verifyGroups → externalApi
//   getWorkspaceUsersByGroups        extWorkspace.usersByGroups → externalApi
// └──────────────────────────────────────────────────────────────────┘
import { groupsSelector } from "Selectors/platform/manageGroups";
import { navigateToManageGroups } from "Support/utils/common";

// Shared auth-header constants for negative auth cases
/**
 * @tjType   -
 * @tjBlock  externalApi
 * @tjUsage  invalidAuthHeader()
 * @tjDom    none - malformed auth header for negative cases
 */
export const invalidAuthHeader = { Authorization: "Basic invalid-token" };
/**
 * @tjType   -
 * @tjBlock  externalApi
 * @tjUsage  emptyAuthHeader()
 * @tjDom    none - empty auth header for negative cases
 */
export const emptyAuthHeader = { Authorization: "" };

/**
 * @tjType   -
 * @tjBlock  externalApi
 * @tjUsage  apiRequest('GET', '/api/ext/users')
 * @tjDom    none - thin cy.request wrapper for the external API
 */
export const apiRequest = (method, url, body = {}, headers = {}) => {
    return cy.request({
        method,
        url,
        body,
        headers: {
            Authorization: Cypress.env("AUTH_TOKEN"),
            "Content-Type": "application/json",
            ...headers,
        },
        failOnStatusCode: false,
        timeout: 120000,
    });
};

// ---------- Users ----------

/**
 * @tjType   extUser.create
 * @tjBlock  externalApi
 * @tjUsage  createUser(userData)
 * @tjDom    none - POST ext users
 */
export const createUser = (userData, headers = {}) => {
    return apiRequest("POST", `${Cypress.env("API_URL")}/ext/users`, userData, headers);
};

/**
 * @tjType   extUser.get
 * @tjBlock  externalApi
 * @tjUsage  getUser(userId)
 * @tjDom    none - GET one ext user
 */
export const getUser = (userId, headers = {}) => {
    return apiRequest("GET", `${Cypress.env("API_URL")}/ext/user/${userId}`, {}, headers);
};

/**
 * @tjType   extUser.list
 * @tjBlock  externalApi
 * @tjUsage  getAllUsers()
 * @tjDom    none - GET all ext users
 */
export const getAllUsers = (queryString = "", headers = {}) => {
    return apiRequest("GET", `${Cypress.env("API_URL")}/ext/users${queryString}`, {}, headers);
};

/**
 * @tjType   extUser.update
 * @tjBlock  externalApi
 * @tjUsage  updateUser(userId, userData)
 * @tjDom    none - PATCH ext user
 */
export const updateUser = (userId, userData, headers = {}) => {
    return apiRequest("PATCH", `${Cypress.env("API_URL")}/ext/user/${userId}`, userData, headers);
};

// ---------- Roles & workspace relations ----------

/**
 * @tjType   extUser.updateRole
 * @tjBlock  externalApi
 * @tjUsage  updateUserRole(workspaceId, userData)
 * @tjDom    none - PATCH ext user role
 */
export const updateUserRole = (workspaceId, roleData, headers = {}) => {
    return apiRequest(
        "PUT",
        `${Cypress.env("API_URL")}/ext/update-user-role/workspace/${workspaceId}`,
        roleData,
        headers
    );
};

/**
 * @tjType   extUser.replaceWorkspace
 * @tjBlock  externalApi
 * @tjUsage  replaceUserWorkspace(userId, workspaceId, userData)
 * @tjDom    none - PUT ext user workspace
 */
export const replaceUserWorkspace = (userId, workspaceId, workspaceData, headers = {}) => {
    return apiRequest(
        "PATCH",
        `${Cypress.env("API_URL")}/ext/user/${userId}/workspace/${workspaceId}`,
        workspaceData,
        headers
    );
};

/**
 * @tjType   extUser.replaceWorkspaceRelations
 * @tjBlock  externalApi
 * @tjUsage  replaceUserWorkspacesRelations(userId, userData)
 * @tjDom    none - PUT ext user workspace relations
 */
export const replaceUserWorkspacesRelations = (userId, workspacesData, headers = {}) => {
    return apiRequest(
        "PUT",
        `${Cypress.env("API_URL")}/ext/user/${userId}/workspaces`,
        workspacesData,
        headers
    );
};

/**
 * @tjType   extWorkspace.list
 * @tjBlock  externalApi
 * @tjUsage  getAllWorkspaces()
 * @tjDom    none - GET ext workspaces
 */
export const getAllWorkspaces = (headers = {}) => {
    return apiRequest("GET", `${Cypress.env("API_URL")}/ext/workspaces`, {}, headers);
};

// ---------- Apps ----------

/**
 * @tjType   extApp.import
 * @tjBlock  externalApi
 * @tjUsage  importApp(workspaceId, appData, headers)
 * @tjDom    none - POST ext app import
 */
export const importApp = (workspaceId, appData, headers = {}) => {
    return apiRequest(
        "POST",
        `${Cypress.env("API_URL")}/ext/import/workspace/${workspaceId}/apps`,
        appData,
        headers
    );
};

/**
 * @tjType   extApp.export
 * @tjBlock  externalApi
 * @tjUsage  exportApp(workspaceId, appId, endpoint, headers)
 * @tjDom    none - GET ext app export
 */
export const exportApp = (workspaceId, appId, queryString = "", headers = {}) => {
    return apiRequest(
        "POST",
        `${Cypress.env("API_URL")}/ext/export/workspace/${workspaceId}/apps/${appId}${queryString}`,
        {},
        headers
    );
};

/**
 * @tjType   extApp.listByWorkspace
 * @tjBlock  externalApi
 * @tjUsage  fetchWorkspaceApps(workspaceId, authToken)
 * @tjDom    none - GET apps for one workspace
 */
export const fetchWorkspaceApps = (workspaceId, headers = {}) => {
    return apiRequest(
        "GET",
        `${Cypress.env("API_URL")}/ext/workspace/${workspaceId}/apps`,
        {},
        headers
    );
};

/**
 * @tjType   extApp.listAll
 * @tjBlock  externalApi
 * @tjUsage  allAppsDetails(workspaceIds)
 * @tjDom    none - GET apps across workspaces
 */
export const allAppsDetails = (workspaceIds, headers = {}) => {
    return apiRequest("GET", `${Cypress.env("API_URL")}/ext/workspace/${workspaceIds}/apps`, {}, headers);
};

// ---------- Modules ----------

/**
 * @tjType   extModule.list
 * @tjBlock  externalApi
 * @tjUsage  listWorkspaceModules(workspaceId)
 * @tjDom    none - GET ext modules
 */
export const listWorkspaceModules = (workspaceId, headers = {}) => {
    return apiRequest(
        "GET",
        `${Cypress.env("API_URL")}/ext/workspace/${workspaceId}/modules`,
        {},
        headers
    );
};

/**
 * @tjType   extModule.export
 * @tjBlock  externalApi
 * @tjUsage  exportModule(workspaceId, moduleId)
 * @tjDom    none - GET ext module export
 */
export const exportModule = (workspaceId, moduleId, queryString = "", headers = {}) => {
    return apiRequest(
        "POST",
        `${Cypress.env("API_URL")}/ext/export/workspace/${workspaceId}/modules/${moduleId}${queryString}`,
        {},
        headers
    );
};

/**
 * @tjType   extModule.import
 * @tjBlock  externalApi
 * @tjUsage  importModule(workspaceId, moduleData)
 * @tjDom    none - POST ext module import
 */
export const importModule = (workspaceId, moduleData, headers = {}) => {
    return apiRequest(
        "POST",
        `${Cypress.env("API_URL")}/ext/import/workspace/${workspaceId}/modules`,
        moduleData,
        headers
    );
};

// ---------- User metadata ----------

/**
 * @tjType   extUserMetadata.get
 * @tjBlock  externalApi
 * @tjUsage  getUserMetadata(userId)
 * @tjDom    none - GET ext user metadata
 */
export const getUserMetadata = (workspaceId, userId, headers = {}) => {
    return apiRequest(
        "GET",
        `${Cypress.env("API_URL")}/ext/workspace/${workspaceId}/user/${userId}`,
        {},
        headers
    );
};

/**
 * @tjType   extUserMetadata.update
 * @tjBlock  externalApi
 * @tjUsage  updateUserMetadata(userId, metadata)
 * @tjDom    none - PATCH ext user metadata
 */
export const updateUserMetadata = (workspaceId, userId, metadataPayload, headers = {}) => {
    return apiRequest(
        "PUT",
        `${Cypress.env("API_URL")}/ext/workspace/${workspaceId}/user/${userId}`,
        metadataPayload,
        headers
    );
};

// ---------- GitSync (kept for the deferred gitSync spec) ----------

/**
 * @tjType   extGitSync.configure
 * @tjBlock  gitSync
 * @tjUsage  configureOrganizationGit(workspaceId, config)
 * @tjDom    none - POST ext git-sync config
 */
export const configureOrganizationGit = (payload, headers = {}) => {
    return apiRequest("POST", `${Cypress.env("API_URL")}/ext/organizations/git`, payload, headers);
};

/**
 * @tjType   extGitSync.push
 * @tjBlock  gitSync
 * @tjUsage  pushAppVersionToGit(workspaceId, appId, versionId)
 * @tjDom    none - POST ext git push
 */
export const pushAppVersionToGit = (appId, versionId, payload, headers = {}) => {
    return apiRequest(
        "POST",
        `${Cypress.env("API_URL")}/ext/apps/${appId}/versions/${versionId}/git-sync/push`,
        payload,
        headers
    );
};

/**
 * @tjType   extGitSync.createApp
 * @tjBlock  gitSync
 * @tjUsage  createAppFromGit(workspaceId, gitAppName)
 * @tjDom    none - POST create app from git
 */
export const createAppFromGit = (payload, queryString = "?createMode=git", headers = {}) => {
    return apiRequest("POST", `${Cypress.env("API_URL")}/ext/apps${queryString}`, payload, headers);
};

/**
 * @tjType   extGitSync.pull
 * @tjBlock  gitSync
 * @tjUsage  pullAppChangesFromGit(workspaceId, appId)
 * @tjDom    none - POST ext git pull
 */
export const pullAppChangesFromGit = (appId, queryString = "?createMode=git", headers = {}) => {
    return apiRequest("PUT", `${Cypress.env("API_URL")}/ext/apps/${appId}${queryString}`, {}, headers);
};

/**
 * @tjType   extGitSync.release
 * @tjBlock  gitSync
 * @tjUsage  releaseAppFromGit(workspaceId, appId)
 * @tjDom    none - POST release a git-sourced app
 */
export const releaseAppFromGit = (appId, headers = {}) => {
    return apiRequest("POST", `${Cypress.env("API_URL")}/ext/apps/${appId}/git-sync/release`, {}, headers);
};

// POST /api/apps only creates an app shell — no app_versions row. The first
// pushable version must be created explicitly via this endpoint (SAVE_APP_VERSION).
/**
 * @tjType   extApp.saveVersion
 * @tjBlock  externalApi
 * @tjUsage  saveAppVersion(workspaceId, appId, versionId)
 * @tjDom    none - PUT ext app version
 */
export const saveAppVersion = (appIdOrSlug, payload = {}, headers = {}) => {
    return apiRequest("POST", `${Cypress.env("API_URL")}/ext/apps/${appIdOrSlug}/versions/save`, payload, headers);
};

// ---------- UI helper (used by non-externalApi specs) ----------

/**
 * @tjType   extGroup.create
 * @tjBlock  externalApi
 * @tjUsage  createGroup('QA Team')
 * @tjDom    none - POST ext group
 */
export const createGroup = (groupName) => {
    cy.get(groupsSelector.createNewGroupButton).click();
    cy.clearAndType(groupsSelector.groupNameInput, groupName);
    cy.get(groupsSelector.createGroupButton).click();
}

/**
 * @tjType   extUser.verifyGroups
 * @tjBlock  externalApi
 * @tjUsage  verifyUserInGroups(userEmail, ['QA Team'], true)
 * @tjDom    none - asserts group membership via the API
 */
export const verifyUserInGroups = (email, groupNames = [], shouldExist = true, workspaceSlug = 'my-workspace') => {
    if (workspaceSlug) cy.visit(workspaceSlug);
    navigateToManageGroups();

    groupNames.forEach((groupName) => {
        cy.get(groupsSelector.groupLink(groupName)).click();
        cy.get(groupsSelector.usersLink).click();

        cy.get(groupsSelector.userRow(email))
            .should(shouldExist ? "exist" : "not.exist")
            .then(($el) => {
                if (shouldExist) {
                    cy.wrap($el).scrollIntoView().should('be.visible');
                }
            });
    });
};

  /**
   * @tjType   extWorkspace.usersByGroups
   * @tjBlock  externalApi
   * @tjUsage  getWorkspaceUsersByGroups(workspaceId, payload, headers)
   * @tjDom    none - POST ext users-by-groups (group intersection)
   */
  export const getWorkspaceUsersByGroups = (workspaceId, payload, headers = {}) => {
      return apiRequest(
          "POST",
          `${Cypress.env("API_URL")}/ext/workspace/${workspaceId}/users`,
          payload,
          headers
      );
  };