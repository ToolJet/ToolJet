import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonWidgetText } from "Texts/common";
import { commonSelectors } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";
import {
  addQuery,
  fillDataSourceTextField,
  fillConnectionForm,
  selectAndAddDataSource,
  openQueryEditor,
  selectQueryMode,
  addGuiQuery,
  addWidgetsToAddUser,
} from "Support/utils/postgreSql";
import { verifyCouldnotConnectWithAlert } from "Support/utils/dataSource";

const data = {};

describe("PostgreSQL data source connection and query", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Should verify elements on connection form with validation", () => {
    cy.log(process.env.NODE_ENV);
    cy.log(postgreSqlText.allDatabase());
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.wait(1000);

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
      `cypress-${data.dataSourceName}-postgresql`,
      "postgresql",
      [
        { key: "connection_type", value: "manual", encrypted: false },
        { key: "host", value: "localhost", encrypted: false },
        { key: "port", value: 5432, encrypted: false },
        { key: "ssl_enabled", value: true, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "password", value: null, encrypted: true },
        { key: "ca_cert", value: null, encrypted: true },
        { key: "client_key", value: null, encrypted: true },
        { key: "client_cert", value: null, encrypted: true },
        { key: "root_cert", value: null, encrypted: true },
        { key: "connection_string", value: null, encrypted: true },
      ]
    );
    cy.reload();
    cy.get(`[data-cy="cypress-${data.dataSourceName}-postgresql-button"]`)
      .should("be.visible")
      .click();
    cy.get(dataSourceSelector.dsNameInputField).should(
      "have.value",
      `cypress-${data.dataSourceName}-postgresql`
    );

    cy.get(
      dataSourceSelector.dropdownLabel(postgreSqlText.labelConnectionType)
    ).verifyVisibleElement("have.text", postgreSqlText.labelConnectionType);
    cy.get(dataSourceSelector.dropdownField(postgreSqlText.labelConnectionType))
      .should("be.visible")
      .click();
    cy.contains(
      `[id*="react-select-"]`,
      postgreSqlText.connectionStringOption
    ).click();

    cy.get(
      dataSourceSelector.dropdownField(postgreSqlText.labelConnectionType)
    ).should("be.visible");
    cy.get(
      dataSourceSelector.labelFieldName(postgreSqlText.connectionStringOption)
    ).verifyVisibleElement(
      "have.text",
      `${postgreSqlText.connectionStringOption}*`
    );
    cy.get(postgreSqlSelector.labelEncryptedText).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelEncrypted
    );
    cy.get(dataSourceSelector.button(postgreSqlText.editButtonText)).should(
      "be.visible"
    );
    cy.get(dataSourceSelector.button(postgreSqlText.editButtonText)).click();
    cy.verifyRequiredFieldValidation(
      postgreSqlText.connectionStringOption,
      "rgb(226, 99, 103)"
    );
    cy.get(
      dataSourceSelector.textField(postgreSqlText.connectionStringOption)
    ).should("be.visible");
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
    cy.get(postgreSqlSelector.connectionFailedText).verifyVisibleElement(
      "have.text",
      postgreSqlText.couldNotConnect
    );
    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .and("be.disabled");
    cy.get(dataSourceSelector.connectionAlertText).verifyVisibleElement(
      "have.text",
      postgreSqlText.unableAcquireConnectionAlertText
    );

    cy.get(dataSourceSelector.dropdownField(postgreSqlText.labelConnectionType))
      .should("be.visible")
      .click();
    cy.contains(
      `[id*="react-select-"]`,
      postgreSqlText.manualConnectionOption
    ).click();

    cy.get(
      dataSourceSelector.dropdownField(postgreSqlText.labelConnectionType)
    ).should("be.visible");

    const requiredFields = [
      postgreSqlText.labelHost,
      postgreSqlText.labelPort,
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
    verifyCouldnotConnectWithAlert(postgreSqlText.serverNotSuppotSsl);

    cy.apiDeleteGDS(`cypress-${data.dataSourceName}-postgresql`);
  });

  it("Should verify the functionality of PostgreSQL connection form.", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-manual-pgsql`,
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
    cy.get(
      dataSourceSelector.dataSourceNameButton(
        `cypress-${data.dataSourceName}-manual-pgsql`
      )
    )
      .should("be.visible")
      .click();
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);
    cy.apiDeleteGDS(`cypress-${data.dataSourceName}-manual-pgsql`);
    cy.reload();
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-string-pgsql`,
      "postgresql",
      [
        { key: "connection_type", value: "string", encrypted: false },
        {
          key: "connection_string",
          value: `${Cypress.env("pg_string")}`,
          encrypted: true,
        },
      ]
    );
    cy.get(
      dataSourceSelector.dataSourceNameButton(
        `cypress-${data.dataSourceName}-string-pgsql`
      )
    )
      .should("be.visible")
      .click();
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);
    cy.apiDeleteGDS(`cypress-${data.dataSourceName}-string-pgsql`);
  });

  it.only("Should verify elements of the Query section.", () => {
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-manual-pgsql`,
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
    cy.apiCreateApp(`${fake.companyName}-postgresql`);
    cy.openApp();

    cy.apiAddQueryToApp({
      queryName: "table_creation",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
      },
      dsName: `cypress-${data.dataSourceName}-manual-pgsql`,
      dsKind: "postgresql",
    });
    cy.reload();
    cy.get(
      '[data-cy="query-name-label"] > .bg-transparent'
    ).verifyVisibleElement("contain", "table_creation");
    cy.get(
      postgreSqlSelector.labelQueryTab(postgreSqlText.queryTabSetup)
    ).verifyVisibleElement("have.text", postgreSqlText.queryTabSetup);
    cy.contains("Parameters").should("be.visible");
    cy.get('[data-cy="runjs-add-param-button"]').should("be.visible");
    cy.contains("Source").should("be.visible");
    cy.get(".css-zz6spl-container").should("be.visible");
    cy.get(".w-100 > .react-select__control > .react-select__value-container")
      .should("be.visible")
      .and("have.text", `cypress-${data.dataSourceName}-manual-pgsql`);

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
    cy.get(postgreSqlSelector.toggleTransformation).should("be.visible");

    cy.get(postgreSqlSelector.inputFieldTransformation).should("be.visible");

    cy.get(postgreSqlSelector.labelQueryTab(postgreSqlText.queryTabSettings))
      .verifyVisibleElement("have.text", postgreSqlText.queryTabSettings)
      .click();

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

    cy.get(postgreSqlSelector.toggleNotification).click();
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

    cy.get(postgreSqlSelector.queryCreateDropdown).click();
    cy.get(postgreSqlSelector.opetionQuerySave).click();
    cy.get(postgreSqlSelector.queryCreateAndRunButton).click();
    cy.get(postgreSqlSelector.psqlQueryLabel).verifyVisibleElement(
      "have.text",
      postgreSqlText.firstQueryName
    );
    cy.get(postgreSqlSelector.postgresqlQueryRunButton).should("be.visible");
    cy.intercept("GET", "api/data_queries?**").as("addQuery");
    cy.wait("@addQuery");
    cy.get(postgreSqlSelector.psqlQueryLabel).click();
    cy.get(postgreSqlSelector.psqlQueryDeleteButton).click();
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
  });

  it("Should verify CRUD operations on SQL Query.", () => {
    const tableName = "cypress_test_users";
    const dsName = `cypress-${data.dataSourceName}-crud-pgsql`;
    const dsKind = "postgresql";
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      dsName,
      dsKind,
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
    cy.apiCreateApp(`${fake.companyName}-postgresql-CURD-App`);
    cy.openApp();

    cy.apiAddQueryToApp({
      queryName: "table_creation",
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
        query: `INSERT INTO "public"."${tableName}" (name, email, age)
        VALUES ('Alice', 'alice@example.com', 30)
        RETURNING *;`,
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
        query: `SELECT * FROM "public"."${tableName}"
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
      queryName: "update_user",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `UPDATE "public"."${tableName}"
        SET name = 'Alice Updated', age = 31
        WHERE email = 'alice@example.com'
        RETURNING *;`,
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
        query: `DELETE FROM "public"."${tableName}"
        WHERE email = 'alice@example.com'
        RETURNING *;`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery().then((response) => {
        expect(response.body.data[0].email).to.eq("alice@example.com");
      });
    });

    cy.apiAddQueryToApp({
      queryName: "table_preview",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `SELECT * FROM "${tableName}"`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery();
    });

    cy.apiAddQueryToApp({
      queryName: "existance_of_table",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = '${tableName}'
      );`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery();
    });

    cy.reload();
    cy.get(postgreSqlSelector.queryPreviewButton, { timeout: 3000 }).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get(postgreSqlSelector.previewTabRaw, { timeout: 3000 })
      .scrollIntoView()
      .should("be.visible", { timeout: 3000 })
      .click();

    cy.get('[class="tab-pane active"]').should(
      "have.text",
      '[{"exists":true}]'
    );
    cy.apiAddQueryToApp({
      queryName: "add_data_using_widgets",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `INSERT INTO "public"."${tableName}"("name", "email") VALUES('{{}{{}components.textinput1.value{rightArrow}{rightArrow}', '{{}{{}components.textinput2.value{rightArrow}{rightArrow}') RETURNING "id", "name", "email";`,
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
        query: `TRUNCATE TABLE "public"."${tableName}"`,
      },
      dsName,
      dsKind,
    }).then(() => {
      cy.apiRunQuery();
    });
    cy.reload();
    cy.get(postgreSqlSelector.queryPreviewButton).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get(postgreSqlSelector.previewTabRaw).click();
    cy.get('[class="tab-pane active"]').should("have.text", "[]");
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

    cy.reload();
    cy.get(postgreSqlSelector.queryPreviewButton).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get(postgreSqlSelector.previewTabRaw).click();
    // cy.get('[class="tab-pane active"]').should(
    //   "have.text",
    //   '[{"exists":false}]'
    // );

    addWidgetsToAddUser();

    cy.apiDeleteApp(`${fake.companyName}-postgresql-CURD-App`);
    cy.apiDeleteGDS(`cypress-${data.dataSourceName}-crud-pgsql`);
  });

  it.skip("Should verify bulk update", () => {
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-postgresql`,
      "postgresql",
      [
        { key: "connection_type", value: "manual", encrypted: false },
        { key: "host", value: "localhost", encrypted: false },
        { key: "port", value: 5432, encrypted: false },
        { key: "ssl_enabled", value: true, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "password", value: null, encrypted: true },
        { key: "ca_cert", value: null, encrypted: true },
        { key: "client_key", value: null, encrypted: true },
        { key: "client_cert", value: null, encrypted: true },
        { key: "root_cert", value: null, encrypted: true },
        { key: "connection_string", value: null, encrypted: true },
      ]
    );

    cy.apiCreateApp(`${fake.companyName}-postgresql-CURD-App`);
    cy.openApp();
    openQueryEditor(postgreSqlText.postgreSQL);
    selectQueryMode(postgreSqlText.queryModeGui);
    addGuiQuery("name", "email");
    cy.get(postgreSqlSelector.queryCreateAndRunButton).click();
  });
});
