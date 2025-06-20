

import { buttonText } from "Texts/button";

import { commonWidgetText } from "Texts/common";

import { verifyControlComponentAction } from "Support/utils/button";
import { resizeQueryPanel } from "Support/utils/dataSource";



import { fake } from "Fixtures/fake";

describe("Custom Component", () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-App`);
        cy.openApp();
        cy.dragAndDropWidget("Custom Component");
    });
    it("verify the data", () => {

        cy.get('[data-cy="left-sidebar-inspect-button"]').click();
        cy.get('[data-cy="inspector-node-components"] > .node-key').click();
        cy.get('[data-cy="inspector-node-customcomponent1"] > .node-key').click();
        cy.get('[data-cy="inspector-node-data"] > .node-key').click().should("have.text", "Title - Hi there")



    })
})