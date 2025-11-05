import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonWidgetText } from "Texts/common";
import { commonSelectors } from "Selectors/common";
import {
  deleteDatasource,
  closeDSModal,
  verifyCouldnotConnectWithAlert,
} from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { sqlServerSelector } from "Selectors/sqlServer";
import { sqlServerText } from "Texts/sqlServer";
import { performQueryAction } from "Support/utils/queries";

const data = {};
const tableName = "cypress_test_users";
describe("Data sources SQL server connection and query", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Should verify elements on connection form with validation", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    cy.get(postgreSqlSelector.allDatasourceLabelAndCount).should(
      "have.text",
      postgreSqlText.allDataSources()
    );
    cy.get(postgreSqlSelector.commonlyUsedLabelAndCount).should(
      "have.text",
      postgreSqlText.commonlyUsed
    );
    cy.get(postgreSqlSelector.databaseLabelAndCount).should(
      "have.text",
      postgreSqlText.allDatabase()
    );
    cy.get(postgreSqlSelector.apiLabelAndCount).should(
      "have.text",
      postgreSqlText.allApis
    );
    cy.get(postgreSqlSelector.cloudStorageLabelAndCount).should(
      "have.text",
      postgreSqlText.allCloudStorage
    );

    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-sql-server`,
      "mssql",
      [
        { key: "host", value: "localhost" },
        { key: "instanceName", value: "" },
        { key: "port", value: 1433 },
        { key: "database", value: "" },
        { key: "username", value: "" },
        { key: "password", value: "", encrypted: true },
        { key: "azure", value: false, encrypted: false },
      ]
    );
    cy.reload();
    cy.get(`[data-cy="cypress-${data.dataSourceName}-sql-server-button"]`)
      .should("be.visible")
      .click();
    cy.get(dataSourceSelector.dsNameInputField).should(
      "have.value",
      `cypress-${data.dataSourceName}-sql-server`
    );

    const requiredFields = [
      postgreSqlText.labelHost,
      postgreSqlText.labelPort,
      postgreSqlText.labelDbName,
      postgreSqlText.labelUserName,
      postgreSqlText.labelPassword,
    ];
    const sections = [
      postgreSqlText.labelHost,
      postgreSqlText.labelPort,
      postgreSqlText.labelDbName,
      postgreSqlText.labelUserName,
      postgreSqlText.labelPassword,
      postgreSqlText.labelConnectionOptions,
    ];
    sections.forEach((section) => {
      if (section === postgreSqlText.labelConnectionOptions) {
        cy.get(dataSourceSelector.keyInputField(section, 0)).should(
          "be.visible"
        );
        cy.get(dataSourceSelector.valueInputField(section, 0)).should(
          "be.visible"
        );
        cy.get(dataSourceSelector.deleteButton(section, 0)).should(
          "be.visible"
        );
        cy.get(dataSourceSelector.addMoreButton(section)).should("be.visible");
      } else if (requiredFields.includes(section)) {
        cy.get(dataSourceSelector.labelFieldName(section)).verifyVisibleElement(
          "have.text",
          `${section}*`
        );
        cy.get(dataSourceSelector.textField(section)).should("be.visible");
        if (section === postgreSqlText.labelPassword) {
          cy.get(
            dataSourceSelector.button(postgreSqlText.editButtonText)
          ).click();
          cy.verifyRequiredFieldValidation(section, "rgb(215, 45, 57)");
        } else {
          cy.get(dataSourceSelector.textField(section)).click();
          cy.get(commonSelectors.textField(section)).should(
            "have.css",
            "border-color",
            "rgba(0, 0, 0, 0)"
          );
          cy.get(dataSourceSelector.textField(section))
            .type("123")
            .clear()
            .blur();
          cy.verifyRequiredFieldValidation(section, "rgb(215, 45, 57)");
        }
      } else {
        cy.get(dataSourceSelector.labelFieldName(section)).verifyVisibleElement(
          "have.text",
          section
        );
        cy.get(dataSourceSelector.textField(section)).should("be.visible");
      }
    });

    cy.get(sqlServerSelector.labelInstance).verifyVisibleElement(
      "have.text",
      sqlServerText.labelInstance
    );
    cy.get(sqlServerSelector.labelAzureEncryptConnection).verifyVisibleElement(
      "have.text",
      sqlServerText.labelAzureEncryptConnection
    );

    cy.get(dataSourceSelector.toggleInput(sqlServerText.azureText)).should(
      "be.visible"
    );
    cy.get(postgreSqlSelector.labelIpWhitelist).verifyVisibleElement(
      "have.text",
      postgreSqlText.whiteListIpText
    );
    cy.get(postgreSqlSelector.buttonCopyIp).verifyVisibleElement(
      "have.text",
      postgreSqlText.textCopy
    );

    cy.get(postgreSqlSelector.linkReadDocumentation).verifyVisibleElement(
      "have.text",
      postgreSqlText.readDocumentation
    );
    cy.get(postgreSqlSelector.buttonTestConnection)
      .verifyVisibleElement(
        "have.text",
        postgreSqlText.buttonTextTestConnection
      )
      .click();
    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .and("be.disabled");
    //verifyCouldnotConnectWithAlert(mySqlText.errorConnectionRefused);
    cy.get(dataSourceSelector.connectionAlertText).verifyVisibleElement(
      "have.text",
      "Failed to connect to :1433 - Could not connect (sequence)"
    );
    deleteDatasource(`cypress-${data.dataSourceName}-sql-server`);
  });

  it("Should verify the functionality of SQL Server connection form", () => {
    const dsName = `cypress-${data.dataSourceName}-sql-server`;
    cy.get(commonSelectors.globalDataSourceIcon).click();
    //invalid database
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      dsName,
      "mssql",
      [
        { key: "host", value: `${Cypress.env("sqlserver_host")}` },
        { key: "instanceName", value: "" },
        { key: "port", value: 1433 },
        { key: "database", value: "unknowndb" },
        { key: "username", value: `${Cypress.env("sqlserver_user")}` },
        {
          key: "password",
          value: `${Cypress.env("sqlserver_password")}`,
          encrypted: true,
        },
        { key: "azure", value: false, encrypted: false },
      ]
    );
    cy.get(dataSourceSelector.dataSourceNameButton(dsName))
      .should("be.visible")
      .click();
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.wait(500);
    verifyCouldnotConnectWithAlert("Login failed for user 'sa'.");

    //invalid username
    cy.reload();
    cy.apiUpdateGDS({
      name: dsName,
      options: [
        { key: "host", value: `${Cypress.env("sqlserver_host")}` },
        { key: "instanceName", value: "" },
        { key: "port", value: 1433 },
        { key: "database", value: `${Cypress.env("sqlserver_db")}` },
        { key: "username", value: "admin1" },
        {
          key: "password",
          value: `${Cypress.env("sqlserver_password")}`,
          encrypted: true,
        },
        { key: "azure", value: false, encrypted: false },
      ],
    });
    cy.get(dataSourceSelector.dataSourceNameButton(dsName))
      .should("be.visible")
      .click();
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.wait(500);
    verifyCouldnotConnectWithAlert("Login failed for user 'admin1'.");

    //invalid password
    cy.reload();
    cy.apiUpdateGDS({
      name: dsName,
      options: [
        { key: "host", value: `${Cypress.env("sqlserver_host")}` },
        { key: "instanceName", value: "" },
        { key: "port", value: 1433 },
        { key: "database", value: `${Cypress.env("sqlserver_db")}` },
        { key: "username", value: `${Cypress.env("sqlserver_user")}` },
        { key: "password", value: "testpassword", encrypted: true },
        { key: "azure", value: false, encrypted: false },
      ],
    });
    cy.get(dataSourceSelector.dataSourceNameButton(dsName))
      .should("be.visible")
      .click();
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.wait(500);
    verifyCouldnotConnectWithAlert("Login failed for user 'sa'.");

    //valid data
    cy.reload();
    cy.apiUpdateGDS({
      name: dsName,
      options: [
        { key: "host", value: `${Cypress.env("sqlserver_host")}` },
        { key: "instanceName", value: "" },
        { key: "port", value: 1433 },
        { key: "database", value: `${Cypress.env("sqlserver_db")}` },
        { key: "username", value: `${Cypress.env("sqlserver_user")}` },
        {
          key: "password",
          value: `${Cypress.env("sqlserver_password")}`,
          encrypted: true,
        },
        { key: "azure", value: false, encrypted: false },
      ],
    });
    cy.get(dataSourceSelector.dataSourceNameButton(dsName))
      .should("be.visible")
      .click();
    cy.get(postgreSqlSelector.buttonTestConnection).click();

    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);
    cy.apiDeleteGDS(dsName);
  });

  it("Should verify elements of the Query section", () => {
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-sqlserver`,
      "mssql",
      [
        { key: "host", value: `${Cypress.env("sqlserver_host")}` },
        { key: "instanceName", value: "" },
        { key: "port", value: 1433 },
        { key: "database", value: `${Cypress.env("sqlserver_db")}` },
        { key: "username", value: `${Cypress.env("sqlserver_user")}` },
        {
          key: "password",
          value: `${Cypress.env("sqlserver_password")}`,
          encrypted: true,
        },
        { key: "azure", value: false, encrypted: false },
      ]
    );
    cy.apiCreateApp(`${fake.companyName}-sqlserver`);
    cy.openApp();

    cy.apiAddQueryToApp({
      queryName: "table-creation",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
      },
      dsName: `cypress-${data.dataSourceName}-sqlserver`,
      dsKind: "mssql",
    });
    cy.reload();
    cy.get(
      '[data-cy="query-name-label"] > .bg-transparent'
    ).verifyVisibleElement("contain", "table-creation");
    cy.get(
      postgreSqlSelector.labelQueryTab(postgreSqlText.queryTabSetup)
    ).verifyVisibleElement("have.text", postgreSqlText.queryTabSetup);
    cy.contains("Parameters").should("be.visible");
    cy.get('[data-cy="runjs-add-param-button"]').should("be.visible");
    cy.contains("Source").should("be.visible");
    cy.get(".css-zz6spl-container").should("be.visible");
    cy.get(".w-100 > .react-select__control > .react-select__value-container")
      .should("be.visible")
      .and("have.text", `cypress-${data.dataSourceName}-sqlserver`);

    cy.get(postgreSqlSelector.queryPreviewButton).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonLabelPreview
    );
    cy.get(postgreSqlSelector.queryCreateAndRunButton).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonLabelRun
    );

    cy.get(
      ".css-1e7irc7-container > .react-select__control > .react-select__value-container"
    )
      .scrollIntoView()
      .should("be.visible")
      .click();
    cy.contains("[id*=react-select-]", postgreSqlText.queryModeGui).should(
      "have.text",
      postgreSqlText.queryModeGui
    );
    cy.contains("[id*=react-select-]", postgreSqlText.queryModeSql)
      .should("have.text", postgreSqlText.queryModeSql)
      .click();

    cy.get('[data-cy="query-input-field"]').should("be.visible");
    cy.get('[data-cy="label-sql-parameters"]').should("be.visible");
    cy.get(
      ":nth-child(1) > > .code-editor-basic-wrapper > .codehinter-container"
    ).should("be.visible");
    cy.get(
      ":nth-child(2) > > .code-editor-basic-wrapper > .codehinter-container"
    ).should("be.visible");
    cy.get(
      ".flex-grow-1 > :nth-child(1) > :nth-child(1) > .justify-content-center"
    ).should("be.visible");
    cy.get(".flex-grow-1 > :nth-child(1) > .tj-base-btn").should("be.visible");
    cy.get(
      postgreSqlSelector.labelQueryTab(postgreSqlText.queryTabTransformation)
    )
      .verifyVisibleElement("have.text", postgreSqlText.queryTabTransformation)
      .click();
    cy.get("input#enableTransformation").should("exist");
    cy.get(".ps-1").verifyVisibleElement(
      "have.text",
      postgreSqlText.headerTransformation
    );
    cy.get(postgreSqlSelector.inputFieldTransformation).should("be.visible");

    cy.get(postgreSqlSelector.labelQueryTab(postgreSqlText.queryTabSettings))
      .verifyVisibleElement("have.text", postgreSqlText.queryTabSettings)
      .click();
    cy.contains("Triggers").should("be.visible");
    cy.get(postgreSqlSelector.labelRunQueryOnPageLoad).verifyVisibleElement(
      "have.text",
      postgreSqlText.toggleLabelRunOnPageLoad
    );
    cy.get(
      postgreSqlSelector.labelRequestConfirmationOnRun
    ).verifyVisibleElement("have.text", postgreSqlText.toggleLabelconfirmation);
    cy.get(postgreSqlSelector.labelShowNotification).verifyVisibleElement(
      "have.text",
      postgreSqlText.toggleLabelShowNotification
    );

    cy.get(postgreSqlSelector.toggleNotification).should("exist");
    cy.get('label[for="showSuccessNotification"]').click();

    cy.get(postgreSqlSelector.labelSuccessMessageInput).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelSuccessMessage
    );
    cy.get(postgreSqlSelector.notificationDurationInput).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelNotificatioDuration
    );
    cy.get(postgreSqlSelector.addEventHandler).verifyVisibleElement(
      "have.text",
      commonWidgetText.addEventHandlerLink
    );
    cy.get(postgreSqlSelector.noEventHandlerMessage).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelNoEventhandler
    );
    cy.get(postgreSqlSelector.addEventHandler)
      .verifyVisibleElement("have.text", commonWidgetText.addEventHandlerLink)
      .click();
    cy.get('[data-cy="event-handler"]').should("be.visible");

    performQueryAction("table-creation", "rename", "updated-table-creation");
    performQueryAction("updated-table-creation", "duplicate");
    performQueryAction("updated-table-creation_copy", "delete");
    cy.apiDeleteApp(`${fake.companyName}-sqlserver`);
    cy.apiDeleteGDS(`cypress-${data.dataSourceName}-sqlserver`);
  });

  it("Should verify CRUD operations on SQL Query", () => {
    const dsName = `cypress-${data.dataSourceName}-crud-sqlserver`;
    const dsKind = "mssql";
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      dsName,
      dsKind,
      [
        { key: "host", value: `${Cypress.env("sqlserver_host")}` },
        { key: "instanceName", value: "" },
        { key: "port", value: 1433 },
        { key: "database", value: `${Cypress.env("sqlserver_db")}` },
        { key: "username", value: `${Cypress.env("sqlserver_user")}` },
        {
          key: "password",
          value: `${Cypress.env("sqlserver_password")}`,
          encrypted: true,
        },
        { key: "azure", value: false, encrypted: false },
      ]
    );
    cy.apiCreateApp(`${fake.companyName}-sqlserver-CRUD-App`);
    cy.openApp();

    cy.apiAddQueryToApp({
      queryName: "table-creation",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${tableName}' AND xtype='U')
      CREATE TABLE [dbo].[${tableName}] (
        [id] int IDENTITY(1,1) PRIMARY KEY,
        [name] nvarchar(255) NOT NULL,
        [email] nvarchar(255) UNIQUE NOT NULL,
        [age] int,
        [created_at] datetime2 DEFAULT GETDATE()
      );`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery();
    });

    cy.apiAddQueryToApp({
      queryName: "insert_user",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `INSERT INTO ${tableName} (name, email, age)
      OUTPUT INSERTED.*
      VALUES ('Alice', 'alice@example.com', 30);`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data).to.be.an("array").with.length(1);
        expect(response.body.data[0]).to.include({
          name: "Alice",
          email: "alice@example.com",
          age: 30,
        });
      });
    });

    cy.apiAddQueryToApp({
      queryName: "read_user",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `SELECT * FROM ${tableName}
      WHERE email = 'alice@example.com';`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.data[0].name).to.eq("Alice");
      });
    });

    cy.apiAddQueryToApp({
      queryName: "table_preview",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `SELECT * FROM ${tableName}`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery();
    });

    cy.apiAddQueryToApp({
      queryName: "update_user",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `UPDATE ${tableName}
      SET name = 'Alice Updated', age = 31
      OUTPUT INSERTED.*
      WHERE email = 'alice@example.com';`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.data[0].name).to.eq("Alice Updated");
      });
    });

    cy.apiAddQueryToApp({
      queryName: "delete_user",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `DELETE FROM ${tableName}
      OUTPUT DELETED.*
      WHERE email = 'alice@example.com';`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.data[0].email).to.eq("alice@example.com");
      });
    });

    cy.apiAddQueryToApp({
      queryName: "existance_of_table",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `SELECT CASE WHEN EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = '${tableName}'
      ) THEN 1 ELSE 0 END AS table_exists;`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery();
    });

    cy.apiAddQueryToApp({
      queryName: "truncate_table",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `TRUNCATE TABLE ${tableName}`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery();
    });

    cy.apiAddQueryToApp({
      queryName: "drop_table",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `DROP TABLE IF EXISTS ${tableName}`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery();
    });

    cy.apiDeleteApp(`${fake.companyName}-sqlserver-CRUD-App`);
    cy.apiDeleteGDS(dsName);
  });

  it("Should verify bulk update operation", () => {
    const dsName = `cypress-${data.dataSourceName}-bulk-sqlserver`;
    const dsKind = "mssql";
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      dsName,
      dsKind,
      [
        { key: "host", value: `${Cypress.env("sqlserver_host")}` },
        { key: "instanceName", value: "" },
        { key: "port", value: 1433 },
        { key: "database", value: `${Cypress.env("sqlserver_db")}` },
        { key: "username", value: `${Cypress.env("sqlserver_user")}` },
        {
          key: "password",
          value: `${Cypress.env("sqlserver_password")}`,
          encrypted: true,
        },
        { key: "azure", value: false, encrypted: false },
      ]
    );
    cy.apiCreateApp(`${fake.companyName}-sqlserver-bulk`);
    cy.openApp();

    cy.apiAddQueryToApp({
      queryName: "table-creation",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${tableName}' AND xtype='U')
      CREATE TABLE [dbo].[${tableName}] (
        [id] int IDENTITY(1,1) PRIMARY KEY,
        [name] nvarchar(255) NOT NULL,
        [email] nvarchar(255) UNIQUE NOT NULL,
        [age] int,
        [created_at] datetime2 DEFAULT GETDATE()
      );`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery();
    });
    cy.apiAddQueryToApp({
      queryName: "insert_user",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `INSERT INTO ${tableName} (name, email, age)
      OUTPUT INSERTED.*
      VALUES ('Alice', 'alice@example.com', 30), ('John', 'john@example.com', 28);`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data).to.be.an("array").with.length(2);
        expect(response.body.data[0]).to.include({
          name: "Alice",
          email: "alice@example.com",
          age: 30,
        });
        expect(response.body.data[1]).to.include({
          name: "John",
          email: "john@example.com",
          age: 28,
        });
      });
    });
    cy.apiAddQueryToApp({
      queryName: "bulk_update_users",
      options: {
        mode: "gui",
        transformationLanguage: "javascript",
        enableTransformation: false,
        operation: "bulk_update_pkey",
        primary_key_column: "id",
        table: "cypress_test_users",
        records: `{{[
    {
      "id": 1,
      "name": "John1 Doe",
      "email": "john1.doe@example.com",
      "age": 30
    },
    {
      "id": 2,
      "name": "Jane1 Smith",
      "email": "jane1.smith@example.com",
      "age": 25
    }
  ]}}`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery("bulk_update_users").then((response) => {
        expect(response.body.data[0]).to.eq(undefined);
      });
    });

    cy.apiAddQueryToApp({
      queryName: "table_preview",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `SELECT * FROM ${tableName}`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data).to.be.an("array").with.length(2);
      });
    });

    cy.apiAddQueryToApp({
      queryName: "drop_table",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `DROP TABLE IF EXISTS ${tableName}`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery();
    });

    cy.apiDeleteApp(`${fake.companyName}-sqlserver-bulk`);
    cy.apiDeleteGDS(dsName);
  });
  it("Should verify SQL parameters", () => {
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-sqlserver`,
      "mssql",
      [
        { key: "host", value: `${Cypress.env("sqlserver_host")}` },
        { key: "instanceName", value: "" },
        { key: "port", value: 1433 },
        { key: "database", value: `${Cypress.env("sqlserver_db")}` },
        { key: "username", value: `${Cypress.env("sqlserver_user")}` },
        {
          key: "password",
          value: `${Cypress.env("sqlserver_password")}`,
          encrypted: true,
        },
        { key: "azure", value: false, encrypted: false },
      ]
    );
    cy.apiCreateApp(`${fake.companyName}-sql-param`);
    cy.openApp();

    cy.apiAddQueryToApp({
      queryName: "table-creation",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${tableName}' AND xtype='U')
      CREATE TABLE [dbo].[${tableName}] (
        [id] int IDENTITY(1,1) PRIMARY KEY,
        [name] nvarchar(255) NOT NULL,
        [email] nvarchar(255) UNIQUE NOT NULL,
        [age] int,
        [created_at] datetime2 DEFAULT GETDATE()
      );`,
      },
      dsName: `cypress-${data.dataSourceName}-sqlserver`,
      dsKind: "mssql",
    }).then(() => {
      cy.apiRunQuery();
    });

    cy.apiAddQueryToApp({
      queryName: "create-user",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `INSERT INTO ${tableName} (name, email, age)
      OUTPUT INSERTED.*
      VALUES (:name, :email, :age);`,
        query_params: [
          ["name", "John Doe"],
          ["email", "john.doe@example.com"],
          ["age", "28"],
        ],
      },
      dsName: `cypress-${data.dataSourceName}-sqlserver`,
      dsKind: "mssql",
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data[0]).to.include({
          name: "John Doe",
          email: "john.doe@example.com",
          age: 28,
        });
      });
    });

    cy.apiAddQueryToApp({
      queryName: "create-user-duplicate-test",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `INSERT INTO ${tableName} (name, email, age)
      OUTPUT INSERTED.*
      VALUES (:name, :email, :age);`,
        query_params: [
          ["name", "John Doe"],
          ["email", "john.doe@example.com"],
          ["age", "28"],
        ],
      },
      dsName: `cypress-${data.dataSourceName}-sqlserver`,
      dsKind: "mssql",
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("failed");
        expect(response.body.message).to.eq("Query could not be completed");
        expect(response.body.description).to.include(
          "Violation of UNIQUE KEY constraint"
        );
      });
    });

    cy.apiAddQueryToApp({
      queryName: "drop_table",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `DROP TABLE IF EXISTS ${tableName}`,
      },
      dsName: `cypress-${data.dataSourceName}-sqlserver`,
      dsKind: "mssql",
    }).then(() => {
      cy.apiRunQuery();
    });

    cy.apiDeleteApp(`${fake.companyName}-sql-param`);
    cy.apiDeleteGDS(`cypress-${data.dataSourceName}-sqlserver`);
  });
});
