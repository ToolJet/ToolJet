import { path } from "Texts/common";
import { commonSelectors } from "Selectors/common";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import { ssoSelector } from "Selectors/manageSSO";
import { ssoText } from "Texts/manageSSO";
import * as common from "Support/utils/common";
import { commonText } from "Texts/common";

export const manageUsersElements = () => {
  cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
    expect($el.contents().first().text().trim()).to.eq(
      commonText.breadcrumbworkspaceSettingTitle
    );
  });
  cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
    "have.text",
    usersText.breadcrumbUsersPageTitle
  );

  for (const element in usersSelector.usersElements) {
    cy.get(usersSelector.usersElements[element]).verifyVisibleElement(
      "have.text",
      usersText.usersElements[element]
    );
  }
  cy.get(usersSelector.usersPageTitle).should(($el) => {
    expect($el.contents().last().text().trim()).to.eq(usersText.usersPageTitle);
  });
  cy.get(commonSelectors.inputUserSearch).should("be.visible");
  common.searchUser(usersText.adminUserEmail);
  cy.contains("td", usersText.adminUserEmail)
    .parent()
    .within(() => {
      cy.get(
        usersSelector.userName(usersText.adminUserName)
      ).verifyVisibleElement("have.text", usersText.adminUserName);
      cy.get(
        usersSelector.userEmail(usersText.adminUserName)
      ).verifyVisibleElement("have.text", usersText.adminUserEmail);
      cy.get(
        usersSelector.userStatus(usersText.adminUserName)
      ).verifyVisibleElement("have.text", usersText.activeStatus);
      cy.get("td button").verifyVisibleElement(
        "have.text",
        usersText.adminUserState
      );
    });
  cy.get(usersSelector.userFilterInput).should("be.visible");

  cy.get(usersSelector.buttonAddUsers)
    .verifyVisibleElement("have.text", usersText.buttonAddUsers)
    .click();

  cy.get(usersSelector.buttonInviteWithEmail).verifyVisibleElement(
    "have.text",
    usersText.buttonInviteWithEmail
  );
  cy.get(usersSelector.buttonUploadCsvFile).verifyVisibleElement(
    "have.text",
    usersText.buttonUploadCsvFile
  );
  cy.get(usersSelector.addUsersCardTitle).verifyVisibleElement(
    "have.text",
    usersText.addUsersCardTitle
  );

  cy.get(commonSelectors.labelFullNameInput).verifyVisibleElement(
    "have.text",
    commonText.labelFullNameInput
  );
  cy.get(commonSelectors.inputFieldFullName).should("be.visible");
  cy.get(commonSelectors.labelEmailInput).verifyVisibleElement(
    "have.text",
    commonText.labelEmailInput
  );

  cy.get(commonSelectors.inputFieldEmailAddress).should("be.visible");

  cy.get(commonSelectors.groupInputFieldLabel).verifyVisibleElement(
    "have.text",
    commonText.groupInputFieldLabel
  );
  cy.get(".dropdown-heading-value > .gray").verifyVisibleElement(
    "have.text",
    "Select groups to add for this user"
  );
  cy.get(commonSelectors.cancelButton).verifyVisibleElement(
    "have.text",
    usersText.cancelButton
  );
  cy.get(usersSelector.buttonInviteUsers).verifyVisibleElement(
    "have.text",
    usersText.buttonInviteUsers
  );
  cy.get(commonSelectors.cancelButton).click();
  cy.get(usersSelector.addUsersCardTitle).should("not.exist");

  cy.get(usersSelector.buttonAddUsers).click();
  cy.get(commonSelectors.closeButton).click();
  cy.get(usersSelector.addUsersCardTitle).should("not.exist");

  cy.get(usersSelector.buttonAddUsers).click();
  cy.get(usersSelector.addUsersCardTitle).verifyVisibleElement(
    "have.text",
    usersText.addUsersCardTitle
  );
  cy.get(usersSelector.buttonUploadCsvFile).click();

  cy.get(usersSelector.helperTextBulkUpload).verifyVisibleElement(
    "have.text",
    usersText.helperTextBulkUpload
  );
  cy.get(usersSelector.buttonDownloadTemplate).verifyVisibleElement(
    "have.text",
    usersText.buttonDownloadTemplate
  );
  cy.get(usersSelector.iconBulkUpload).should("be.visible");
  cy.get(usersSelector.helperTextSelectFile).verifyVisibleElement(
    "have.text",
    usersText.helperTextSelectFile
  );
  cy.get(usersSelector.helperTextDropFile).verifyVisibleElement(
    "have.text",
    usersText.helperTextDropFile
  );
  cy.get(usersSelector.inputFieldBulkUpload).should("exist");
  cy.get(usersSelector.buttonUploadUsers).verifyVisibleElement(
    "have.text",
    usersText.buttonUploadUsers
  );
};

export const inviteUser = (firstName, email) => {
  fillUserInviteForm(firstName, email);
  cy.get(usersSelector.buttonInviteUsers).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    usersText.userCreatedToast
  );
  cy.wait(1000)
  fetchAndVisitInviteLink(email);
};

