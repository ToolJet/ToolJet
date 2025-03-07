import { groupsSelector } from "Selectors/manageGroups";
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
export const createGroup = (groupName) => {
    cy.get(groupsSelector.createNewGroupButton).click();
    cy.clearAndType(groupsSelector.groupNameInput, groupName);
    cy.get(groupsSelector.createGroupButton).click();
}
export const validateUserInGroup = (email, workspaceSlug, groupName, shouldExist = true) => {
    if (workspaceSlug) cy.visit(workspaceSlug);
    navigateToManageGroups();
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.usersLink).click();
    const userRow = `[data-cy="${email}-user-row"]`;
    cy.get(userRow).should(shouldExist ? "exist" : "not.exist");
};