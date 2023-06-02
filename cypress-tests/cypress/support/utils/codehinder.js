import { commonWidgetSelector } from "Selectors/common";
import { addInputOnQueryField } from "Support/utils/queries";

export const addPropertiesFromCodeHinderPopup = (fx, data, header, i = 1) => {
  cy.get(commonWidgetSelector.parameterFxButton(fx)).eq(i).realClick();
  addFromCodeHinderPopup(fx, data, header);
};

export const addFromCodeHinderPopup = (fx, data, header) => {
  cy.get(commonWidgetSelector.parameterInputField(fx))
    .click()
    .realHover()
    .find('[class="svg-icon m-2 popup-btn"]')
    .click();
  cy.wait(100);

  cy.get('[data-cy="codehinder-popup-badge"]').should("have.text", header);

  addInputOnQueryField("codehinder-popup", data);
  cy.get('[data-cy="codehinder-popup-close-option-icon"]').click();
};
