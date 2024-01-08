import { fake } from "Fixtures/fake";
describe("Comments", () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-App`);
        cy.openApp();
    });
    it("Should verify the UI elements", () => {
        cy.get('[data-cy="left-sidebar-comments-button"]').click();
        cy.get('[data-cy=real-canvas]').click();
        cy.get('.comment').click();
        cy.get('.comment-notification-header').should("be.have", "text", "Comments");
        cy.get('.comment-notification-sidebar > :nth-child(1) > .ms-auto').should("be.have", "text", "X");
        cy.get('[style="padding: 16px 8px; border-radius: 6px;"] > .d-flex > .bg-white').should("be.have", "text", "Active");
        cy.get('[style="padding: 16px 8px; border-radius: 6px;"] > .d-flex > [aria-selected="false"]').should("be.have", "text", "Resolved");
        cy.get('.fw-400').should("be.have", "text", "Total 0 comments");
        cy.get('.empty-title').should("be.have", "text", "No messages to show");

    })

    it("Should verify to add the comments", () => {
        cy.get('[data-cy="left-sidebar-comments-button"]').click();
        cy.get('[data-cy=real-canvas]').click();
        cy.get('.comment').click();
        cy.get('textarea').type("name");
        cy.get('.col-2 > .btn').click();
        cy.get('[style="padding: 16px 8px; border-radius: 6px;"] > .d-flex > [aria-selected="false"]').click();
        cy.get('[style="padding: 16px 8px; border-radius: 6px;"] > .d-flex > [aria-selected="true"]').click();
        cy.get('.fw-400').should("be.have", "text", "Total 1 comment");
        cy.get('.comment-notification-message').should("be.have", "text", "name");

    }
    );
});