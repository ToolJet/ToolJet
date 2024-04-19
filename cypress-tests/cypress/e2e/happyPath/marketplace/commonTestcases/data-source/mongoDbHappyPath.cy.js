import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { mongoDbText } from "Texts/mongoDb";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { closeDSModal, deleteDatasource } from "Support/utils/dataSource";
import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";
import {
  connectMongo,
  openMongoQueryEditor,
  selectQueryType,
} from "Support/utils/mongoDB";

import {
  verifyCouldnotConnectWithAlert,
  resizeQueryPanel,
  query,
  verifypreview,
  addInput,
} from "Support/utils/dataSource";

const data = {};

describe("Data source MongoDB", () => {
  beforeEach(() => {
    cy.appUILogin();
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Should verify elements on MongoDB connection form", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();
    cy.get(postgreSqlSelector.allDatasourceLabelAndCount).should(
      "have.text",
      postgreSqlText.allDataSources()
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
    selectAndAddDataSource(
      "databases",
      mongoDbText.mongoDb,
      data.dataSourceName
    );

    cy.get(postgreSqlSelector.labelHost).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelHost
    );
    cy.get(postgreSqlSelector.labelPort).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelPort
    );
    cy.get(postgreSqlSelector.labelDbName).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelDbName
    );
    cy.get(postgreSqlSelector.labelUserName).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelUserName
    );
    cy.get(postgreSqlSelector.labelPassword).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelPassword
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
    cy.get(postgreSqlSelector.connectionFailedText, {
      timeout: 70000,
    }).verifyVisibleElement("have.text", postgreSqlText.couldNotConnect, {
      timeout: 65000,
    });
    cy.get(postgreSqlSelector.buttonSave).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonTextSave
    );
    cy.get('[data-cy="connection-alert-text"]').verifyVisibleElement(
      "have.text",
      mongoDbText.errorConnectionRefused
    );
    cy.get('[data-cy="query-select-dropdown"]').type(
      mongoDbText.optionConnectUsingConnectionString
    );
    cy.get('[data-cy="label-connection-string"]').verifyVisibleElement(
      "have.text",
      mongoDbText.labelConnectionString
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
    cy.get(postgreSqlSelector.connectionFailedText, {
      timeout: 70000,
    }).verifyVisibleElement("have.text", postgreSqlText.couldNotConnect, {
      timeout: 95000,
    });
    cy.get('[data-cy="connection-alert-text"]').verifyVisibleElement(
      "have.text",
      "Cannot read properties of null (reading '2')"
    );
    verifyCouldnotConnectWithAlert(mongoDbText.errorInvalisScheme);
    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );
    cy.wait(1000);
    deleteDatasource(`cypress-${data.dataSourceName}-mongodb`);
  });

  it("Should verify the functionality of MongoDB connection form.", () => {
    selectAndAddDataSource(
      "databases",
      mongoDbText.mongoDb,
      data.dataSourceName
    );

    cy.get('[data-cy="query-select-dropdown"]').type(
      mongoDbText.optionConnectUsingConnectionString
    );

    fillDataSourceTextField(
      mongoDbText.labelConnectionString,
      "**************",
      Cypress.env("mongodb_connString"),
      "contain",
      { parseSpecialCharSequences: false, delay: 0 }
    );
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.dataSourceName}-mongodb-button"]`
    ).verifyVisibleElement(
      "have.text",
      `cypress-${data.dataSourceName}-mongodb`
    );

    deleteDatasource(`cypress-${data.dataSourceName}-mongodb`);
  });

  it.skip("Should verify the queries of MongoDB.", () => {
    connectMongo();
    openMongoQueryEditor();
    resizeQueryPanel();

    selectQueryType("Delete Many");
    addInput("collection", "test");
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");

    selectQueryType("List Collections");
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    query("preview");
    verifypreview("raw", '[{"name":"test"'); //'root:[] 0 items'

    selectQueryType("Insert One");
    addInput("collection", "test");
    addInput("document", '{name:"mike"}');
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    query("preview");
    verifypreview("raw", '{"acknowledged":true,"insertedId"');

    selectQueryType("Find One");
    addInput("collection", "test");
    addInput("filter", '{name:"mike"}');
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    query("preview");
    verifypreview("raw", '"name":"mike"}');

    selectQueryType("Find many");
    addInput("collection", "test");
    addInput("filter", '{name:"mike"}');
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    query("preview");
    verifypreview("raw", '"name":"mike"}');

    selectQueryType("Total Count");
    addInput("collection", "test");
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    query("preview");
    verifypreview("raw", '{"count":');

    selectQueryType("Count");
    addInput("collection", "test");
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    query("preview");
    verifypreview("raw", '{"count":');

    selectQueryType("Distinct");
    addInput("collection", "test");
    addInput("field", "name");
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    query("preview");
    verifypreview("raw", '["mike"]');

    selectQueryType("Insert Many");
    addInput("collection", "test");
    addInput(
      "documents",
      '[{_id:331, name:"Nina"},{_id:441, name:"mina"}, {_id:4441, name:"Steph"}, {_id:41, name:"Mark"},{_id:3131, name:"Lina"}]'
    );
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    addInput("documents", '[{_id:3113, name:"Nina"},{_id:414, name:"mina"}]');
    query("preview");
    verifypreview(
      "raw",
      '{"acknowledged":true,"insertedCount":2,"insertedIds":{"0":3113,"1":414}}'
    );

    selectQueryType("Update One");
    addInput("collection", "test");
    addInput("filter", '{name:"mina"}');
    addInput("update", '{$set:{name: "mike2023"}}');
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    query("preview");
    verifypreview(
      "raw",
      '{"acknowledged":true,"modifiedCount":1,"upsertedId":null,"upsertedCount":0'
    );

    selectQueryType("Update Many");
    addInput("collection", "test");
    addInput("filter", '{name:"Nina"}');
    addInput("update", '{$set:{name: "mike22222"}}');
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    addInput("filter", '{name:"mike22222"}');
    addInput("update", '{$set:{name: "Mark"}}');
    query("preview");
    verifypreview(
      "raw",
      '{"acknowledged":true,"modifiedCount":2,"upsertedId":null,"upsertedCount":0'
    );

    selectQueryType("Replace One");
    addInput("collection", "test");
    addInput("filter", '{name:"mike"}');
    addInput("replacement", '{name: "mike2023"}');
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    addInput("filter", '{name:"mike"}');
    addInput("replacement", '{name: "Nina"}');
    query("preview");
    verifypreview(
      "raw",
      '{"acknowledged":true,"modifiedCount":1,"upsertedId":null,"upsertedCount":0'
    );

    selectQueryType("Find One and Update");
    addInput("collection", "test");
    addInput("filter", '{name:"mike"}');
    addInput("update", '{$set:{name: "mike2023"}}');
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    addInput("filter", '{name:"Mark"}');
    addInput("update", '{$set:{name: "Nina"}}');
    query("preview");
    verifypreview(
      "raw",
      '{"lastErrorObject":{"n":1,"updatedExisting":true},"value":{"_id":'
    );

    selectQueryType("Find One and Replace");
    addInput("collection", "test");
    addInput("filter", '{name:"mike"}');
    addInput("replacement", '{name: "mike2023"}');
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    addInput("filter", '{name:"mike2023"}');
    addInput("replacement", '{name: "Nina"}');
    query("preview");
    verifypreview(
      "raw",
      '{"lastErrorObject":{"n":1,"updatedExisting":true},"value":{"_id":'
    );

    selectQueryType("Find One and Delete");
    addInput("collection", "test");
    addInput("filter", '{name:"Nina"}');
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    addInput("filter", '{name:"mike2023"}');
    query("preview");
    verifypreview("raw", '{"lastErrorObject":{"n":1},"value":{"_id":');

    selectQueryType("Delete One");
    addInput("collection", "test");
    addInput("filter", '{name:"mike"}');
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    addInput("filter", '{name:"Lina"}');
    query("preview");
    verifypreview("raw", '{"acknowledged":true,"deletedCount":1}');

    selectQueryType("Aggregate");
    addInput("collection", "test");
    addInput("pipeline", '[{$match:{name:"mike2023"}}, {$match:{_id:414}}]');
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    query("preview");
    verifypreview("raw", '[{"_id":414,"name":"mike2023"}]');

    selectQueryType("Operations");
    addInput("collection", "test");
    addInput("operations", '[{insertOne:{name:"midhun"}}]');
    query("run");
    cy.verifyToastMessage(".go2072408551", "Query (mongodb1) completed.");
    query("preview");
    verifypreview(
      "raw",
      '{"ok":1,"writeErrors":[],"writeConcernErrors":[],"insertedIds":[{"index":'
    );
  });
});
