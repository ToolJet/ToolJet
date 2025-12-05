import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";

const data = {};
const tableName = "cypress_test_users";

describe("PostgreSQL data source connection and query", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit('http://localhost:8082/my-workspace/data-sources');
    cy.waitForElement('[data-cy="postgresql-button"]');
    cy.get('[data-cy="postgresql-button"]').click();
  });

  it("1. PostgreSQL - Verify connection form UI elements - ALL FIELDS", () => {
    // UI Validation Config - Testing ALL field types
    const postgresUIConfig = {
      fields: [
        // ===== TOGGLE FIELDS =====
        {
          type: "toggle",
          fieldName: "Allow dynamic connection parameters",
          validations: {
            defaultValue: false,
            disabled: false
          }
        },

        // ===== DROPDOWN FIELDS =====
        {
          type: "dropdown",
          fieldName: "Connection type",
          validations: {
            defaultValue: 'Manual connection',
            disabled: false
          }
        },

        // ===== INPUT FIELDS =====
        {
          type: "input",
          fieldName: "Host",
          validations: {
            isRequired: true,
            placeholder: "Enter host",
            defaultValue: "localhost",
            disabled: false
          }
        },
        {
          type: "input",
          fieldName: "Port",
          validations: {
            isRequired: true,
            placeholder: "Enter port",
            defaultValue: "5432",
            disabled: false
          }
        },
        {
          type: "input",
          fieldName: "Database name",
          validations: {
            isRequired: false,
            placeholder: "Name of the database",
            defaultValue: "",
            disabled: false
          }
        },
        {
          type: "input",
          fieldName: "Username",
          validations: {
            isRequired: true,
            placeholder: "Enter username",
            defaultValue: "",
            disabled: false
          }
        },

        // ===== TOGGLE FIELDS =====
        {
          type: "toggle",
          fieldName: "SSL",
          validations: {
            defaultValue: true,
            disabled: false
          }
        },

        // ===== ENCRYPTED FIELDS =====
        {
          type: "encrypted",
          fieldName: "Password",
          validations: {
            isRequired: true,
            placeholder: "**************",
            defaultValue: "",
            disabled: true,
            hasEditButton: true,
            showEncrypted: true,
            hasEyeIcon: true
          }
        },

        // ===== KEY-VALUE FIELDS =====
        {
          type: "keyValue",
          selector: "Connection options",
          validations: {
            hasAddButton: true,
            rows: [
              {
                key: "",
                value: "",
                keyPlaceholder: "Key",
                valuePlaceholder: "Value",
                hasDeleteButton: true
              }
            ]
          }
        }
      ]
    };

    // Verify UI elements
    verifyConnectionFormUI(postgresUIConfig);
  });

  it("2. PostgreSQL - Verify data source connection with valid credentials", () => {
    // Fill form config
    const postgresConfig = {
      fields: [
        {
          type: "input",
          fieldName: "Host",
          text: `${Cypress.env('pg_host')}`
        },
        {
          type: "input",
          fieldName: "Port",
          text: "5432"
        },
        {
          type: "input",
          fieldName: "Username",
          text: `${Cypress.env('pg_user')}`
        },
        {
          type: "password",
          fieldName: "Password",
          text: `${Cypress.env('pg_password')}`
        },
        {
          type: "toggle",
          buttonName: "ssl-enabled",
          shouldBeChecked: false
        },
        {
          type: "keyValue",
          selector: "Connection options",
          keyValueData: [
            { key: "test", value: "value123" }
          ]
        }
      ]
    };

    // Fill the form
    fillDSConnectionForm(postgresConfig);

    // Verify connection
    verifyDSConnection();
  });

  it("3. PostgreSQL - Verify UI and connection together", () => {
    // First validate UI
    const postgresUIConfig = {
      fields: [
        {
          type: "input",
          fieldName: "Host",
          validations: {
            label: { text: "Host", isRequired: true },
            placeholder: "Enter host"
          }
        },
        {
          type: "input",
          fieldName: "Port",
          validations: {
            label: { text: "Port", isRequired: true },
            placeholder: "Enter port"
          }
        },
        {
          type: "encrypted",
          fieldName: "Password",
          validations: {
            label: { text: "Password", isRequired: true },
            hasEditButton: true,
            showEncrypted: true
          }
        }
      ]
    };

    verifyConnectionFormUI(postgresUIConfig);

    // Then fill and test connection
    const postgresConfig = {
      fields: [
        {
          type: "input",
          fieldName: "Host",
          text: `${Cypress.env('pg_host')}`
        },
        {
          type: "input",
          fieldName: "Port",
          text: "5432"
        },
        {
          type: "input",
          fieldName: "Username",
          text: `${Cypress.env('pg_user')}`
        },
        {
          type: "password",
          fieldName: "Password",
          text: `${Cypress.env('pg_password')}`
        }
      ]
    };

    fillDSConnectionForm(postgresConfig);
    verifyDSConnection();
  });
});