import { commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersSelector } from "Selectors/manageUsers";
import { commonSelectors } from "Selectors/common";
import { navigateToManageUsers, logout } from "Support/utils/common";
import { onboardingSelectors } from "Selectors/onboarding";
import { usersText } from "Texts/manageUsers";
import {
  fillUserInviteForm,
  fetchAndVisitInviteLink,
} from "Support/utils/manageUsers";

const dynamicRole = "admin";
const metadatakey = fake.firstName.toLowerCase();
const metadatavalue = fake.firstName + "1";
const email = `testuser+${Date.now()}@example.com`;
const name = fake.firstName;
const updatedMetadataValue = fake.firstName;

describe("User Metadata and Validation", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
  });

  it("should invite user with metadata and validate values", () => {
    navigateToManageUsers();
    inviteUserWithUserRoleAndMetadata(name, email, dynamicRole);
    cy.createApp(`app-${Date.now()}`);
    cy.reload();
    // Verify metadata value in widget after invite
    cy.get(commonWidgetSelector.inspectorIcon).click();
    cy.get(commonWidgetSelector.constantInspectorIcon).click({ force: true });
    cy.wait(1000);
    cy.get(commonWidgetSelector.inspectornodeglobals)
      .scrollIntoView()
      .find(".node-key")
      .click({ force: true });

    cy.get('[data-cy="inspector-node-currentuser"]')
      .parents(".json-node-element")
      .find(".json-tree-node-icon")
      .click({ force: true });

    cy.get(commonWidgetSelector.inspectorNodeMetadata)
      .parents(".json-node-element")
      .find(".json-tree-node-icon")
      .click({ force: true });

    cy.skipEditorPopover();
    cy.dragAndDropWidget("Text Input", 200, 200);
    cy.get(commonWidgetSelector.defaultValueInputField).clearAndTypeOnCodeMirror(
      `{{globals.currentUser.metadata.${metadatakey}}}`
    );
    cy.forceClickOnCanvas();
    cy.wait(1000);
    cy.get(commonWidgetSelector.draggableWidgetTextInput).should(($input) => {
      expect($input.val()).to.eq(metadatavalue);
    });
    // EDIT metadata and verify updated value
    cy.apiLogin();
    cy.visit("/");
    navigateToManageUsers();
    cy.wait(3000);
    cy.get("table tbody tr", { timeout: 10000 }).should("have.length.at.least", 1);
    cy.contains("table tbody td", email, { timeout: 15000 })
    cy.contains("td", email, { timeout: 10000 }).should("be.visible")
      .parents("tr")
      .within(() => {
        cy.get('[data-cy="user-actions-button"]').click({ force: true });
      });
    cy.get(usersSelector.editUserDetailsButton).click();
    cy.get(commonWidgetSelector.iconHidden).eq(0).click();
    cy.get('[placeholder="Value"]').first()
      .clear()
      .type(updatedMetadataValue)
      .blur();
    cy.get(commonWidgetSelector.buttoninviteusers).click();
    cy.get(commonSelectors.settingsIcon).click();
    cy.get(commonSelectors.logoutLink).click();
    cy.clearAndType(onboardingSelectors.loginEmailInput, email);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
    cy.get(commonWidgetSelector.signInButton).click();
    cy.get(commonSelectors.dashboardIcon).click();
    cy.createApp(`app-${Date.now()}`);
    cy.reload();
    cy.get(commonWidgetSelector.inspectorIcon).click();
    cy.get(commonWidgetSelector.constantInspectorIcon).click({ force: true });
    cy.wait(500);
    cy.get(commonWidgetSelector.inspectornodeglobals)
      .scrollIntoView()
      .find(".node-key")
      .click({ force: true });

    cy.get(commonWidgetSelector.inspectorNodeCurrentUser)
      .parents(".json-node-element")
      .find(".json-tree-node-icon")
      .click({ force: true });

    cy.get(commonWidgetSelector.inspectorNodeMetadata)
      .parents(".json-node-element")
      .find(".json-tree-node-icon")
      .click({ force: true });

    cy.skipEditorPopover();
    cy.dragAndDropWidget("Text Input", 200, 200);
    cy.get(commonWidgetSelector.defaultValueInputField).clearAndTypeOnCodeMirror(
      `{{globals.currentUser.metadata.${metadatakey}}}`
    );
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidgetTextInput).should(($input) => {
      expect($input.val()).to.eq(updatedMetadataValue);
    });
    //DELETE metadata and verify
    cy.visit("/");
    navigateToManageUsers();
    cy.contains("td", email)
      .parents("tr")
      .within(() => {
        cy.get(usersSelector.userActionButton).click();
      });
    cy.get(usersSelector.editUserDetailsButton).click();
    cy.get("button.delete-field-option").eq(0).click();
    cy.get(commonWidgetSelector.buttoninviteusers).click();
    cy.get(commonSelectors.settingsIcon).click();
    cy.get(commonSelectors.logoutLink).click();
    cy.clearAndType(onboardingSelectors.loginEmailInput, email);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
    cy.get(commonWidgetSelector.signInButton).click();
    cy.get(commonSelectors.dashboardIcon).click();
    cy.createApp(`app-${Date.now()}`);
    cy.reload();
    cy.get(commonWidgetSelector.inspectorIcon).click();
    cy.get(commonWidgetSelector.constantInspectorIcon).click({ force: true });
    cy.wait(500);
    cy.get(commonWidgetSelector.inspectornodeglobals)
      .scrollIntoView()
      .find(".node-key")
      .click({ force: true });

    cy.get(commonWidgetSelector.inspectorNodeCurrentUser)
      .parents(".json-node-element")
      .find(".json-tree-node-icon")
      .click({ force: true });

    cy.get(commonWidgetSelector.inspectorNodeMetadata)
      .parents(".json-node-element")
      .find(".json-tree-node-icon")
      .click({ force: true });
  });
});
function inviteUserWithUserRoleAndMetadata(firstName, email, role) {
  fillUserInviteForm(firstName, email);
  cy.contains("button", "Add more").click();
  cy.get('input.input-control[placeholder="Key"]').type(metadatakey);
  cy.get('input.input-control[placeholder="Value"][type="password"]').eq(0).type(metadatavalue);
  cy.wait(2000);
  cy.get("body").then(($body) => {
    const selectDropdown = $body.find('[data-cy="user-group-select"]>>>>>');
    if (selectDropdown.length === 0) {
      cy.get('[data-cy="user-group-select"]>>>>>').click();
    }
    cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type(role);
    cy.wait(1000);
    cy.get('[data-cy="group-check-input"]').eq(0).check();
    cy.wait(1000);
  });
  cy.get(usersSelector.buttonInviteUsers).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, usersText.userCreatedToast);
  cy.wait(1000);
  fetchAndVisitInviteLink(email);
  cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
  cy.get(commonSelectors.signUpButton).click();
  cy.wait(2000);
  cy.get(commonSelectors.acceptInviteButton).click();
  cy.get(commonSelectors.homePageLogo, { timeout: 10000 }).should("be.visible");
}
