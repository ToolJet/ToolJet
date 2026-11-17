import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { cloudLicenseSelectors } from "Selectors/platform/cloudLicense";
import { cloudLicenseText } from "Texts/platform/cloudLicense";
import {
  createUserAndExpectStatus,
  generateBulkUsersCSV,
  verifyLimitBanner,
} from "Support/utils/license";
import {
  plainColumn,
  primaryKeyColumn,
  tooljetDatabaseRequest,
  uniqueTableName,
} from "Support/utils/tooljetDatabase/tooljetDatabaseApi";

const serverRequest = (method, path, body) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method,
      url: `${Cypress.env("server_host")}/api/${path}`,
      headers,
      body,
      failOnStatusCode: false,
      log: false,
    })
  );

const createApp = (name) =>
  serverRequest("POST", "apps", { type: "front-end", name, creation_mode: "DEFAULT" });

const createTable = (name) =>
  tooljetDatabaseRequest("POST", "/table", {
    table_name: name,
    columns: [primaryKeyColumn, plainColumn("name")],
    foreign_keys: [],
  });

const appsLimit = () =>
  serverRequest("GET", "license/apps/limits").then((response) => response.body.appsCount);

const userLimit = (type) =>
  serverRequest("GET", `license/users/limits/${type}`).then((response) => response.body);

describe("Cloud Licensing — Plan Limits", { retries: 0 }, () => {
  let signup;

  const signUp = (plan) => {
    const email = `cloud-limits-${Date.now()}@tooljet.test`;
    cy.apiCloudSignup({ email, name: fake.firstName }).then((result) => {
      signup = result;
      if (plan === "basic") cy.apiSetCloudPlan("basic", { workspaceId: result.workspaceId });
      else cy.waitForCloudPlan("trial", result.workspaceId);
    });
  };

  it("should warn near the Basic app limit and block the 11th app", () => {
    signUp("basic");
    appsLimit().then(({ current, total }) => {
      expect(total).to.equal(10);
      Cypress._.times(total - 1 - current, (index) => {
        createApp(`cloud-limit-app-${Date.now()}-${index}`).its("status").should("equal", 201);
      });
    });

    cy.visit(`/${signup.workspaceSlug}`);
    verifyLimitBanner(cloudLicenseText.apps.nearing(9, 10), cloudLicenseText.apps.nearingInfoAdmin, "apps");
    cy.get(cloudLicenseSelectors.limitBanner("apps"))
      .find(cloudLicenseSelectors.upgradeButton)
      .should("be.visible");

    createApp(`cloud-limit-app-${Date.now()}-last`).its("status").should("equal", 201);
    cy.reload();
    verifyLimitBanner(cloudLicenseText.apps.reached, cloudLicenseText.apps.reachedInfoAdmin, "apps");
    cy.get(commonSelectors.appCreateButton).should("be.disabled");

    createApp(`cloud-limit-app-${Date.now()}-over`).its("status").should("equal", 451);
  });

  it("should block the third builder on a trial workspace", () => {
    signUp("trial");
    userLimit("editor").should((limit) => {
      expect(limit).to.include({ total: 2, current: 1, canAddUnlimited: false });
    });

    createUserAndExpectStatus(`cloud-builder1-${Date.now()}@tooljet.test`, "builder", 201);
    userLimit("editor").its("current").should("equal", 2);
    createUserAndExpectStatus(`cloud-builder2-${Date.now()}@tooljet.test`, "builder", 451);
  });

  it("should allow 50 end users on the Basic plan and block the 51st", () => {
    signUp("basic");
    userLimit("editor").its("total").should("equal", 2);
    userLimit("viewer").should((limit) => {
      expect(limit).to.include({ total: 50, current: 0, canAddUnlimited: false });
    });

    cy.apiBulkUploadUsers(generateBulkUsersCSV(50, "end-user", "cloudeu")).its("status").should("equal", 201);
    userLimit("viewer").its("current").should("equal", 50);
    createUserAndExpectStatus(`cloud-enduser-${Date.now()}@tooljet.test`, "end-user", 451);
  });

  it("should warn near the Basic ToolJet database table limit and block the 11th table", () => {
    signUp("basic");
    Cypress._.times(9, () => {
      createTable(uniqueTableName("cloud_limit")).its("status").should("equal", 201);
    });

    cy.visit(`/${signup.workspaceSlug}/database`);
    verifyLimitBanner(cloudLicenseText.database.nearing, cloudLicenseText.database.nearingInfo, "database");
    cy.get(cloudLicenseSelectors.limitBreakdownRow)
      .first()
      .should("have.text", cloudLicenseText.database.tablesRow(9, 10));

    createTable(uniqueTableName("cloud_limit")).its("status").should("equal", 201);
    cy.reload();
    verifyLimitBanner(cloudLicenseText.database.reached, cloudLicenseText.database.reachedInfo, "database");
    cy.get(cloudLicenseSelectors.limitBreakdownRow)
      .first()
      .should("have.text", cloudLicenseText.database.tablesRow(10, 10));

    createTable(uniqueTableName("cloud_limit")).then((response) => {
      expect(response.status).to.equal(451);
      expect(response.body.message).to.equal(cloudLicenseText.database.tableLimitError);
    });
  });
});
