import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { mySqlText } from "Texts/mysql";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonWidgetText, commonText } from "Texts/common";
import {
  fillDataSourceTextField,
  selectAndAddDataSource,
  addQuery,
  fillConnectionForm,
  openQueryEditor,
  selectQueryMode,
  addGuiQuery,
  addWidgetsToAddUser,
} from "Support/utils/postgreSql";
import {
  closeDSModal,
  deleteDatasource,
  verifyCouldnotConnectWithAlert,
} from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { realHover } from "cypress-real-events/commands/realHover";

const data = {};
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

  it("Should verify the functionality of MySQL connection form.", () => {
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

  it("Should verify elements of the Query section.", () => {
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
    cy.get('[data-cy="list-query-table-creation"] > .text-truncate').trigger(
      "mouseover"
    );
    cy.get('[data-cy="edit-query-table-creation"]').click({ force: true });
    cy.get('[data-cy="query-edit-input-field"]')
      .click()
      .clear()
      .type("update-name{enter}");
    cy.get('[data-cy="list-query-update-name"] > .text-truncate')
      .should("be.visible")
      .trigger("mouseover");
    cy.get('[data-cy="copy-icon"]').click({ force: true });
    cy.get(
      '[data-cy="list-query-update-name_copy"] > .text-truncate'
    ).verifyVisibleElement("have.text", "update-name_copy");

    cy.get('[data-cy="list-query-update-name"] > .text-truncate')
      .should("be.visible")
      .click()
      .trigger("mouseover");
    cy.get('[data-cy="delete-query-update-name"]').click({ force: true });

    cy.get(postgreSqlSelector.deleteModalMessage).verifyVisibleElement(
      "have.text",
      postgreSqlText.dialogueTextDelete
    );
    cy.get(postgreSqlSelector.deleteModalCancelButton).verifyVisibleElement(
      "have.text",
      postgreSqlText.cancel
    );
    cy.get(postgreSqlSelector.deleteModalConfirmButton)
      .verifyVisibleElement("have.text", postgreSqlText.yes)
      .click();

    cy.apiDeleteApp(`${fake.companyName}-mysql`);
    cy.apiDeleteGDS(`cypress-${data.dataSourceName}-mysql`);
  });

  it.only("Should verify CRUD operations on SQL Query.", () => {
    let dbName = "test_db";
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
        query: `CREATE TABLE IF NOT EXISTS \`${dbName}\` (
      id MEDIUMINT NOT NULL AUTO_INCREMENT,
      name CHAR(30) NOT NULL,
      email VARCHAR(255),
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
        query: `SHOW TABLES LIKE '${dbName}';`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data).to.deep.equal([
          { [`Tables_in_test_db (${dbName})`]: dbName },
        ]);
      });
    });

    cy.apiAddQueryToApp({
      queryName: "add_data",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `INSERT INTO \`${dbName}\` (name, email) VALUES ('John Doe', 'john@example.com');`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data).to.have.property("insertId");
        expect(response.body.data.insertId).to.eq(1);
      });
    });

    cy.apiAddQueryToApp({
      queryName: "table_preview",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `SELECT * FROM \`${dbName}\`;`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("ok");
        expect(response.body.data[0]).to.include({
          name: "John Doe",
          email: "john@example.com",
        });
      });
    });
    cy.apiAddQueryToApp({
      queryName: "add_data_using_widgets",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `INSERT INTO \`${dbName}\` (name, email) 
        VALUES ('{{components.textinput1.value}}', '{{components.textinput2.value}}');
        SELECT id, name, email FROM \`${dbName}\` WHERE id = LAST_INSERT_ID();`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.reload();
      addWidgetsToAddUser();
      cy.intercept(
        "POST",
        `**/api/data-queries/${Cypress.env("query-id")}/versions/*/run/*`
      ).as("runQuery");

      cy.get(commonWidgetSelector.draggableWidget("button1")).click();

      cy.wait("@runQuery", { timeout: 60000 }).then((interception) => {
        expect(interception.response.statusCode).to.equal(201);
        expect(interception.response.body.status).to.eq("ok");
        expect(interception.response.body.data[0]).to.have.property("insertId");
        expect(interception.response.body.data[0].insertId).to.eq(2);
        expect(interception.response.body.data[1][0]).to.include({
          name: "Jack",
          email: "jack@example.com",
        });
      });
    });

    cy.apiAddQueryToApp({
      queryName: "truncate_table",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `TRUNCATE TABLE \`${dbName}\`;`,
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
        query: `DROP TABLE IF EXISTS \`${dbName}\`;`,
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

    //cy.apiDeleteApp(`${fake.companyName}-postgresql-CURD-App`);
    //cy.apiDeleteGDS(dsName);
    cy.get(postgreSqlSelector.queryPreviewButton).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get(postgreSqlSelector.previewTabRaw).click();
    cy.get('[class="tab-pane active"]').should(
      "have.text",
      `{"fieldCount":0,"affectedRows":0,"insertId":0,"serverStatus":2,"warningCount":0,"message":"","protocol41":true,"changedRows":0}`
    );

    addQuery("drop_table", `DROP TABLE ${dbName}`, mySqlText.cypressMySql);
    cy.get('[data-cy="list-query-existance_of_table"]').click();
    cy.get(postgreSqlSelector.queryPreviewButton).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get(postgreSqlSelector.previewTabRaw).click();
    cy.get('[class="tab-pane active"]').should("have.text", "[]");

    // addWidgetsToAddUser();
  });

  it.skip("Should verify bulk update", () => {
    selectAndAddDataSource("databases", "MySQL", data.dataSourceName);
    cy.clearAndType(
      postgreSqlSelector.dataSourceNameInputField,
      mySqlText.cypressMySql
    );
    fillConnectionForm({
      Host: Cypress.env("mysql_host"),
      Port: "3318",
      "Database name": "test_db",
      Username: Cypress.env("mysql_user"),
      Password: Cypress.env("mysql_password"),
    });

    openQueryEditor(mySqlText.cypressMySql);
    cy.get('[class="query-pane"]').invoke("css", "height", "calc(85%)");
    selectQueryMode(postgreSqlText.queryModeGui);
    addGuiQuery("name", "email");
    cy.get(postgreSqlSelector.queryCreateAndRunButton).click();
  });
  it("Should verify bulk update operation ", () => {
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
        query: `CREATE TABLE IF NOT EXISTS \`${dbName}\` (
      id MEDIUMINT NOT NULL AUTO_INCREMENT,
      name CHAR(30) NOT NULL,
      email VARCHAR(255),
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
      cy.apiRunQuery("bulk_update_users");
    });
    cy.apiAddQueryToApp({
      queryName: "drop_table",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `DROP TABLE IF EXISTS "public"."${tableName}"`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery();
    });
    cy.apiDeleteApp(`${fake.companyName}-pgsql-bulk`);
    cy.apiDeleteGDS(dsName);
  });
  it("Should verify SQL parameter", () => {
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-pgsql`,
      "postgresql",
      [
        { key: "connection_type", value: "manual", encrypted: false },
        { key: "host", value: `${Cypress.env("pg_host")}`, encrypted: false },
        { key: "port", value: 5432, encrypted: false },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "database", value: "postgres", encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        {
          key: "username",
          value: `${Cypress.env("pg_user")}`,
          encrypted: false,
        },
        {
          key: "password",
          value: `${Cypress.env("pg_password")}`,
          encrypted: true,
        },
        { key: "ca_cert", value: null, encrypted: true },
        { key: "client_key", value: null, encrypted: true },
        { key: "client_cert", value: null, encrypted: true },
        { key: "root_cert", value: null, encrypted: true },
        { key: "connection_string", value: null, encrypted: true },
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
        query: `CREATE TABLE IF NOT EXISTS "public"."${tableName}" (
          "id" integer GENERATED ALWAYS AS IDENTITY,
          "name" text NOT NULL,
          "email" text UNIQUE NOT NULL,
          "age" integer,
          "created_at" timestamp DEFAULT now(),
          PRIMARY KEY ("id")
          );`,
      },
      dsName: `cypress-${data.dataSourceName}-pgsql`,
      dsKind: "postgresql",
    }).then(() => {
      cy.apiRunQuery();
    });
    cy.apiAddQueryToApp({
      queryName: "create-user",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `INSERT INTO  "public"."${tableName}" (name, email, age)
          VALUES (:name, :email, :age)
          RETURNING *;`,
        query_params: [
          ["name", "John Doe"],
          ["email", "john.doe@example.com"],
          ["age", "28"],
        ],
      },
      dsName: `cypress-${data.dataSourceName}-pgsql`,
      dsKind: "postgresql",
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
        query: `INSERT INTO "public"."${tableName}"  (name, email, age)
        VALUES (:name, :email, :age)
        RETURNING *;`,
        query_params: [
          ["name", "John Doe"],
          ["email", "john.doe@example.com"],
          ["age", "28"],
        ],
      },
      dsName: `cypress-${data.dataSourceName}-pgsql`,
      dsKind: "postgresql",
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.status).to.eq("failed");
        expect(response.body.message).to.eq("Query could not be completed");
        expect(response.body.description).to.include(
          "duplicate key value violates unique constraint"
        );
      });
    });
    cy.apiAddQueryToApp({
      queryName: "drop_table",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `DROP TABLE IF EXISTS "public"."${tableName}"`,
      },
      dsName: `cypress-${data.dataSourceName}-pgsql`,
      dsKind: "postgresql",
    }).then(() => {
      cy.apiRunQuery();
    });
    cy.apiDeleteApp(`${fake.companyName}-pgsql-bulk`);
    cy.apiDeleteGDS(`cypress-${data.dataSourceName}-pgsql`);
  });
});
