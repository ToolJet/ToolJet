import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { mySqlText } from "Texts/mysql";
import { commonSelectors } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import {
  closeDSModal,
  verifyCouldnotConnectWithAlert,
} from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { performQueryAction } from "Support/utils/queries";

const data = {};
let tableName = "cypress_test_users";
describe("Data sources MySql connection and query", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Should verify elements on MySQL connection form with validation", () => {
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
      `cypress-${data.dataSourceName}-mysql`,
      "mysql",
      [
        { key: "connection_type", value: "hostname", encrypted: false },
        { key: "host", value: "localhost", encrypted: false },
        { key: "port", value: 3306, encrypted: false },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "password", value: null, encrypted: true },
        { key: "ca_cert", value: null, encrypted: true },
        { key: "client_key", value: null, encrypted: true },
        { key: "client_cert", value: null, encrypted: true },
        { key: "root_cert", value: null, encrypted: true },
      ]
    );
    cy.reload();
    cy.get(`[data-cy="cypress-${data.dataSourceName}-mysql-button"]`)
      .should("be.visible")
      .click();
    cy.get(dataSourceSelector.dsNameInputField).should(
      "have.value",
      `cypress-${data.dataSourceName}-mysql`
    );

    const requiredFields = [
      postgreSqlText.labelUserName,
      postgreSqlText.labelPassword,
      postgreSqlText.labelDbName,
      postgreSqlText.labelHost,
      postgreSqlText.labelPort,
    ];
    const sections = [
      postgreSqlText.labelUserName,
      postgreSqlText.labelPassword,
      postgreSqlText.labelDbName,
      postgreSqlText.labelHost,
      postgreSqlText.labelPort,
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
    cy.get(
      dataSourceSelector.dropdownLabel(postgreSqlText.labelConnectionType)
    ).verifyVisibleElement("have.text", postgreSqlText.labelConnectionType);

    cy.get(postgreSqlSelector.labelSsl).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelSSL
    );
    cy.get(postgreSqlSelector.sslToggleInput).should("be.visible");
    cy.get(postgreSqlSelector.labelSSLCertificate).verifyVisibleElement(
      "have.text",
      postgreSqlText.sslCertificate
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
    // verifyCouldnotConnectWithAlert(mySqlText.errorConnectionRefused);
    cy.apiDeleteGDS(`cypress-${data.dataSourceName}-mysql`);
  });
  it("Should verify the functionality of MySQL connection form", () => {
    const dsName = `cypress-${data.dataSourceName}-mysql`;
    cy.get(commonSelectors.globalDataSourceIcon).click();
    //invalid database
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      dsName,
      "mysql",
      [
        { key: "connection_type", value: "hostname", encrypted: false },
        {
          key: "host",
          value: `${Cypress.env("mysql_host")}`,
          encrypted: false,
        },
        { key: "port", value: 3318, encrypted: false },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        {
          key: "username",
          value: `${Cypress.env("mysql_user")}`,
          encrypted: false,
        },
        {
          key: "password",
          value: `${Cypress.env("mysql_password")}`,
          encrypted: true,
        },
        { key: "database", value: "unknowndb", encrypted: false },
        { key: "ca_cert", value: null, encrypted: true },
        { key: "client_key", value: null, encrypted: true },
        { key: "client_cert", value: null, encrypted: true },
        { key: "root_cert", value: null, encrypted: true },
      ]
    );
    cy.get(dataSourceSelector.dataSourceNameButton(dsName))
      .should("be.visible")
      .click();
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.wait(500);
    verifyCouldnotConnectWithAlert(mySqlText.errorUnknownDb);
    //invalid username
    cy.reload();
    cy.apiUpdateGDS({
      name: dsName,
      options: [
        { key: "connection_type", value: "hostname", encrypted: false },
        {
          key: "host",
          value: `${Cypress.env("mysql_host")}`,
          encrypted: false,
        },
        { key: "port", value: 3318, encrypted: false },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "database", value: "test_db", encrypted: false },
        {
          key: "username",
          value: "admin1",
          encrypted: false,
        },
        {
          key: "password",
          value: `${Cypress.env("mysql_password")}`,
          encrypted: true,
        },
      ],
    });
    cy.get(dataSourceSelector.dataSourceNameButton(dsName))
      .should("be.visible")
      .click();
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.wait(500);
    verifyCouldnotConnectWithAlert(mySqlText.errorAccessDeniedAdmin1);
    //invalid password
    cy.reload();
    cy.apiUpdateGDS({
      name: dsName,
      options: [
        { key: "connection_type", value: "hostname", encrypted: false },
        {
          key: "host",
          value: `${Cypress.env("mysql_host")}`,
          encrypted: false,
        },
        { key: "port", value: 3318, encrypted: false },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "database", value: "test_db", encrypted: false },
        {
          key: "username",
          value: `${Cypress.env("mysql_user")}`,
          encrypted: false,
        },
        {
          key: "password",
          value: "testpassword",
          encrypted: true,
        },
      ],
    });
    cy.get(dataSourceSelector.dataSourceNameButton(dsName))
      .should("be.visible")
      .click();
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.wait(500);
    verifyCouldnotConnectWithAlert(mySqlText.errorAccessDeniedAdmin);
    //valid data
    cy.reload();
    cy.apiUpdateGDS({
      name: dsName,
      options: [
        { key: "connection_type", value: "hostname", encrypted: false },
        {
          key: "host",
          value: `${Cypress.env("mysql_host")}`,
          encrypted: false,
        },
        { key: "port", value: 3318, encrypted: false },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        {
          key: "username",
          value: `${Cypress.env("mysql_user")}`,
          encrypted: false,
        },
        {
          key: "password",
          value: `${Cypress.env("mysql_password")}`,
          encrypted: true,
        },
        { key: "database", value: "test_db", encrypted: false },
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
      `cypress-${data.dataSourceName}-mysql`,
      "mysql",
      [
        { key: "connection_type", value: "hostname", encrypted: false },
        {
          key: "host",
          value: `${Cypress.env("mysql_host")}`,
          encrypted: false,
        },
        { key: "port", value: 3318, encrypted: false },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        {
          key: "username",
          value: `${Cypress.env("mysql_user")}`,
          encrypted: false,
        },
        {
          key: "password",
          value: `${Cypress.env("mysql_password")}`,
          encrypted: true,
        },
        { key: "database", value: "test_db", encrypted: false },
      ]
    );

    cy.apiCreateApp(`${fake.companyName}-mysql`);
    cy.openApp();
    cy.apiAddQueryToApp({
      queryName: "table-creation",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
      },
      dsName: `cypress-${data.dataSourceName}-mysql`,
      dsKind: "postgresql",
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
      .and("have.text", `cypress-${data.dataSourceName}-mysql`);

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
    cy.apiDeleteApp(`${fake.companyName}-mysql`);
    cy.apiDeleteGDS(`cypress-${data.dataSourceName}-mysql`);
  });
  it("Should verify CRUD operations on SQL Query", () => {
    const dsName = `cypress-${data.dataSourceName}-crud-mysql`;
    const dsKind = "postgresql";
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      dsName,
      "mysql",
      [
        { key: "connection_type", value: "hostname", encrypted: false },
        {
          key: "host",
          value: `${Cypress.env("mysql_host")}`,
          encrypted: false,
        },
        { key: "port", value: 3318, encrypted: false },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        {
          key: "username",
          value: `${Cypress.env("mysql_user")}`,
          encrypted: false,
        },
        {
          key: "password",
          value: `${Cypress.env("mysql_password")}`,
          encrypted: true,
        },
        { key: "database", value: "test_db", encrypted: false },
      ]
    );

    cy.apiCreateApp(`${fake.companyName}-mysql-CURD-App`);
    cy.openApp();
    cy.apiAddQueryToApp({
      queryName: "table_creation",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
  id MEDIUMINT NOT NULL AUTO_INCREMENT,
  name CHAR(30) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  age INT,
  PRIMARY KEY (id)
);`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data).to.have.all.keys([
          "fieldCount",
          "affectedRows",
          "insertId",
          "info",
          "serverStatus",
          "warningStatus",
          "changedRows",
        ]);
        expect(response.body.data.affectedRows).to.eq(0);
      });
    });
    cy.apiAddQueryToApp({
      queryName: "existance_of_table",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `SHOW TABLES LIKE '${tableName}';`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data).to.deep.equal([
          { [`Tables_in_test_db (${tableName})`]: tableName },
        ]);
      });
    });

    cy.apiAddQueryToApp({
      queryName: "add_data",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `INSERT INTO \`${tableName}\` (name, email, age)
VALUES ('John Doe', 'john.doe@example.com', 28);
SELECT id, name, email, age
FROM \`${tableName}\`
WHERE id = LAST_INSERT_ID();`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data[0]).to.have.property("insertId", 1);
        expect(response.body.data[1][0]).to.have.property("id", 1);
        expect(response.body.data[1][0]).to.have.property("name", "John Doe");
        expect(response.body.data[1][0]).to.have.property(
          "email",
          "john.doe@example.com"
        );
        expect(response.body.data[1][0]).to.have.property("age", 28);
      });
    });

    cy.apiAddQueryToApp({
      queryName: "table_preview",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `SELECT * FROM \`${tableName}\`;`,
      },
      dsName,
      dsKind,
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

    // cy.apiAddQueryToApp({
    //   queryName: "add_data_using_widgets",
    //   options: {
    //     mode: "sql",
    //     transformationLanguage: "javascript",
    //     enableTransformation: false,
    //     query: `INSERT INTO \`${tableName}\` (name, email)
    //     VALUES ('{{components.textinput1.value}}', '{{components.textinput2.value}}');
    //     SELECT id, name, email FROM \`${tableName}\` WHERE id = LAST_INSERT_ID();`,
    //   },
    //   dsName,
    //   dsKind,
    // }).then(() => {
    //   cy.reload();
    //   addWidgetsToAddUser();
    //   cy.intercept(
    //     "POST",
    //     `**/api/data-queries/${Cypress.env("query-id")}/versions/*/run/*`
    //   ).as("runQuery");

    //   cy.get(commonWidgetSelector.draggableWidget("button1")).click();

    //   cy.wait("@runQuery", { timeout: 60000 }).then((interception) => {
    //     expect(interception.response.statusCode).to.equal(201);
    //     expect(interception.response.body.status).to.eq("ok");
    //     expect(interception.response.body.data[0]).to.have.property("insertId");
    //     expect(interception.response.body.data[0].insertId).to.eq(2);
    //     expect(interception.response.body.data[1][0]).to.include({
    //       name: "Jack",
    //       email: "jack@example.com",
    //     });
    //   });
    // });

    cy.apiAddQueryToApp({
      queryName: "truncate_table",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `TRUNCATE TABLE \`${tableName}\`;`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data).to.have.property("affectedRows");
        expect(response.body.data.affectedRows).to.eq(0);
      });
    });

    cy.apiAddQueryToApp({
      queryName: "drop_table",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `DROP TABLE IF EXISTS \`${tableName}\`;`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data).to.have.property("affectedRows");
        expect(response.body.data.affectedRows).to.eq(0);
      });
    });

    cy.apiDeleteApp(`${fake.companyName}-mysql-CURD-App`);
    cy.apiDeleteGDS(dsName);
  });
  it("Should verify bulk update operation", () => {
    const dsName = `cypress-${data.dataSourceName}-bulk-mysql`;
    const dsKind = "mysql";
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      dsName,
      dsKind,
      [
        { key: "connection_type", value: "hostname", encrypted: false },
        {
          key: "host",
          value: `${Cypress.env("mysql_host")}`,
          encrypted: false,
        },
        { key: "port", value: 3318, encrypted: false },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        {
          key: "username",
          value: `${Cypress.env("mysql_user")}`,
          encrypted: false,
        },
        {
          key: "password",
          value: `${Cypress.env("mysql_password")}`,
          encrypted: true,
        },
        { key: "database", value: "test_db", encrypted: false },
      ]
    );

    cy.apiCreateApp(`${fake.companyName}-mysql-bulk`);
    cy.openApp();
    cy.apiAddQueryToApp({
      queryName: "table_creation",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
  id MEDIUMINT NOT NULL AUTO_INCREMENT,
  name CHAR(30) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  age INT,
  PRIMARY KEY (id)
);`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data).to.have.all.keys([
          "fieldCount",
          "affectedRows",
          "insertId",
          "info",
          "serverStatus",
          "warningStatus",
          "changedRows",
        ]);
      });
    });

    cy.apiAddQueryToApp({
      queryName: "add_data",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `INSERT INTO \`${tableName}\`(id, name, email, age)
VALUES
  (1, 'John Doe', 'john.doe@example.com', 10),
  (2, 'Jane Smith', 'jane.smith@example.com', 11);`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data).to.have.property("insertId", 2);
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
        table: `${tableName}`,
        records: `{{[
        {
          "id": 1,
          "name": "John1 Doe",
          "email": "john1.doe@example.com",
          "age": 20
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
      queryName: "drop_table",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `DROP TABLE IF EXISTS \`${tableName}\`;`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery();
    });
    cy.apiDeleteApp(`${fake.companyName}-mysql-bulk`);
    cy.apiDeleteGDS(dsName);
  });
  it("Should verify SQL parameters", () => {
    const dsName = `cypress-${data.dataSourceName}-sql-param`;
    const dsKind = "mysql";
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      dsName,
      dsKind,
      [
        { key: "connection_type", value: "hostname", encrypted: false },
        {
          key: "host",
          value: `${Cypress.env("mysql_host")}`,
          encrypted: false,
        },
        { key: "port", value: 3318, encrypted: false },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        {
          key: "username",
          value: `${Cypress.env("mysql_user")}`,
          encrypted: false,
        },
        {
          key: "password",
          value: `${Cypress.env("mysql_password")}`,
          encrypted: true,
        },
        { key: "database", value: "test_db", encrypted: false },
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
        query: `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
  id MEDIUMINT NOT NULL AUTO_INCREMENT,
  name CHAR(30) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  age INT,
  PRIMARY KEY (id)
);`,
      },
      dsName: dsName,
      dsKind: dsKind,
    }).then(() => {
      cy.apiRunQuery();
    });
    cy.apiAddQueryToApp({
      queryName: "create-user",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `INSERT INTO  \`${tableName}\` (name, email, age) VALUES (:name, :email, :age);`,
        query_params: [
          ["name", "John Doe"],
          ["email", "john.doe@example.com"],
          ["age", "28"],
        ],
      },
      dsName: dsName,
      dsKind: dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data).to.have.property("insertId", 1);
      });
    });

    cy.apiAddQueryToApp({
      queryName: "create-user-duplicate-test",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `INSERT INTO  \`${tableName}\` (name, email, age) VALUES (:name, :email, :age);`,
        query_params: [
          ["name", "John Doe"],
          ["email", "john.doe@example.com"],
          ["age", "28"],
        ],
      },
      dsName: dsName,
      dsKind: dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("failed");
        expect(response.body.message).to.eq("Query could not be completed");
        expect(response.body.description).to.include(
          "Duplicate entry 'john.doe@example.com' for key 'cypress_test_users.email'"
        );
      });
    });
    cy.apiAddQueryToApp({
      queryName: "drop_table",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `DROP TABLE IF EXISTS \`${tableName}\`;`,
      },
      dsName: dsName,
      dsKind: dsKind,
    }).then(() => {
      cy.apiRunQuery();
    });
    cy.apiDeleteApp(`${fake.companyName}-sql-param`);
    cy.apiDeleteGDS(dsName);
  });
});
