import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { postgresUIConfig, postgresFormConfig } from "Constants/constants/marketplace/datasources/postgres";

const data = {};
const tableName = "cypress_test_users";

describe("PostgreSQL", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit('http://localhost:8082/my-workspace/data-sources');
    cy.waitForElement('[data-cy="postgresql-button"]');
    cy.get('[data-cy="postgresql-button"]').click();
  });
  it.only('should verify UI elements of PostgreSQL connection form', () => {
    verifyConnectionFormUI(postgresUIConfig.defaultFields);
  });

  it.only('should verify functionalities of PostgreSQL connection form', () => {
    fillDSConnectionForm(postgresFormConfig.defaultFields);
    verifyDSConnection();
  });

  it('should verify PostgreSQL data source connection with valid credentials', () => { });


























  it("1. PostgreSQL - Verify connection form UI elements - ALL FIELDS", () => {


  });

  it("2. PostgreSQL - Verify data source connection with valid credentials", () => {
    // Fill form config


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