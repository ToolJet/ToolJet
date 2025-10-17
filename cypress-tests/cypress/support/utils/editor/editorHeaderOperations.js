export const renameApp = (name) => {
    cy.get('[data-cy="edit-app-name-button"]').click();
    cy.get("[data-cy='app-name-input']").type(`{selectAll}{backspace}${name}`, { force: true });
    cy.get("[data-cy='rename-app']").click();
};

export const verifyAppName = (name) => {
    cy.get('[data-cy="edit-app-name-button"]').should("have.text", name);
}

export const verifyCurrentEnvironment = (envName) => {
    cy.get('[data-cy="list-current-env-name"]').should("have.text", envName);
}

export const verifyCurrentVersion = (version) => {
    cy.get('[data-cy*="-current-version-text"]').should("have.text", version);
}

export const addNewVersion = (newVersion, fromVersion) => {
    cy.get('[data-cy*="-current-version-text"]').click();
    cy.get('[data-cy="create-new-version-button"]').click();
    if (fromVersion) {
        cy.get('[data-cy="create-version-from-input-field"]').click();
        cy.contains('[id*="react-select"]', fromVersion).click();
    }
    cy.get('[data-cy="version-name-input-field"]').type(newVersion, { force: true });
    cy.get('[data-cy="create-new-version-button"]').click();
    cy.verifyToastMessage("Version Created");
};

export const promoteEnv = () => {
    cy.get('[data-cy="promote-button"]').first().click();
    cy.get('[data-cy="promote-button"]').last().click();
}



// import { renameApp, verifyAppName, verifyCurrentEnvironment, verifyCurrentVersion, addNewVersion, promoteEnv } from 'cypress-tests/cypress/support/utils/editor/editorHeaderOperations';