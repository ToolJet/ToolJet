import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    navigateToCreateNewVersionModal
} from "Support/utils/version";
import { createNewVersion } from "Support/utils/exportImport";
describe("Comments", () => {
    let currentVersion = "";
    let newVersion = [];
    let versionFrom = "";
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
    it("Should verify the resolved comments", () => {
        cy.get('[data-cy="left-sidebar-comments-button"]').click();
        cy.get('[data-cy=real-canvas]').click();
        cy.get('.comment').click();
        cy.get('textarea').type("name");
        cy.get('.col-2 > .btn').click();
        cy.get('.comment-popover > .card-header > .ms-auto>:eq(0)').click();
        cy.verifyToastMessage(
            `[class=go3958317564]`,
            "Thread resolved"
        );
        cy.get('[style="padding: 16px 8px; border-radius: 6px;"] > .d-flex > [aria-selected="false"]').click();
        cy.get('.fw-400').should("be.have", "text", "Total 1 comment");
        cy.get('.comment-notification-message').should("be.have", "text", "name");
    })
    it("Should verify the comment is deleted", () => {
        cy.get('[data-cy="left-sidebar-comments-button"]').click();
        cy.get('[data-cy=real-canvas]').click();
        cy.get('.comment').click();
        cy.get('textarea').type("name");
        cy.get('.col-2 > .btn').click();
        cy.get('.comment-popover > .card-header > .ms-auto>:eq(1)').click();
        cy.verifyToastMessage(
            `[class=go3958317564]`,
            "Thread deleted"
        );
    })
    it("Should verify user can close comments", () => {
        cy.get('[data-cy="left-sidebar-comments-button"]').click();
        cy.get('[data-cy=real-canvas]').click();
        cy.get('.comment-notification-sidebar > :nth-child(1)>:eq(1)').click();
        cy.notVisible('.comment');

    })
    it("Should verify comments do not open on new version", () => {
        cy.get('[data-cy="left-sidebar-comments-button"]').click();
        cy.get('[data-cy=real-canvas]').click();
        navigateToCreateNewVersionModal((currentVersion = "v1"));
        createNewVersion((newVersion = ["v2"]), (versionFrom = "v1"));
        cy.notVisible('.comment');

    })
    it("Should verify the mention of the user", () => {
        cy.get('[data-cy="left-sidebar-comments-button"]').click();
        cy.get('[data-cy=real-canvas]').click();
        cy.get('.comment').click();
        cy.get('textarea').type("@dev");
        cy.wait(1000);
        cy.realPress("Enter")
        cy.get('.col-2 > .btn').click();
        cy.get('.navbar-brand').click();
        cy.get('.notification-center-nav-item').click();
        cy.get('.text-muted > .row > .col').click();
        cy.openInCurrentTab('.d-block');

    })

});