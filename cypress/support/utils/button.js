import { buttonSelector } from "Selectors/button";
import { buttonText } from "Texts/button";
import {commonSelectors} from "Selectors/common";


export const propertiesElements = () => {
    cy.get(buttonSelector.buttonWidget).dblclick();

    cy.get(buttonSelector.buttonProperties).should("be.visible").and("have.text",buttonText.buttonProperties);
    cy.get(buttonSelector.buttonName).should("be.visible");

    cy.get(buttonSelector.propertiesElements.eventsAccordion).click();
    cy.get(buttonSelector.propertiesElements.layoutAccordion).click();
    for(const elements in buttonSelector.propertiesElements){
        cy.get(buttonSelector.propertiesElements[elements]).should("be.visible").and("have.text",buttonText.propertiesElements[elements]);
    }

    cy.get(buttonSelector.loadingStateToggle).should("be.visible");
    cy.get(buttonSelector.loadingStateFx).should("be.visible").and("have.text",buttonText.fxButton);
    cy.get(buttonSelector.desktopToggle).should("be.visible");
    cy.get(buttonSelector.desktopFx).should("be.visible").and("have.text",buttonText.fxButton);
    cy.get(buttonSelector.mobileToggle).should("be.visible");
    cy.get(buttonSelector.mobileFx).should("be.visible").and("have.text",buttonText.fxButton);

};

export const stylesElements = () => {
    cy.get(buttonSelector.buttonWidget).dblclick();
    cy.get(buttonSelector.buttonStyles).should("be.visible").and("have.text",buttonText.buttonStyles);
    cy.get(buttonSelector.buttonStyles).click();
    for(const elements in buttonSelector.stylesElements){
        cy.get(buttonSelector.stylesElements[elements]).should("be.visible").and("have.text",buttonText.stylesElements[elements]);
    }
    for(const inputs in buttonSelector.stylesInput){
        cy.get(buttonSelector.stylesInput[inputs]).should("be.visible");
    }
    for(const fx in buttonSelector.stylesFx){
        cy.get(buttonSelector.stylesFx[fx]).should("be.visible").and("have.text",buttonText.fxButton);
    }
    cy.get(buttonSelector.visibilityToggle).should("be.visible");
    cy.get(buttonSelector.disableToggle).should("be.visible");

};

export const deleteApp = () => {
    cy.go('back');
    cy.get(commonSelectors.appCardOptions).click();
    cy.get(commonSelectors.deleteApp).click();
    cy.get(commonSelectors.confirmButton).click();

};

export const navigateToEditor = () => {
    cy.get(commonSelectors.appCard).click();
    cy.get(commonSelectors.editButton).click();
};

export const eventListnerCard = () => {
    cy.get(buttonSelector.eventLabel).should("be.visible").and("have.text", buttonText.eventLabel);
    cy.get(buttonSelector.eventSelection).should("be.visible");
    cy.get(buttonSelector.actionLabel).should("be.visible").and("have.text", buttonText.actionLabel);
    cy.get(buttonSelector.actionSelection).should("be.visible");
    cy.get(buttonSelector.actionOption).should("be.visible").and("have.text", buttonText.actionOption);
    cy.get(buttonSelector.messageLabel).should("be.visible").and("have.text", buttonText.messageLabel);
    cy.get(buttonSelector.messageText).should("be.visible");
    cy.get(buttonSelector.alertTypeLabel).should("be.visible").and("have.text", buttonText.alertTypeLabel);
    cy.get(buttonSelector.alertMessageType).should("be.visible");
};

 export const colorPickerCard = () => {
    cy.get(buttonSelector.backgroundColorSelector).should("be.visible").click();
    cy.get(buttonSelector.colorPickCard).should("be.visible");
    for(const elements in buttonSelector.backgroundColor){
        cy.get(buttonSelector.backgroundColor[elements]).should("be.visible");
    }
    cy.get(buttonSelector.stylesFx.backgroundColor).click();
    cy.get(buttonSelector.backgroundColorInput).should("have.text", buttonText.backgroundColorInput);
    cy.get(buttonSelector.backgroundColorCloseFx).click();

    cy.get(buttonSelector.textColorSelector).should("be.visible").click();
    cy.get(buttonSelector.colorPickCard).should("be.visible");
    for(const elements in buttonSelector.textColor){
        cy.get(buttonSelector.textColor[elements]).should("be.visible");
    }
    cy.get(buttonSelector.stylesFx.textColor).click();
    cy.get(buttonSelector.textColorInput).should("have.text", buttonText.textColorInput);
    cy.get(buttonSelector.textColorCloseFx).click();

    cy.get(buttonSelector.loaderColorSelector).should("be.visible").click();
    cy.get(buttonSelector.colorPickCard).should("be.visible");
    for(const elements in buttonSelector.loaderColor){
        cy.get(buttonSelector.loaderColor[elements]).should("be.visible");
    }
    cy.get(buttonSelector.stylesFx.loaderColor).click();
    cy.get(buttonSelector.loaderColorInput).should("have.text", buttonText.loaderColorInput);
    cy.get(buttonSelector.loaderColorCloseFx).click();
 };