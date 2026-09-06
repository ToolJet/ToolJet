// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// externalApi.js
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
//   allAppsDetails                   extApp.listAll       → externalApi
//   fetchWorkspaceApps               extApp.listByWorkspace → externalApi
//   createGroup                      extGroup.create      → externalApi
//   verifyUserInGroups               extUser.verifyGroups → externalApi
// └──────────────────────────────────────────────────────────────────┘
import { groupsSelector } from "Selectors/platform/manageGroups";
import { navigateToManageGroups } from 'Support/utils/common';
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
            Authorization: Cypress.env('AUTH_TOKEN'),
            "Content-Type": "application/json",
            ...headers,
        },
        failOnStatusCode: false
    });
};

/**
 * @tjType   extUser.create
 * @tjBlock  externalApi
 * @tjUsage  createUser(userData)
 * @tjDom    none - POST ext users
 */
export const createUser = (userData) => {
    return apiRequest("POST", `${Cypress.env('API_URL')}/ext/users`, userData);
};

/**
 * @tjType   extUser.get
 * @tjBlock  externalApi
 * @tjUsage  getUser(userId)
 * @tjDom    none - GET one ext user
 */
export const getUser = (userId) => {
    return apiRequest("GET", `${Cypress.env('API_URL')}/ext/user/${userId}`);
};

/**
 * @tjType   extUser.list
 * @tjBlock  externalApi
 * @tjUsage  getAllUsers()
 * @tjDom    none - GET all ext users
 */
export const getAllUsers = () => {
    return apiRequest("GET", `${Cypress.env('API_URL')}/ext/users`);
};

/**
 * @tjType   extUser.update
 * @tjBlock  externalApi
 * @tjUsage  updateUser(userId, userData)
 * @tjDom    none - PATCH ext user
 */
export const updateUser = (userId, userData) => {
    return apiRequest("PATCH", `${Cypress.env('API_URL')}/ext/user/${userId}`, userData);
};
/**
 * @tjType   extUser.updateRole
 * @tjBlock  externalApi
 * @tjUsage  updateUserRole(workspaceId, userData)
 * @tjDom    none - PATCH ext user role
 */
export const updateUserRole = (workspaceId, userData) => {
    return apiRequest("PUT", `${Cypress.env('API_URL')}/ext/update-user-role/workspace/${workspaceId}`, userData);
}

/**
 * @tjType   extUser.replaceWorkspace
 * @tjBlock  externalApi
 * @tjUsage  replaceUserWorkspace(userId, workspaceId, userData)
 * @tjDom    none - PUT ext user workspace
 */
export const replaceUserWorkspace = (userId, workspaceId, userData) => {
    return apiRequest("PATCH", `${Cypress.env('API_URL')}/ext/user/${userId}/workspace/${workspaceId}`, userData);
}

/**
 * @tjType   extUser.replaceWorkspaceRelations
 * @tjBlock  externalApi
 * @tjUsage  replaceUserWorkspacesRelations(userId, userData)
 * @tjDom    none - PUT ext user workspace relations
 */
export const replaceUserWorkspacesRelations = (userId, userData) => {
    return apiRequest("PUT", `${Cypress.env('API_URL')}/ext/user/${userId}/workspaces`, userData);
}

/**
 * @tjType   extWorkspace.list
 * @tjBlock  externalApi
 * @tjUsage  getAllWorkspaces()
 * @tjDom    none - GET ext workspaces
 */
export const getAllWorkspaces = () => {
    return apiRequest("GET", `${Cypress.env('API_URL')}/ext/workspaces`);
}

/**
 * @tjType   extApp.import
 * @tjBlock  externalApi
 * @tjUsage  importApp(workspaceId, appData, headers)
 * @tjDom    none - POST ext app import
 */
export const importApp = (workspaceId, appData, headers) => {
    return apiRequest("POST", `${Cypress.env('API_URL')}/ext/import/workspace/${workspaceId}/apps`, appData, headers);
}

/**
 * @tjType   extApp.export
 * @tjBlock  externalApi
 * @tjUsage  exportApp(workspaceId, appId, endpoint, headers)
 * @tjDom    none - GET ext app export
 */
export const exportApp = (workspaceId, appId, endpoint, headers) => {
    return apiRequest("POST", `${Cypress.env('API_URL')}/ext/export/workspace/${workspaceId}/apps/${appId}${endpoint}`, headers);
}

/**
 * @tjType   extApp.listAll
 * @tjBlock  externalApi
 * @tjUsage  allAppsDetails(workspaceIds)
 * @tjDom    none - GET apps across workspaces. [UNREFERENCED 2026-09-06]
 */
export const allAppsDetails = (workspaceIds) => {
    return apiRequest("GET", `${Cypress.env('API_URL')}/ext/workspace/${workspaceIds}/apps`);
}

/**
 * @tjType   extApp.listByWorkspace
 * @tjBlock  externalApi
 * @tjUsage  fetchWorkspaceApps(workspaceId, authToken)
 * @tjDom    none - GET apps for one workspace
 */
export const fetchWorkspaceApps = (workspaceId, authToken) => {
    const headers = authToken ? { Authorization: authToken } : {};
    return apiRequest(
        "GET",
        `${Cypress.env('API_URL')}/ext/workspace/${workspaceId}/apps`,
        {},
        headers
    );
}

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