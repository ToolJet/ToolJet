import { appVersionSelectors } from "Selectors/exportImport";
import { editVersionSelectors } from "Selectors/version";
import { appVersionText } from "Texts/exportImport";
import { editVersionText } from "Texts/version";
import { createNewVersion } from "Support/utils/exportImport";
import { navigateToCreateNewVersionModal, verifyElementsOfCreateNewVersionModal, navigateToEditVersionModal, editVersionAndVerify, deleteVersionAndVerify } from "Support/utils/version";
import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonText } from "Texts/common";
import { verifyModal, closeModal, navigateToAppEditor } from "Support/utils/common";
import { buttonText } from "Texts/button";

import { verifyComponent, deleteComponentAndVerify } from "Support/utils/basicComponents";

describe("App Export Functionality", () => {
	var data = {};
	data.appName1 = `${fake.companyName}-App`;
	let currentVersion = "";
	let newVersion = [];
	let versionFrom = "";
	beforeEach(() => {
		cy.appUILogin();
	});

	it("Verify the elements of the version module", () => {
		cy.createApp();
		cy.get(appVersionSelectors.appVersionLabel).should("be.visible");
		cy.renameApp(data.appName1);
		cy.get(commonSelectors.appNameInput).verifyVisibleElement(
			"have.value",
			data.appName1
		);
		cy.waitForAutoSave();
		navigateToCreateNewVersionModal(currentVersion = "v1");
		verifyElementsOfCreateNewVersionModal(currentVersion = ["v1"]);

		navigateToEditVersionModal(currentVersion = "v1")
		verifyModal(
			editVersionText.editVersionTitle,
			editVersionText.saveButton,
			editVersionSelectors.versionNameInputField
		);
		closeModal(commonText.closeButton);
	});

	it("Verify all functionality for the app version", () => {
		navigateToAppEditor(data.appName1);
		cy.get('[data-cy="widget-list-box-table"]').should("be.visible");
		cy.get(".driver-close-btn").click();

		cy.dragAndDropWidget("Toggle Switch", 50, 50);
		verifyComponent("toggleswitch1");
		navigateToCreateNewVersionModal(currentVersion = "v1");
		createNewVersion((newVersion = ["v2"]), versionFrom = "v1");
		verifyComponent("toggleswitch1");
		deleteComponentAndVerify("toggleswitch1");


		cy.dragAndDropWidget(buttonText.defaultWidgetText);
		verifyComponent("button1");
		navigateToCreateNewVersionModal(currentVersion = "v2");
		createNewVersion((newVersion = ["v3"]), versionFrom = "v2");
		verifyComponent("button1");

		navigateToCreateNewVersionModal(currentVersion = "v3");
		createNewVersion((newVersion = ["v4"]), versionFrom = "v1");
		verifyComponent("toggleswitch1");

		editVersionAndVerify(currentVersion = "v4", newVersion = ["v5"])
		deleteVersionAndVerify(currentVersion = "v5");

	})
});
