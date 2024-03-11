describe("Subscription key", () => {
  before("", () => {
    cy.apiLogin();
  });
  it("Should update subscription key", () => {
    cy.apiLogin();
    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: `
                INSERT INTO public.organization_license (
                    id, organization_id, license_type, expiry_date, license_key, terms
                )
                VALUES (
                    '97a55d31-e26b-4060-9b44-06b03cdbb600',
                    '${Cypress.env("workspaceId")}',
                    'enterprise',
                    '2025-12-13',
                    '',
                    '{
                        "expiry": "2025-12-13",
                        "type": "enterprise",
                        "workspaceId": "${Cypress.env("workspaceId")}",
                        "users": {
                          "total": 1000,
                          "editor": 500,
                          "viewer": 500,
                          "superadmin": 5
                        },
                        "database": {
                          "table": ""
                        },
                        "features": {
                          "oidc": true,
                          "auditLogs": true,
                          "ldap": true,
                          "customStyling": true
                        },
                        "meta": {
                          "generatedFrom": "API",
                          "customerId": "de382f8f-e7d4-4cc2-b420-69308a200343"
                        }
                      }'
                );
            `,
    });
  });
});
