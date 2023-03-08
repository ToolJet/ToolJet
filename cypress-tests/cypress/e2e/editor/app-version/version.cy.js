import { appVersionSelectors } from "Selectors/exportImport";
import { appVersionText } from "Texts/exportImport";
import { createNewVersion } from "Support/utils/exportImport";
import { navigateToCreateNewVersionModal, verifyElementsOfCreateNewVersionModal } from "Support/utils/version";
import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";


describe("App Export Functionality", () => {
	var data = {};
	data.appName1 = `${fake.companyName}-App`;
	let currentVersion = "";
	let newVersion = [];
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

		verifyElementsOfCreateNewVersionModal(currentVersion = "v1", newVersion = ["v2"])
	});
});
