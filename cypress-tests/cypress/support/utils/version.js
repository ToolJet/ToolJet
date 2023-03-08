import { appVersionText } from "Texts/exportImport";
import { appVersionSelectors } from "Selectors/exportImport";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

export const navigateToCreateNewVersionModal = (value) => {
	cy.get(appVersionSelectors.currentVersionField(value)).should("be.visible").click();
	cy.contains(appVersionText.createNewVersion).should("be.visible").click();
}
export const verifyElementsOfCreateNewVersionModal = (newVersion = []) => {

	cy.get(appVersionSelectors.createVersionTitle).verifyVisibleElement("have.text", appVersionText.createNewVersion);
	cy.get(appVersionSelectors.versionNamelabel).verifyVisibleElement("have.text", appVersionText.versionNameLabel);
	cy.get(appVersionSelectors.createVersionFromLabel).verifyVisibleElement("have.text", appVersionText.createVersionFromLabel);
	cy.get(appVersionSelectors.createVersionTitle).should("be.visible");
	cy.get(appVersionSelectors.createVersionInputField).should("be.visible");
	cy.get(
		commonSelectors.buttonSelector(appVersionText.createNewVersion)
	).verifyVisibleElement("have.text", appVersionText.createNewVersion);
	cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
		.should("be.visible")
		.and("have.text", commonText.cancelButton);

}