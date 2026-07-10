import { groupsSelector } from "Selectors/manageGroups";
import { navigateToManageGroups } from "Support/utils/common";

// Shared auth-header constants for negative auth cases
export const invalidAuthHeader = { Authorization: "Basic invalid-token" };
export const emptyAuthHeader = { Authorization: "" };

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

export const createUser = (userData, headers = {}) => {
    return apiRequest("POST", `${Cypress.env("API_URL")}/ext/users`, userData, headers);
};

export const getUser = (userId, headers = {}) => {
    return apiRequest("GET", `${Cypress.env("API_URL")}/ext/user/${userId}`, {}, headers);
};

export const getAllUsers = (queryString = "", headers = {}) => {
    return apiRequest("GET", `${Cypress.env("API_URL")}/ext/users${queryString}`, {}, headers);
};

export const updateUser = (userId, userData, headers = {}) => {
    return apiRequest("PATCH", `${Cypress.env("API_URL")}/ext/user/${userId}`, userData, headers);
};

// ---------- Roles & workspace relations ----------

export const updateUserRole = (workspaceId, roleData, headers = {}) => {
    return apiRequest(
        "PUT",
        `${Cypress.env("API_URL")}/ext/update-user-role/workspace/${workspaceId}`,
        roleData,
        headers
    );
};

export const replaceUserWorkspace = (userId, workspaceId, workspaceData, headers = {}) => {
    return apiRequest(
        "PATCH",
        `${Cypress.env("API_URL")}/ext/user/${userId}/workspace/${workspaceId}`,
        workspaceData,
        headers
    );
};

export const replaceUserWorkspacesRelations = (userId, workspacesData, headers = {}) => {
    return apiRequest(
        "PUT",
        `${Cypress.env("API_URL")}/ext/user/${userId}/workspaces`,
        workspacesData,
        headers
    );
};

export const getAllWorkspaces = (headers = {}) => {
    return apiRequest("GET", `${Cypress.env("API_URL")}/ext/workspaces`, {}, headers);
};

// ---------- Apps ----------

export const importApp = (workspaceId, appData, headers = {}) => {
    return apiRequest(
        "POST",
        `${Cypress.env("API_URL")}/ext/import/workspace/${workspaceId}/apps`,
        appData,
        headers
    );
};

export const exportApp = (workspaceId, appId, queryString = "", headers = {}) => {
    return apiRequest(
        "POST",
        `${Cypress.env("API_URL")}/ext/export/workspace/${workspaceId}/apps/${appId}${queryString}`,
        {},
        headers
    );
};

export const fetchWorkspaceApps = (workspaceId, headers = {}) => {
    return apiRequest(
        "GET",
        `${Cypress.env("API_URL")}/ext/workspace/${workspaceId}/apps`,
        {},
        headers
    );
};

// ---------- Modules ----------

export const listWorkspaceModules = (workspaceId, headers = {}) => {
    return apiRequest(
        "GET",
        `${Cypress.env("API_URL")}/ext/workspace/${workspaceId}/modules`,
        {},
        headers
    );
};

export const exportModule = (workspaceId, moduleId, queryString = "", headers = {}) => {
    return apiRequest(
        "POST",
        `${Cypress.env("API_URL")}/ext/export/workspace/${workspaceId}/modules/${moduleId}${queryString}`,
        {},
        headers
    );
};

export const importModule = (workspaceId, moduleData, headers = {}) => {
    return apiRequest(
        "POST",
        `${Cypress.env("API_URL")}/ext/import/workspace/${workspaceId}/modules`,
        moduleData,
        headers
    );
};

// ---------- User metadata ----------

export const getUserMetadata = (workspaceId, userId, headers = {}) => {
    return apiRequest(
        "GET",
        `${Cypress.env("API_URL")}/ext/workspace/${workspaceId}/user/${userId}`,
        {},
        headers
    );
};

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
