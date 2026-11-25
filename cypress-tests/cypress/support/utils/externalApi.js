import { groupsSelector } from "Selectors/platform/manageGroups";
import { navigateToManageGroups } from 'Support/utils/common';

// Shared auth-header constants for negative auth cases
export const invalidAuthHeader = { Authorization: "Basic invalid-token" };
export const emptyAuthHeader = { Authorization: "" };

/**
 * @tjBlock  onboarding
 * @tjUsage  baseApiRequest(method, `${apiBaseUrl}${endpoint}`, body, headers)
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
 * @tjType   user.create
 * @tjBlock  externalApi
 * @tjUsage  createUser({})
 */
export const createUser = (userData, headers = {}) => {
    return apiRequest("POST", `${Cypress.env("API_URL")}/ext/users`, userData, headers);
};

/**
 * @tjType   user.get
 * @tjBlock  externalApi
 * @tjUsage  getUser(userId)
 */
export const getUser = (userId, headers = {}) => {
    return apiRequest("GET", `${Cypress.env("API_URL")}/ext/user/${userId}`, {}, headers);
};

/**
 * @tjType   allUsers.get
 * @tjBlock  externalApi
 * @tjUsage  getAllUsers("", invalidAuthHeader)
 */
export const getAllUsers = (queryString = "", headers = {}) => {
    return apiRequest("GET", `${Cypress.env("API_URL")}/ext/users${queryString}`, {}, headers);
};

/**
 * @tjType   user.update
 * @tjBlock  externalApi
 * @tjUsage  updateUser(userId, {})
 */
export const updateUser = (userId, userData, headers = {}) => {
    return apiRequest("PATCH", `${Cypress.env("API_URL")}/ext/user/${userId}`, userData, headers);
};

// ---------- Roles & workspace relations ----------

/**
 * @tjType   userRole.update
 * @tjBlock  externalApi
 * @tjUsage  updateUserRole(workspaceId, { newRole: "builder", userId })
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
 * @tjBlock  externalApi
 * @tjUsage  replaceUserWorkspace(userId, workspaceId, {})
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
 * @tjBlock  externalApi
 * @tjUsage  replaceUserWorkspacesRelations(id, [])
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
 * @tjType   allWorkspaces.get
 * @tjBlock  externalApi
 * @tjUsage  getAllWorkspaces()
 */
export const getAllWorkspaces = (headers = {}) => {
    return apiRequest("GET", `${Cypress.env("API_URL")}/ext/workspaces`, {}, headers);
};

// ---------- Apps ----------

/**
 * @tjType   app.import
 * @tjBlock  shared
 * @tjUsage  importApp(workspaceId, {})
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
 * @tjType   app.export
 * @tjBlock  shared
 * @tjUsage  exportApp(teamId, teamApp.id)
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
 * @tjBlock  externalApi
 * @tjUsage  fetchWorkspaceApps(workspaceId)
 */
export const fetchWorkspaceApps = (workspaceId, headers = {}) => {
    return apiRequest(
        "GET",
        `${Cypress.env("API_URL")}/ext/workspace/${workspaceId}/apps`,
        {},
        headers
    );
};

export const allAppsDetails = (workspaceIds, headers = {}) => {
    return apiRequest("GET", `${Cypress.env("API_URL")}/ext/workspace/${workspaceIds}/apps`, {}, headers);
};

// ---------- Modules ----------

/**
 * @tjBlock  externalApi
 * @tjUsage  listWorkspaceModules(workspaceId)
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
 * @tjType   module.export
 * @tjBlock  externalApi
 * @tjUsage  exportModule(workspaceId, moduleId)
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
 * @tjType   module.import
 * @tjBlock  externalApi
 * @tjUsage  importModule(workspaceId, requestData)
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
 * @tjType   userMetadata.get
 * @tjBlock  externalApi
 * @tjUsage  getUserMetadata(workspaceId, userId)
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
 * @tjType   userMetadata.update
 * @tjBlock  externalApi
 * @tjUsage  updateUserMetadata(workspaceId, userId, metadataPayload)
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

export const configureOrganizationGit = (payload, headers = {}) => {
    return apiRequest("POST", `${Cypress.env("API_URL")}/ext/organizations/git`, payload, headers);
};

export const pushAppVersionToGit = (appId, versionId, payload, headers = {}) => {
    return apiRequest(
        "POST",
        `${Cypress.env("API_URL")}/ext/apps/${appId}/versions/${versionId}/git-sync/push`,
        payload,
        headers
    );
};

export const createAppFromGit = (payload, queryString = "?createMode=git", headers = {}) => {
    return apiRequest("POST", `${Cypress.env("API_URL")}/ext/apps${queryString}`, payload, headers);
};

export const pullAppChangesFromGit = (appId, queryString = "?createMode=git", headers = {}) => {
    return apiRequest("PUT", `${Cypress.env("API_URL")}/ext/apps/${appId}${queryString}`, {}, headers);
};

export const releaseAppFromGit = (appId, headers = {}) => {
    return apiRequest("POST", `${Cypress.env("API_URL")}/ext/apps/${appId}/git-sync/release`, {}, headers);
};

// POST /api/apps only creates an app shell — no app_versions row. The first
// pushable version must be created explicitly via this endpoint (SAVE_APP_VERSION).
export const saveAppVersion = (appIdOrSlug, payload = {}, headers = {}) => {
    return apiRequest("POST", `${Cypress.env("API_URL")}/ext/apps/${appIdOrSlug}/versions/save`, payload, headers);
};

// ---------- UI helper (used by non-externalApi specs) ----------

export const createGroup = (groupName) => {
    cy.get(groupsSelector.createNewGroupButton).click();
    cy.clearAndType(groupsSelector.groupNameInput, groupName);
    cy.get(groupsSelector.createGroupButton).click();
}

/**
 * @tjType   user.verify
 * @tjBlock  shared
 * @tjUsage  verifyUserInGroups(data.email, ["Admin"])
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
   * @tjType   workspaceUsersByGroups.get
   * @tjBlock  externalApi
   * @tjUsage  getWorkspaceUsersByGroups(workspaceId, {})
   */
  export const getWorkspaceUsersByGroups = (workspaceId, payload, headers = {}) => {
      return apiRequest(
          "POST",
          `${Cypress.env("API_URL")}/ext/workspace/${workspaceId}/users`,
          payload,
          headers
      );
  };