import { appVersionText } from "Texts/exportImport";
import { appVersionSelectors } from "Selectors/exportImport";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { deleteVersionSelectors, editVersionSelectors } from "Selectors/version";
import { deleteVersionText, editVersionText } from "Texts/version";

export const navigateToCreateNewVersionModal = (value) => {
	cy.get(appVersionSelectors.currentVersionField(value)).should("be.visible").click();
	cy.contains(appVersionText.createNewVersion).should("be.visible").click();
}

export const navigateToEditVersionModal = (value) => {
	cy.get(appVersionSelectors.currentVersionField(value)).should("be.visible").click();
	cy.get(".row").eq(8).should("be.visible")
		.within(() => {
			cy.get(".icon").trigger("mouseover").click();
		})
}

export const verifyElementsOfCreateNewVersionModal = (version = []) => {

	cy.get(appVersionSelectors.createNewVersion).verifyVisibleElement("have.text", appVersionText.createNewVersion);
	cy.get(appVersionSelectors.versionNamelabel).verifyVisibleElement("have.text", appVersionText.versionNameLabel);
	cy.get(appVersionSelectors.createVersionFromLabel).verifyVisibleElement("have.text", appVersionText.createVersionFromLabel);
	cy.get(appVersionSelectors.versionNameInputField).should("be.visible");
	cy.get(appVersionSelectors.createVersionInputField).verifyVisibleElement("have.text", version[0]);
	cy.get(
		commonSelectors.buttonSelector(appVersionText.createNewVersion)
	).verifyVisibleElement("have.text", appVersionText.createNewVersion);
	cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
		.should("be.visible")
		.and("have.text", commonText.cancelButton);
	cy.get(commonSelectors.buttonSelector(commonText.closeButton)).should(
		"be.visible"
	).click();

}

export const editVersionAndVerify = (version = [], newVersion) => {
	navigateToEditVersionModal(version[0])
	cy.get(editVersionSelectors.versionNameInputField).verifyVisibleElement("have.value", version[0]);

	cy.clearAndType(
		editVersionSelectors.versionNameInputField,
		newVersion
	);
	cy.get(editVersionSelectors.saveButton).click();
	cy.verifyToastMessage(
		commonSelectors.toastMessage,
		editVersionText.VersionNameUpdatedToastMessage
	);
}
export const deleteVersionAndVerify = (value) => {
	cy.get(appVersionSelectors.currentVersionField(value)).should("be.visible").click();
	cy.contains(`[id*="react-select-"]`, value).should("be.visible")
		.within(() => {
			cy.get(" .app-version-list-item")
				.trigger('mouseover')
				.trigger("mouseenter")
				.find(".app-version-delete")
				.click({ force: true });
		})
	cy.get(deleteVersionSelectors.modalMessage).verifyVisibleElement("have.text", deleteVersionText.deleteModalText(value));
	cy.get(deleteVersionSelectors.yesButton).click();
	cy.verifyToastMessage(
		commonSelectors.toastMessage,
		deleteVersionText.deleteToastMessage(value)
	);
}