export const confirmInviteElements = () => {
  cy.get(commonSelectors.invitePageHeader).verifyVisibleElement(
    "have.text",
    commonText.invitePageHeader
  );
  cy.get(commonSelectors.invitePageSubHeader).verifyVisibleElement(
    "have.text",
    commonText.invitePageSubHeader
  );
  cy.get(commonSelectors.userNameInputLabel).verifyVisibleElement(
    "have.text",
    commonText.userNameInputLabel
  );
  cy.get(commonSelectors.invitedUserName).should("be.visible");
  cy.get(commonSelectors.emailInputLabel).verifyVisibleElement(
    "have.text",
    commonText.emailInputLabel
  );
  cy.get(commonSelectors.invitedUserEmail).should("be.visible");
  cy.get(commonSelectors.passwordLabel).verifyVisibleElement(
    "have.text",
    commonText.passwordLabel
  );
  cy.get(commonSelectors.passwordInputField).should("be.visible");
  cy.get(commonSelectors.acceptInviteButton)
    .verifyVisibleElement("have.text", commonText.acceptInviteButton)
    .should("be.disabled");

  cy.get(commonSelectors.signUpTermsHelperText).should(($el) => {
    expect($el.contents().first().text().trim()).to.eq(
      commonText.signUpTermsHelperText
    );
  });
  cy.get(commonSelectors.termsOfServiceLink)
    .verifyVisibleElement("have.text", commonText.termsOfServiceLink)
    .and("have.attr", "href")
    .and("equal", "https://www.tooljet.com/terms");
  cy.get(commonSelectors.privacyPolicyLink)
    .verifyVisibleElement("have.text", commonText.privacyPolicyLink)
    .and("have.attr", "href")
    .and("equal", "https://www.tooljet.com/privacy");

  cy.get("body").then(($el) => {
    if ($el.text().includes("Google")) {
      cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
        "have.text",
        ssoText.googleSignUpText
      );
      cy.get(ssoSelector.gitSSOText).verifyVisibleElement(
        "have.text",
        ssoText.gitSignUpText
      );
      cy.get(commonSelectors.onboardingSeperator).should("be.visible");
    }
  });
};

export const userStatus = (email) => {
  common.navigateToManageUsers();
  common.searchUser(email);
  cy.contains("td", email)
    .parent()
    .within(() => {
      cy.get("td button").click();
    });
};

export const bulkUserUpload = (file, fileName, toastMessage) => {
  cy.get(usersSelector.inputFieldBulkUpload).selectFile(file, {
    force: true,
  });
  cy.get(usersSelector.uploadedFileData).should("contain", fileName);
  cy.get(usersSelector.buttonUploadUsers).click();
  cy.get(commonSelectors.newToastMessage)
    .should("be.visible")
    .and("have.text", toastMessage);
  cy.get(usersSelector.toastCloseButton).click();

  cy.wait(200);
};

export const inviteUserWithUserGroup = (firstName, email, group1, group2) => {
  fillUserInviteForm(firstName, email);
  selectUserGroup(group1);
  selectUserGroup(group2);
  cy.get(usersSelector.buttonInviteUsers).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    usersText.userCreatedToast
  );
  // copyInvitationLink(firstName, email);
  cy.wait(1000)
  fetchAndVisitInviteLink(email)
  cy.clearAndType(commonSelectors.passwordInputField, "password");
  cy.get(commonSelectors.acceptInviteButton).click();
};

export const copyInvitationLink = (firstName, email) => {
  cy.window().then((win) => {
    cy.stub(win, "prompt").returns(win.prompt).as("copyToClipboardPrompt");
  });
  common.searchUser(email);
  cy.contains("td", email)
    .parent()
    .within(() => {
      cy.get('[data-cy="copy-icon"]').click();
    });
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    usersText.inviteCopiedToast
  );
  cy.get("@copyToClipboardPrompt").then((prompt) => {
    common.logout();
    cy.visit(prompt.args[0][1]);
  });
};

export const fillUserInviteForm = (firstName, email) => {
  cy.get(usersSelector.buttonAddUsers).click();
  cy.clearAndType(commonSelectors.inputFieldFullName, firstName);
  cy.clearAndType(commonSelectors.inputFieldEmailAddress, email);
};

export const selectUserGroup = (groupName) => {
  cy.wait(500)
  cy.get("body").then(($body) => {
    if (!$body.find(".search > input").length > 0) {
      cy.get(".dropdown-heading-value > .gray").click();
      cy.clearAndType(".search > input", groupName);
      cy.get("li > .select-item > .item-renderer").last().click();
    } else {
      cy.clearAndType(".search > input", groupName);
      cy.get("li > .select-item > .item-renderer").last().click();
    }
  });
};

export const fetchAndVisitInviteLink = (email) => {
  let invitationToken,
    organizationToken,
    workspaceId,
    userId,
    url = "";

  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `select invitation_token from users where email='${email}';`,
  }).then((resp) => {
    invitationToken = resp.rows[0].invitation_token;

    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: "select id from organizations where name='My workspace';",
    }).then((resp) => {
      workspaceId = resp.rows[0].id;

      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: `select id from users where email='${email}';`,
      }).then((resp) => {
        userId = resp.rows[0].id;

        cy.task("updateId", {
          dbconfig: Cypress.env("app_db"),
          sql: `select invitation_token from organization_users where user_id='${userId}';`,
        }).then((resp) => {
          organizationToken = resp.rows[1].invitation_token;

          url = `/invitations/${invitationToken}/workspaces/${organizationToken}?oid=${workspaceId}`;
          common.logout();
          cy.wait(1000);
          cy.visit(url);
        });
      });
    });
  });
};
