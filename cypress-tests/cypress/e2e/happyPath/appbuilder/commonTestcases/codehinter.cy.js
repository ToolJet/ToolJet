import { fake } from "Fixtures/fake";
import { addAndVerifyOnSingleLine } from "Support/utils/editor/codehinter";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
    openEditorSidebar,
} from "Support/utils/commonWidget";

describe("Editor- CodeHinter", () => {
    let currentVersion = "";
    let newVersion = [];
    let versionFrom = "";
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-inspector-App`);
        cy.apiOpenApp();
    });

    it.only("should verify singleLine: non dynamic values", () => {
        cy.dragAndDropWidget("Text", 500, 500);
        addAndVerifyOnSingleLine(`{{globals.currentUser.email}} {{globals.currentUser.firstName}} {{globals.currentUser.lastName}} {{globals.currentUser.id}} {{globals.currentUser.avatarId}} {{globals.currentUser.groups[0]}} {{globals.currentUser.groups[1]}} {{globals.currentUser.groups[2]}} {{globals.currentUser.role}} {{globals.currentUser.ssoUserInfo}} {{globals.environment.id}} {{globals.environment.name}} {{globals.mode.value}} {{globals.theme.name}} {{globals.urlparams}} {{page.handle}} {{page.id}} {{page.name}}`)
        cy.get('[data-cy=draggable-widget-text1]:eq(0)').invoke('text').then((text => { cy.log(text) }))
    });
    it("should verify singleLine: dynamic values", () => {
    });
    it("should verify multiLine: non dynamic values", () => {
    });
    it("should verify multiLine: dynamic values", () => {
    });
});
