import { buttonSelector } from "Selectors/button";
import {commonSelectors} from "Selectors/common";
import { buttonText } from "Texts/button";
import * as button from "Support/utils/button"; 


describe("Editor- Test Button widget",()=>{
    beforeEach(()=>{
        cy.appLogin();
        cy.createAppIfEmptyDashboard();
        button.navigateToEditor();
        cy.dragAndDropWidget(buttonText.widgetName);
    });

    it("should verify the properties of the button widget",()=>{
        button.propertiesElements();

        cy.get(buttonSelector.buttonInputField).first().click().type(`{selectall}${buttonText.buttonText}`);
        cy.get(buttonSelector.buttonProperties).click();
        cy.get(buttonSelector.buttonWidget).should("have.text",buttonText.buttonText);
        
        cy.get(buttonSelector.buttonName).should("be.visible");
        cy.get(buttonSelector.buttonProperties).click();
        cy.get(buttonSelector.buttonName).clear().type(` ${buttonText.invalidButtonName}{enter}`);
        cy.verifyToastMessage(commonSelectors.toastMessage,buttonText.buttonNameErrToast);
        cy.get(buttonSelector.buttonName).clear().type(`{selectall}${buttonText.validButtonName}{enter}`);
        cy.verifyToastMessage(commonSelectors.toastMessage,buttonText.savedToast);

        cy.get(buttonSelector.loadingStateFx).click();
        cy.get(buttonSelector.fxLoadingState).should("have.text", buttonText.falseText);
        cy.get(buttonSelector.loadingStateInputFx).click();
        cy.get(buttonSelector.loadingStateToggle).check();
        cy.get(buttonSelector.loadingStateFx).click();
        cy.get(buttonSelector.fxLoadingState).should("have.text", buttonText.trueText);
        cy.get(buttonSelector.loadingStateInputFx).click();
        cy.get(buttonSelector.loadingStateToggle).uncheck();
        cy.get(buttonSelector.propertiesElements.propertiesAccordion).click();

        cy.get(buttonSelector.propertiesElements.addEventListner).click();
        cy.get(buttonSelector.eventHandler).click();
        cy.get(buttonSelector.popoverCard).should("be.visible");
        button.eventListnerCard();
        cy.get(buttonSelector.messageText).click().type(buttonText.newMessage);
        cy.get(buttonSelector.buttonWidget).click({force:true});

        cy.get(buttonSelector.desktopFx).click();
        cy.get(buttonSelector.fxDesktop).should("have.text", buttonText.trueText);
        cy.get(buttonSelector.desktopInputFx).click();
        cy.get(buttonSelector.desktopToggle).uncheck();
        cy.get(buttonSelector.desktopFx).click();
        cy.get(buttonSelector.fxDesktop).should("have.text", buttonText.falseText);
        cy.get(buttonSelector.desktopInputFx).click();
        cy.get(buttonSelector.desktopToggle).check();

        cy.get(buttonSelector.mobileFx).click();
        cy.get(buttonSelector.fxMobile).should("have.text", buttonText.falseText);
        cy.get(buttonSelector.mobileInputFx).click();
        cy.get(buttonSelector.mobileToggle).check();
        cy.get(buttonSelector.mobileFx).click();
        cy.get(buttonSelector.fxMobile).should("have.text", buttonText.trueText);
        cy.get(buttonSelector.mobileInputFx).click();
        cy.get(buttonSelector.mobileToggle).uncheck();

        button.deleteApp();

    });

    it("should verify the styles of the button widget",()=>{
        button.stylesElements();
        button.colorPickerCard();
        cy.get(buttonSelector.stylesFx.visibility).click();
        cy.get(buttonSelector.fxVisibility).should("have.text",buttonText.trueText);
        cy.get(buttonSelector.visibilityCloseFx).click();
        cy.get(buttonSelector.visibilityToggle).uncheck();
        cy.get(buttonSelector.stylesFx.visibility).click();
        cy.get(buttonSelector.fxVisibility).should("have.text",buttonText.falseText);
        cy.get(buttonSelector.visibilityCloseFx).click();
        cy.get(buttonSelector.buttonWidget).should("not.be.visible");
        cy.get(buttonSelector.visibilityToggle).check();

        cy.get(buttonSelector.stylesFx.disable).click();
        cy.get(buttonSelector.fxDisable).should("have.text",buttonText.falseText);
        cy.get(buttonSelector.disableCloseFx).click();
        cy.get(buttonSelector.disableToggle).check();
        cy.get(buttonSelector.stylesFx.disable).click();
        cy.get(buttonSelector.fxDisable).should("have.text",buttonText.trueText);
        cy.get(buttonSelector.disableCloseFx).click();
        cy.get(buttonSelector.buttonWidget).should("be.disabled");
        cy.get(buttonSelector.disableToggle).uncheck();
        cy.get(buttonSelector.buttonWidget).should("be.enabled");

        cy.get(buttonSelector.stylesInput.borderRadiusInputField).clear().type("15");
        cy.get(buttonSelector.stylesFx.borderRadius).click();
        cy.get(buttonSelector.fxBorderRadius).should("have.text", buttonText.borderRadiusInput)

        button.deleteApp();

    });

});