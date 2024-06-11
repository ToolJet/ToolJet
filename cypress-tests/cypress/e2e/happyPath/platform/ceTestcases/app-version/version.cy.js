import { appVersionSelectors } from "Selectors/exportImport";
import { editVersionSelectors } from "Selectors/version";
import {
  editVersionText,
  releasedVersionText,
  deleteVersionText,
} from "Texts/version";
import { createNewVersion } from "Support/utils/exportImport";
import {
  navigateToCreateNewVersionModal,
  verifyElementsOfCreateNewVersionModal,
  navigateToEditVersionModal,
  editVersionAndVerify,
  deleteVersionAndVerify,
  releasedVersionAndVerify,
  verifyDuplicateVersion,
  verifyVersionAfterPreview,
} from "Support/utils/version";
import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import {
  verifyModal,
  closeModal,
  navigateToAppEditor,
} from "Support/utils/common";
import { buttonText } from "Texts/button";

import {
  verifyComponent,
  deleteComponentAndVerify,
} from "Support/utils/basicComponents";

describe("App Version Functionality", () => {
  var data = {};
  data.appName = `${fake.companyName}-App`;
  let currentVersion = "";
  let newVersion = [];
  let versionFrom = "";

  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    cy.skipWalkthrough();
  })

  it("Verify the elements of the version module", () => {
    data.appName = `${fake.companyName}-App`;
    cy.apiCreateApp(data.appName);
    cy.openApp()
    cy.get(appVersionSelectors.appVersionLabel).should("be.visible");
    cy.get(commonSelectors.appNameInput).verifyVisibleElement(
      "have.value",
      data.appName
    );
    cy.waitForAutoSave();
    navigateToCreateNewVersionModal((currentVersion = "v1"));
    verifyElementsOfCreateNewVersionModal((currentVersion = ["v1"]));

    navigateToEditVersionModal((currentVersion = "v1"));
    verifyModal(
      editVersionText.editVersionTitle,
      editVersionText.saveButton,
      editVersionSelectors.versionNameInputField
    );
    closeModal(commonText.closeButton);
  });

  it("Verify all functionality for the app version", () => {
    data.appName = `${fake.companyName}-App`;
    cy.apiCreateApp(data.appName);
    cy.openApp()
    cy.get('[data-cy="widget-list-box-table"]').should("be.visible");

    cy.dragAndDropWidget("Toggle Switch", 50, 50);
    verifyComponent("toggleswitch1");

    navigateToCreateNewVersionModal((currentVersion = "v1"));
    createNewVersion((newVersion = ["v2"]), (versionFrom = "v1"));
    verifyComponent("toggleswitch1");
    deleteComponentAndVerify("toggleswitch1");

    cy.dragAndDropWidget(buttonText.defaultWidgetText);
    verifyComponent("button1");
    navigateToCreateNewVersionModal((currentVersion = "v2"));
    createNewVersion((newVersion = ["v3"]), (versionFrom = "v2"));
    verifyComponent("button1");

    navigateToCreateNewVersionModal((currentVersion = "v3"));
    createNewVersion((newVersion = ["v4"]), (versionFrom = "v1"));
    verifyComponent("toggleswitch1");

    editVersionAndVerify(
      (currentVersion = "v4"),
      (newVersion = ["v5"]),
      editVersionText.VersionNameUpdatedToastMessage
    );
    navigateToCreateNewVersionModal((currentVersion = "v5"));
    verifyDuplicateVersion((newVersion = ["v5"]), (versionFrom = "v5"));
    closeModal(commonText.closeButton);
    deleteVersionAndVerify(
      (currentVersion = "v5"),
      deleteVersionText.deleteToastMessage((currentVersion = "v5"))
    );

    cy.reload();
    releasedVersionAndVerify((currentVersion = "v3"));
    navigateToCreateNewVersionModal((currentVersion = "v3"));
    createNewVersion((newVersion = ["v6"]), (versionFrom = "v3"));

    verifyVersionAfterPreview((currentVersion = "v6"));

  });
});
