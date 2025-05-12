import { commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersSelector } from "Selectors/manageUsers";
import { inviteUserWithUserRoleAndMetadata } from "Support/utils/manageUsers";
import {
  navigateToManageUsers,
  logout,
} from "Support/utils/common";
import { onboardingSelectors } from "Selectors/onboarding";

describe("User Metadata and Validation", () => {
  const name = "Test User";
  const email = `testuser+${Date.now()}@example.com`;
  const metadata = {
    department: "Engineering",
    value: "QA",
  };
  const data = {};

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
  });

  it("should invite user with metadata and validate values", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    navigateToManageUsers();
    inviteUserWithUserRoleAndMetadata("test", email, "admin");

    cy.createApp(`app-${Date.now()}`);
    cy.reload();

    cy.get(commonWidgetSelector.inspectorIcon).click();
    cy.get(commonWidgetSelector.constantInspectorIcon).click({ force: true });
    cy.wait(1000);
    cy.get(commonWidgetSelector.inspectornodeglobals)
      .scrollIntoView()
      .find('.node-key')
      .click({ force: true });

    cy.get('[data-cy="inspector-node-currentuser"]')
      .parents('.json-node-element')
      .find('.json-tree-node-icon')
      .click({ force: true });

    cy.get(commonWidgetSelector.inspectorNodeMetadata)
      .parents('.json-node-element')
      .find('.json-tree-node-icon')
      .click({ force: true });

    cy.get(commonWidgetSelector.inspectorNodeMetadata).parent().invoke('text').then(console.log);

    cy.skipEditorPopover();
    cy.dragAndDropWidget("Text Input", 200, 200);

    cy.get(
      commonWidgetSelector.defaultValueInputField
    ).clearAndTypeOnCodeMirror(
      "{{globals.currentUser.metadata.test}}"
    );
    cy.forceClickOnCanvas();

    cy.get(commonWidgetSelector.draggableWidgetTextInput).should(
      "have.value",
      "abcd"
    );

    // edit metadata and verify

    cy.apiLogin();
    cy.visit("/");
    navigateToManageUsers();

    cy.contains('td', email)
      .parents('tr')
      .within(() => {
        cy.get(usersSelector.userActionButton).click();
      });
    cy.get(usersSelector.editUserDetailsButton).click();


    cy.get(commonWidgetSelector.iconHidden).eq(0).click();
    cy.get('[placeholder="Value"]')
      .first()
      .clear().type('test2');
    cy.get(commonWidgetSelector.buttoninviteusers).click();

    logout();

    cy.get(commonWidgetSelector.emailInput).type(email)
    cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
    cy.get(commonWidgetSelector.signInButton).click();
    cy.wait(2000);
    cy.get(commonWidgetSelector.dashboardIcon).click();
    cy.createApp(`app-${Date.now()}`);
    cy.reload();

    cy.get(commonWidgetSelector.inspectorIcon).click();
    cy.get(commonWidgetSelector.constantInspectorIcon).click({ force: true });
    cy.wait(500);
    cy.get(commonWidgetSelector.inspectornodeglobals)
      .scrollIntoView()
      .find('.node-key')
      .click({ force: true });

    cy.get(commonWidgetSelector.inspectorNodeCurrentUser)
      .parents('.json-node-element')
      .find('.json-tree-node-icon')
      .click({ force: true });

    cy.get(commonWidgetSelector.inspectorNodeMetadata)
      .parents('.json-node-element')
      .find('.json-tree-node-icon')
      .click({ force: true });

    cy.get(commonWidgetSelector.inspectorNodeMetadata).parent().invoke('text').then(console.log);

    cy.skipEditorPopover();
    cy.dragAndDropWidget("Text Input", 200, 200);

    cy.get(
      commonWidgetSelector.defaultValueInputField
    ).clearAndTypeOnCodeMirror(
      "{{globals.currentUser.metadata.test}}"
    );
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidgetTextInput).should(
      "have.value",
      "test2"
    );

    // delete metadata and verify
    cy.visit("/");

    navigateToManageUsers();

    cy.contains('td', email)
      .parents('tr')
      .within(() => {
        cy.get(usersSelector.userActionButton).click();
      });
    cy.get(usersSelector.editUserDetailsButton).click();
    cy.get('button.delete-field-option').eq(0).click();
    cy.get(commonWidgetSelector.buttoninviteusers).click();

  });
});

