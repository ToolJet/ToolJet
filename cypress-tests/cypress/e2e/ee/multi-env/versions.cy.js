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
import { commonEeSelectors, multiEnvSelector } from "Selectors/eeCommon";

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
        cy.appUILogin();

    });

    it("Verify the elements of the version module", () => {
        cy.createApp();
        cy.get(appVersionSelectors.appVersionLabel).should("be.visible");
        navigateToCreateNewVersionModal((currentVersion = "v1"));
        cy.wait(500)
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
        cy.createApp();
        cy.renameApp(data.appName);

        cy.dragAndDropWidget("Toggle Switch", 50, 50);
        verifyComponent("toggleswitch1");

        navigateToCreateNewVersionModal((currentVersion = "v1"));
        createNewVersion((newVersion = ["v2"]), (versionFrom = "v1"));
        verifyComponent("toggleswitch1");
        cy.wait(2000)
        deleteComponentAndVerify("toggleswitch1");

        cy.dragAndDropWidget('button');
        verifyComponent("button1");
        navigateToCreateNewVersionModal((currentVersion = "v2"));
        createNewVersion((newVersion = ["v3"]), (versionFrom = "v2"));
        verifyComponent("button1");

        cy.get(commonEeSelectors.promoteButton).click();
        cy.get(commonEeSelectors.promoteButton).eq(1).click();
        cy.waitForAppLoad();
        cy.wait(1500);

        verifyComponent("button1");
        cy.get('[data-cy="list-current-env-name"]').click();
        cy.get(multiEnvSelector.envNameList).eq(0).click()

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
        cy.waitForAppLoad();
        cy.wait(1500);
        cy.get('[data-cy="list-current-env-name"]').click();
        cy.get(multiEnvSelector.envNameList).eq(1).click()

        cy.get(commonEeSelectors.promoteButton).click();
        cy.get(commonEeSelectors.promoteButton).eq(1).click();
        cy.waitForAppLoad();
        cy.wait(1500);

        releasedVersionAndVerify((currentVersion = "v3"));
        cy.url().then((url) => {
            const parts = url.split('/');
            const value = parts[parts.length - 1];
            cy.log(`Extracted value: ${value}`);
            cy.get(commonSelectors.editorPageLogo).click();
            cy.wait(1000)

            cy.visit(`/applications/${value}`)
            cy.wait(3000);
        });

        verifyComponent("button1");
        cy.go("back");
        cy.wait(1000)
        navigateToAppEditor(data.appName);
        cy.get('[data-cy="list-current-env-name"]').click();
        cy.get(multiEnvSelector.envNameList).eq(0).click()
        navigateToCreateNewVersionModal((currentVersion = "v3"));
        createNewVersion((newVersion = ["v6"]), (versionFrom = "v3"));

        verifyVersionAfterPreview((currentVersion = "v6"));
        cy.go("back");
    });
});
