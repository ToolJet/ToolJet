import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { commonText } from "Texts/common";
import {
  editVersionAndVerify,
  deleteVersionAndVerify,
  releasedVersionAndVerify,
  verifyDuplicateVersion,
  verifyVersionAfterPreview,
  navigateToCreateNewVersionModal,
  verifyElementsOfCreateNewVersionModal,
  navigateToEditVersionModal,
  switchVersionAndVerify,
  openPreviewSettings,
} from "Support/utils/version";
import { appVersionSelectors } from "Selectors/exportImport";
import { editVersionSelectors } from "Selectors/version";
import { editVersionText } from "Texts/version";
import { createNewVersion } from "Support/utils/exportImport";
import { verifyModal, closeModal } from "Support/utils/common";
import {
  verifyComponent,
  verifyComponentinrightpannel,
  deleteComponentAndVerify,
} from "Support/utils/basicComponents";
import { deleteVersionText, onlydeleteVersionText } from "Texts/version";
import { createRestAPIQuery } from "Support/utils/dataSource";
import { deleteQuery } from "Support/utils/queries";
import { selectEnv, appPromote } from "Support/utils/platform/multiEnv";
import { performQueryAction } from "Support/utils/queries";

describe("App Version", () => {
  const generateTestData = () => ({
    appName: `${fake.companyName}-Version-App`,
    datasourceName: fake.firstName.toLowerCase(),
    query1: fake.firstName.toLowerCase(),
    query2: fake.firstName.toLowerCase(),
  });

  const verifyWidget = (selector, assertion, expectedValue) => {
    cy.get(commonWidgetSelector.draggableWidget(selector)).verifyVisibleElement(
      assertion,
      expectedValue
    );
  };

  let data;

  beforeEach(() => {
    data = generateTestData();

    cy.defaultWorkspaceLogin();
    cy.apiCreateApp(data.appName);
    cy.openApp();
    cy.viewport(1400, 1400);
  });

  it("should verify basic version management operations", () => {
    cy.get('[data-cy="query-manager-toggle-button"]').click();
    cy.get(appVersionSelectors.appVersionLabel).should("be.visible");
    navigateToCreateNewVersionModal("v1");
    verifyElementsOfCreateNewVersionModal(["v1"]);

    navigateToCreateNewVersionModal("v1");
    cy.get(appVersionSelectors.createNewVersionButton).click();
    cy.get(appVersionSelectors.createNewVersionButton).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Version name should not be empty"
    );

    cy.get(appVersionSelectors.createVersionTitle).should("not.exist");

    verifyDuplicateVersion(["v1"], "v1");
    closeModal(commonText.closeButton);

    navigateToEditVersionModal("v1");
    verifyModal(
      editVersionText.editVersionTitle,
      editVersionText.saveButton,
      editVersionSelectors.versionNameInputField
    );
    closeModal(commonText.closeButton);
    cy.get(editVersionSelectors.editVersionTitle).should("not.exist");

    editVersionAndVerify(
      "v1",
      ["v2"],
      editVersionText.VersionNameUpdatedToastMessage
    );

    verifyComponentinrightpannel("table");
    cy.get(commonSelectors.rightSidebarPlusButton).click();
    cy.dragAndDropWidget("text", 450, 300);
    cy.waitForAutoSave();

    navigateToCreateNewVersionModal("v2");
    createNewVersion(["v3"], "v2");
    cy.waitForAutoSave();
    verifyComponentinrightpannel("table");

    deleteComponentAndVerify("text1");
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.draggableWidget("text1")).should("not.exist");

    deleteVersionAndVerify(
      "v3",
      onlydeleteVersionText.deleteToastMessage("v3")
    );
    cy.get(appVersionSelectors.currentVersionField("v2")).should("be.visible");
    cy.get(appVersionSelectors.currentVersionField("v3")).should("not.exist");

    cy.get(commonWidgetSelector.draggableWidget("text1")).should("be.visible", {
      timeout: 10000,
    });

    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.ifEnv("Community", () => {
      cy.url().should("include", "/home?version=v2");
    });

    cy.ifEnv("Enterprise", () => {
      cy.url().should("include", "/home?env=development&version=v2");
    });

    cy.openApp(
      "",
      Cypress.env("workspaceId"),
      Cypress.env("appId"),
      commonWidgetSelector.draggableWidget("text1")
    );
    releasedVersionAndVerify("v2");
  });

  it("should verify version management with components and queries", () => {
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      data.datasourceName,
      "restapi",
      [{ key: "url", value: "https://jsonplaceholder.typicode.com/users" }]
    );
    cy.apiAddComponentToApp(
      data.appName,
      "text1",
      {},
      "Text",
      `{{queries.${data.query1}.data.name}}`
    );
    cy.waitForAutoSave();

    createRestAPIQuery(data.query1, data.datasourceName, "", "", "/1", true);

    cy.ifEnv("Enterprise", () => {
      appPromote("development", "production");
    });

    navigateToCreateNewVersionModal("v1");
    createNewVersion(["v2"], "v1");
    verifyWidget("text1", "have.text", "Leanne Graham");
    cy.get(`[data-cy="list-query-${data.query1}"]`).should("be.visible");

    deleteComponentAndVerify("text1");

    cy.waitForAutoSave();
    performQueryAction(data.query1, "delete");

    createRestAPIQuery(data.query2, data.datasourceName, "", "", "/2", true);
    cy.apiAddComponentToApp(
      data.appName,
      "textinput",
      {},
      "TextInput",
      `{{queries.${data.query2}.data.name}}`
    );
    cy.waitForAutoSave();

    const versionChecks = [
      {
        create: { version: "v3", from: "v2" },
        verify: {
          component: { selector: "textInput", value: "Ervin Howell" },
          query: data.query2,
        },
      },
      {
        create: { version: "v4", from: "v1" },
        verify: {
          component: { selector: "text1", text: "Leanne Graham" },
          query: data.query1,
        },
      },
      {
        create: { version: "v5", from: "v3" },
        verify: {
          component: { selector: "textInput", value: "Ervin Howell" },
          query: data.query2,
        },
      },
    ];

    versionChecks.forEach((check) => {
      navigateToCreateNewVersionModal(check.create.from);
      createNewVersion([check.create.version], check.create.from);
      cy.waitForAutoSave();
      cy.get(
        appVersionSelectors.currentVersionField(check.create.version)
      ).should("be.visible");

      const assertion = check.verify.component.value
        ? "have.value"
        : "have.text";
      const expected =
        check.verify.component.value || check.verify.component.text;
      verifyWidget(check.verify.component.selector, assertion, expected);

      cy.get(`[data-cy="list-query-${check.verify.query}"]`).should(
        "be.visible"
      );
    });

    releasedVersionAndVerify("v5");
    cy.get(appVersionSelectors.currentVersionField("v5")).should(
      "have.class",
      "color-light-green"
    );

    cy.ifEnv("Enterprise", () => {
      selectEnv("development");
    });
    cy.get(appVersionSelectors.currentVersionField("v5")).click();
    cy.contains(`[id*="react-select-"]`, "v4").click();
    cy.get(appVersionSelectors.currentVersionField("v4")).should(
      "not.have.class",
      "color-light-green"
    );
    verifyWidget("text1", "have.text", "Leanne Graham");
    cy.get(`[data-cy="list-query-${data.query1}"]`).should("be.visible");

    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.ifEnv("Community", () => {
      cy.url().should("include", "/home?version=v4");
    });
    cy.ifEnv("Enterprise", () => {
      cy.url().should("include", "/home?env=development&version=v4");
    });

    verifyWidget("text1", "have.text", "Leanne Graham");

    openPreviewSettings();
    switchVersionAndVerify("v4", "v5");

    verifyWidget("textInput", "have.value", "Ervin Howell");

    cy.ifEnv("Enterprise", () => {
      cy.openApp(
        "",
        Cypress.env("workspaceId"),
        Cypress.env("appId"),
        commonWidgetSelector.draggableWidget("textInput")
      );

      navigateToCreateNewVersionModal("v5");
      createNewVersion(["v6"], "v5");
      cy.waitForAutoSave();
      cy.get(appVersionSelectors.currentVersionField("v6")).should(
        "be.visible"
      );

      appPromote("development", "staging");
      verifyWidget("textInput", "have.value", "Ervin Howell");
      cy.get(`[data-cy="list-query-${data.query2}"]`).should("be.visible");

      appPromote("staging", "production");

      verifyWidget("textInput", "have.value", "Ervin Howell");
      cy.get(`[data-cy="list-query-${data.query2}"]`).should("be.visible");

      cy.openInCurrentTab(commonWidgetSelector.previewButton);
      verifyWidget("textInput", "have.value", "Ervin Howell");
      cy.url().should("include", "/home?env=production&version=v6");

      openPreviewSettings();
      switchVersionAndVerify("v6", "v1");

      verifyWidget("text1", "have.text", "Leanne Graham");

      openPreviewSettings();
      switchVersionAndVerify("v1", "v6");
      cy.wait(1000);

      openPreviewSettings();
      cy.wait(500);
      cy.forceClickOnCanvas();
      openPreviewSettings();

      selectEnv("staging");

      verifyWidget("textInput", "have.value", "Ervin Howell");

      openPreviewSettings();
      selectEnv("development");

      openPreviewSettings();
      switchVersionAndVerify("v6", "v1");

      verifyWidget("text1", "have.text", "Leanne Graham");
    });
  });
});
