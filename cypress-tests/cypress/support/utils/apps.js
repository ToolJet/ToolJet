import { commonSelectors, commonWidgetSelector } from "Selectors/common";

const slugValidations = [
    { input: "", error: "App slug can't be empty" },
    { input: "_2#", error: "Special characters are not accepted." },
    { input: "t ", error: "Cannot contain spaces" },
    { input: "T", error: "Only lowercase letters are accepted." },
];

export const verifySlugValidations = (inputSelector) => {
    slugValidations.forEach(({ input, error }) => {
        cy.get(inputSelector).clear();
        if (input) cy.clearAndType(inputSelector, input);
        cy.wait(500);
        cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
            "have.text",
            error
        );
    });
};

export const verifySuccessfulSlugUpdate = (workspaceId, slug) => {
    const host = resolveHost();
    cy.get('[data-cy="app-slug-accepted-label"]').verifyVisibleElement(
        "have.text",
        "Slug accepted!"
    );

    cy.wait(500);
    // cy.get(commonWidgetSelector.appLinkSucessLabel).should('be.visible');
    cy.get(commonWidgetSelector.appLinkSucessLabel).should(
        "have.text",
        "Link updated successfully!"
    );
    cy.get(commonWidgetSelector.appLinkField).verifyVisibleElement(
        "have.text",
        `${host}/${workspaceId}/apps/${slug}`
    );
};

export const verifyURLs = (workspaceId, slug, page) => {
    const baseUrl = Cypress.config("baseUrl");

    cy.url().should(
        "eq",
        page
            ? `${baseUrl}/${workspaceId}/apps/${slug}/home`
            : `${baseUrl}/${workspaceId}/apps/${slug}`
    );

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.url().should("eq", `${baseUrl}/applications/${slug}/home?version=v1`);

    cy.visit("/my-workspace");
    cy.visitSlug({
        actualUrl: `${baseUrl}/applications/${slug}`,
    });
    cy.url().should("eq", `${baseUrl}/applications/${slug}`);
};

export const setUpSlug = (slug) => {
    cy.get(commonWidgetSelector.shareAppButton).click();
    cy.clearAndType(commonWidgetSelector.appNameSlugInput, slug);
    cy.get('[data-cy="app-slug-accepted-label"]')
        .should("be.visible")
        .and("have.text", "Slug accepted!");
    cy.get(commonWidgetSelector.modalCloseButton).click();
};

export const setupAppWithSlug = (appName, slug) => {
    cy.apiCreateApp(appName);
    cy.apiAddComponentToApp(appName, "text1");
    cy.apiReleaseApp(appName);
    cy.apiAddAppSlug(appName, slug);
};

export const verifyRestrictedAccess = () => {
    cy.get('[data-cy="modal-header"]').should("have.text", "Restricted access");
    cy.get('[data-cy="modal-description"]')
        .invoke("text")
        .then((text) => {
            const normalizedText = text.replace(/’/g, "'");
            expect(normalizedText).to.equal(
                "You don't have access to this app. Kindly contact admin to know more."
            );
        });
    cy.get('[data-cy="back-to-home-button"]').verifyVisibleElement(
        "have.text",
        "Back to home page"
    );
};

export const onboardUserFromAppLink = (
    email,
    slug,
    workspaceName = "My workspace",
    isNonExistingUser = true
) => {
    const dbConfig = Cypress.env("app_db");

    const query = isNonExistingUser
        ? `
          SELECT u.invitation_token, o.id AS workspace_id, ou.invitation_token AS organization_token
          FROM users u
          JOIN organization_users ou ON u.id = ou.user_id
          JOIN organizations o ON ou.organization_id = o.id
          WHERE u.email = '${email}' AND o.name = '${workspaceName}';
        `
        : `
          SELECT ou.invitation_token, o.id AS workspace_id
          FROM users u
          JOIN organization_users ou ON u.id = ou.user_id
          JOIN organizations o ON ou.organization_id = o.id
          WHERE u.email = '${email}' AND o.name = '${workspaceName}';
        `;

    cy.task("dbConnection", { dbconfig: dbConfig, sql: query }).then((resp) => {
        if (!resp.rows || resp.rows.length === 0) {
            throw new Error(
                `No records found for email: ${email} and workspace: ${workspaceName}`
            );
        }

        const { invitation_token, workspace_id, organization_token } = resp.rows[0];
        const token = isNonExistingUser ? organization_token : invitation_token;
        const url = isNonExistingUser
            ? `${Cypress.config("baseUrl")}/invitations/${invitation_token}/workspaces/${organization_token}?oid=${workspace_id}&redirectTo=%2Fapplications%2F${slug}`
            : `${Cypress.config("baseUrl")}/organization-invitations/${token}?oid=${workspace_id}&redirectTo=%2Fapplications%2F${slug}`;

        cy.visit(url);
    });
};

export const resolveHost = () => {
    const baseUrl = Cypress.config("baseUrl");

    const urlMapping = {
        "http://localhost:3000": "http://localhost:3000",
        "http://localhost:3000/apps": "http://localhost:3000/apps",
        "http://localhost:4001": "http://localhost:3000",
        "http://localhost:4001/apps": "http://localhost:3000/apps",
    };

    return urlMapping[baseUrl];
};
