import "cypress-mailhog";
import { commonSelectors } from "Selectors/common";
const API_ENDPOINT =
    Cypress.env("environment") === "Community"
        ? "/api/library_apps"
        : "/api/library_apps";

Cypress.Commands.add("installMarketplacePlugin", (pluginName) => {
    const MARKETPLACE_URL = `${Cypress.config("baseUrl")}/integrations/marketplace`;

    cy.visit(MARKETPLACE_URL);
    cy.wait(1000);

    cy.get('[data-cy="-list-item"]').eq(0).click();
    cy.wait(1000);

    cy.get("body").then(($body) => {
        if ($body.find(".plugins-card").length === 0) {
            cy.log("No plugins found, proceeding to install...");
            installPlugin(pluginName);
        } else {
            cy.get(".plugins-card").then(($cards) => {
                const isInstalled = $cards.toArray().some((card) => {
                    return (
                        Cypress.$(card)
                            .find(".font-weight-medium.text-capitalize")
                            .text()
                            .trim() === pluginName
                    );
                });

                if (isInstalled) {
                    cy.log(`${pluginName} is already installed. Skipping installation.`);
                    cy.get(commonSelectors.globalDataSourceIcon).click();
                } else {
                    installPlugin(pluginName);
                    cy.get(commonSelectors.globalDataSourceIcon).click();
                }
            });
        }
    });

    function installPlugin(pluginName) {
        cy.get('[data-cy="-list-item"]').eq(1).click();
        cy.wait(1000);

        cy.contains(".plugins-card", pluginName).within(() => {
            cy.get(".marketplace-install").click();
            cy.wait(1000);
        });
    }
});

Cypress.Commands.add("uninstallMarketplacePlugin", (pluginName) => {
    const MARKETPLACE_URL = `${Cypress.config("baseUrl")}/integrations/marketplace`;

    cy.visit(MARKETPLACE_URL);
    cy.wait(1000);

    cy.get('[data-cy="-list-item"]').eq(0).click();
    cy.wait(1000);

    cy.get(".plugins-card").each(($card) => {
        cy.wrap($card)
            .find(".font-weight-medium.text-capitalize")
            .invoke("text")
            .then((text) => {
                if (text.trim() === pluginName) {
                    cy.wrap($card).find(".link-primary").contains("Remove").click();
                    cy.wait(1000);

                    cy.get('[data-cy="delete-plugin-title"]').should("be.visible");
                    cy.get('[data-cy="yes-button"]').click();
                    cy.wait(2000);

                    cy.log(`${pluginName} has been successfully uninstalled.`);
                } else {
                    cy.log(`${pluginName} is not installed. Skipping uninstallation.`);
                }
            });
    });
});

Cypress.Commands.add(
    "verifyRequiredFieldValidation",
    (fieldName, expectedColor) => {
        cy.get(commonSelectors.textField(fieldName)).type("some text").clear();
        cy.get(commonSelectors.textField(fieldName)).should(
            "have.css",
            "border-color",
            expectedColor
        );
        cy.get(commonSelectors.labelFieldValidation(fieldName))
            .should("be.visible")
            .and("have.text", `${fieldName} is required`);
        cy.get(commonSelectors.labelFieldAlert(fieldName))
            .should("be.visible")
            .and("have.text", `${fieldName} is required`);
    }
);

