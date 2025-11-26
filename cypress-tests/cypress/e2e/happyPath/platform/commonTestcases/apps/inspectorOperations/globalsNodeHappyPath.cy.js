import { fake } from "Fixtures/fake";
import { navigateAndVerifyInspector } from "Support/utils/inspector";

describe("Globals - Inspector", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-inspector-App`);
    cy.openApp("?key=value");
  });

  after(() => {
    cy.apiUpdateProfile({
      firstName: "The",
      lastName: "developer",
    });
  });

  it("should verify the values of current user inside globals inspector", () => {
    const dataList = [
      ["email", `"dev@tooljet.io"`],
      ["firstName", `"The"`],
      ["lastName", `"Developer"`],
      ["id", `"${Cypress.env("user_id").slice(0, 31)}...`],
      ["avatarId", `null`],
      ["groups", `[2]`],
      ["role", `"admin"`],
      ["ssoUserInfo", `{0}`],
    ];

    navigateAndVerifyInspector(["globals", "currentUser"], dataList);

    cy.apiUpdateProfile({
      firstName: "UpdatedThe",
      lastName: "UpdatedDeveloper",
    }).then(() => {
      cy.reload();

      const dataListAfter = [
        ["email", `"dev@tooljet.io"`],
        ["firstName", `"UpdatedThe"`],
        ["lastName", `"UpdatedDeveloper"`],
        ["id", `"${Cypress.env("user_id").slice(0, 31)}...`],
        ["avatarId", `null`],
        ["groups", `[2]`],
        ["role", `"admin"`],
        ["ssoUserInfo", `{0}`],
      ];

      navigateAndVerifyInspector(["globals", "currentUser"], dataListAfter);
    });

    cy.apiUpdateProfile({
      firstName: "The",
      lastName: "developer",
    });

    cy.apiDeleteApp();
  });

  it("should verify the values of environment inside globals inspector", () => {
    const developmentEnvId = Cypress.env("environmentId");
    const dataList = [
      ["id", `"${developmentEnvId.slice(0, 31)}...`],
      ["name", `development`],
    ];

    navigateAndVerifyInspector(["globals", "environment"], dataList);

    // Promote to staging
    cy.apiPromoteAppVersion().then(() => {
      const stagingId = Cypress.env("stagingEnvId");

      cy.reload();
      navigateAndVerifyInspector(
        ["globals", "environment"],
        [
          ["id", `"${stagingId.slice(0, 31)}...`],
          ["name", `staging`],
        ]
      );

      // Promote to production
      cy.apiPromoteAppVersion(Cypress.env("stagingEnvId")).then(() => {
        const productionId = Cypress.env("productionEnvId");

        cy.reload();
        navigateAndVerifyInspector(
          ["globals", "environment"],
          [
            ["id", `"${productionId.slice(0, 31)}...`],
            ["name", `production`],
          ]
        );
      });
    });

    cy.apiDeleteApp();
  });

  it("should verify the values of mode inside globals inspector", () => {
    const dataList = [["value", `edit`]];

    navigateAndVerifyInspector(["globals", "mode"], dataList);

    cy.apiDeleteApp();
  });

  it("should verify the values of theme inside globals inspector", () => {
    const dataList = [["name", `light`]];

    navigateAndVerifyInspector(["globals", "theme"], dataList);

    cy.apiUpdateGlobalSettings({ appMode: "dark" });

    cy.reload();

    navigateAndVerifyInspector(["globals", "theme"], [["name", `dark`]]);

    cy.apiDeleteApp();
  });

  it("should verify the values of urlparams inside globals inspector", () => {
    const dataList = [["key", `value`]];
    const updateURLData = [["key", `updatedvalue`]];
    const paramData = (updateURLData) =>
      Array.isArray(updateURLData) && updateURLData.length
        ? `?${updateURLData
            .filter(([k]) => k)
            .map(
              ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
            )
            .join("&")}`
        : "";

    navigateAndVerifyInspector(["globals", "urlparams"], dataList);

    cy.visit(
      `/${Cypress.env("workspaceId")}/apps/${Cypress.env("appId")}/${paramData(updateURLData)}`
    );

    navigateAndVerifyInspector(["globals", "urlparams"], updateURLData);

    cy.apiDeleteApp();
  });
});
