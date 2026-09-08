import { groupsSelector } from "Selectors/platform/manageGroups";
import { navigateToManageGroups } from 'Support/utils/common';
export const apiRequest = (method, url, body = {}, headers = {}) => {
    return cy.request({
        method,
        url,
        body,
        headers: {
            Authorization: Cypress.env('AUTH_TOKEN'),
            "Content-Type": "application/json",
            ...headers,
        },
        failOnStatusCode: false
    });
};

export const createUser = (userData) => {
    return apiRequest("POST", `${Cypress.env('API_URL')}/ext/users`, userData);
};

export const getUser = (userId) => {
    return apiRequest("GET", `${Cypress.env('API_URL')}/ext/user/${userId}`);
};

export const getAllUsers = () => {
    return apiRequest("GET", `${Cypress.env('API_URL')}/ext/users`);
};

export const updateUser = (userId, userData) => {
    return apiRequest("PATCH", `${Cypress.env('API_URL')}/ext/user/${userId}`, userData);
};
export const updateUserRole = (workspaceId, userData) => {
    return apiRequest("PUT", `${Cypress.env('API_URL')}/ext/update-user-role/workspace/${workspaceId}`, userData);
}

export const replaceUserWorkspace = (userId, workspaceId, userData) => {
    return apiRequest("PATCH", `${Cypress.env('API_URL')}/ext/user/${userId}/workspace/${workspaceId}`, userData);
}

export const replaceUserWorkspacesRelations = (userId, userData) => {
    return apiRequest("PUT", `${Cypress.env('API_URL')}/ext/user/${userId}/workspaces`, userData);
}

export const getAllWorkspaces = () => {
    return apiRequest("GET", `${Cypress.env('API_URL')}/ext/workspaces`);
}

export const importApp = (workspaceId, appData, headers) => {
    return apiRequest("POST", `${Cypress.env('API_URL')}/ext/import/workspace/${workspaceId}/apps`, appData, headers);
}

export const exportApp = (workspaceId, appId, endpoint, headers) => {
    return apiRequest("POST", `${Cypress.env('API_URL')}/ext/export/workspace/${workspaceId}/apps/${appId}${endpoint}`, headers);
}

export const allAppsDetails = (workspaceIds) => {
    return apiRequest("GET", `${Cypress.env('API_URL')}/ext/workspace/${workspaceIds}/apps`);
}

export const fetchWorkspaceApps = (workspaceId, authToken) => {
    const headers = authToken ? { Authorization: authToken } : {};
    return apiRequest(
        "GET",
        `${Cypress.env('API_URL')}/ext/workspace/${workspaceId}/apps`,
        {},
        headers
    );
}

export const createGroup = (groupName) => {
    cy.get(groupsSelector.createNewGroupButton).click();
    cy.clearAndType(groupsSelector.groupNameInput, groupName);
    cy.get(groupsSelector.createGroupButton).click();
}

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

// ---------------------------------------------------------------------------
// Recovered helpers (dropped by PR #17763, restored from 1ec1b8cf23^).
// Used by externalApi/modules, users/userMetadataAPI, and
// workspace/workspaceUsersByGroupsAPI specs. All build on apiRequest above.
// ---------------------------------------------------------------------------

// Shared auth-header constants for negative auth cases
export const invalidAuthHeader = { Authorization: "Basic invalid-token" };
export const emptyAuthHeader = { Authorization: "" };

// ---------- Workspace modules (External API) ----------
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

// ---------- User metadata (External API) ----------
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

// ---------- Workspace users by groups (External API) ----------
export const getWorkspaceUsersByGroups = (workspaceId, payload, headers = {}) => {
    return apiRequest(
        "POST",
        `${Cypress.env("API_URL")}/ext/workspace/${workspaceId}/users`,
        payload,
        headers
    );
};