import { commonSelectors, cyParamName } from "Selectors/common";
import { ssoSelector } from "Selectors/manageSSO";
import { usersSelector } from "Selectors/manageUsers";
import { onboardingSelectors } from "Selectors/onboarding";
import * as common from "Support/utils/common";
import { fillInputField } from "Support/utils/common";
import { commonText } from "Texts/common";
import { ssoText } from "Texts/manageSSO";
import { usersText } from "Texts/manageUsers";

const envVar = Cypress.env("environment");

export const verifyManageUsersPageElements = () => {
  cy.get(
    `[data-cy="breadcrumb-header-${cyParamName(commonText.breadcrumbworkspaceSettingTitle)}"]>>`
  ).should(($el) => {
    expect($el.contents().first().text().trim()).to.eq(
      commonText.breadcrumbworkspaceSettingTitle
    );
  });
  cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
    "have.text",
    "Users"
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
      cy.wait(1000);
      cy.get('[data-cy="user-actions-button"]').click();
    });

  cy.get('[data-cy="edit-user-details-button"]').verifyVisibleElement(
    "have.text",
    "Edit user details"
  );
  cy.get('[data-cy="archive-button"]').verifyVisibleElement(
    "have.text",
    "Archive user"
  );

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
    "Name"
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
  cy.wait(1000);
  cy.get('[data-cy="user-group-select"]').should("be.visible");
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

  if (envVar === "Enterprise") {
    cy.get(usersSelector.helperTextBulkUpload).verifyVisibleElement(
      "have.text",
      "Download the template to add user details or format your file in the same way as the template. Files in any other format may not be recognized. "
    );
  } else {
    cy.get(usersSelector.helperTextBulkUpload).verifyVisibleElement(
      "have.text",
      usersText.helperTextBulkUpload
    );
  }
  cy.get(usersSelector.buttonDownloadTemplate).verifyVisibleElement(
    "have.text",
    usersText.buttonDownloadTemplate
  );
  cy.exec("mkdir -p ./cypress/downloads/", { failOnNonZeroExit: false });
  cy.wait(3000);
  cy.exec("cd ./cypress/downloads/ && rm -rf *", { failOnNonZeroExit: false });
  cy.wait(3000);
  cy.get(usersSelector.buttonDownloadTemplate).click();
  cy.wait(4000);
  cy.exec("ls ./cypress/downloads/").then((result) => {
    const downloadedAppExportFileName = result.stdout.split("\n")[0];
    expect(downloadedAppExportFileName).to.contain.string("sample_upload.csv");
  });

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

export const inviteUserToWorkspace = (firstName, email) => {
  cy.apiUserInvite(firstName, email);
  fetchAndVisitInviteLink(email);
  cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
  cy.get(commonSelectors.signUpButton).click();
  cy.get(commonSelectors.acceptInviteButton).click();
};

export const confirmInviteElements = (
  email,
  workspaceName = "My workspace"
) => {
  cy.get(commonSelectors.signUpSectionHeader).verifyVisibleElement(
    "have.text",
    "Sign up"
  );
  cy.get('[data-cy="signup-info"]').verifyVisibleElement(
    "have.text",
    `Sign up to the workspace - ${workspaceName}. `
  );

  // cy.verifyLabel("Email")
  // cy.verifyLabel("Create a password")
  cy.get(commonSelectors.invitedUserEmail).verifyVisibleElement(
    "have.text",
    email
  );

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

export const bulkUserUpload = (
  file,
  fileName,
  toastMessage,
  isDuplicate = false
) => {
  cy.get(usersSelector.inputFieldBulkUpload).selectFile(file, {
    force: true,
  });
  cy.get(usersSelector.uploadedFileData).should("contain", fileName);
  cy.get(usersSelector.buttonUploadUsers).click();
  if (isDuplicate) {
    cy.get(commonSelectors.modalMessage)
      .should("be.visible")
      .and("have.text", toastMessage);
    cy.get(usersSelector.modalClose).click();
  } else {
    cy.get(".go3958317564").should("be.visible").and("have.text", toastMessage);
    cy.get('[data-cy="toast-close-button"]').click();
  }
  cy.wait(1500);
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
  fillInputField({ Name: firstName, "Email address": email });
};

export const selectUserGroup = (groupName) => {
  cy.wait(1500);
  cy.get("body").then(($body) => {
    const selectDropdown = $body.find(usersSelector.groupSelector);

    if (selectDropdown.length === 0) {
      cy.get(usersSelector.groupSelector).click();
    }
    cy.get(usersSelector.groupSelector).eq(0).type(groupName);
    cy.wait(1000);
    cy.get(usersSelector.groupSelectInput).eq(0).check();
  });
};

export const selectGroup = (groupName, timeout = 1000) => {
  cy.get(usersSelector.groupSelector).eq(0).type(groupName);
  cy.wait(timeout);
  cy.get(usersSelector.groupSelectInput).eq(0).check();
};

export const updateUserGroup = (groupName) => {
  cy.get(usersSelector.userActionButton).click();
  cy.get(usersSelector.editUserDetailsButton).click();
  selectGroup(groupName);
};

export const inviteUserWithUserGroups = (firstName, email, ...groupNames) => {
  fillUserInviteForm(firstName, email);

  cy.wait(2000);

  cy.get("body").then(($body) => {
    const selectDropdown = $body.find(usersSelector.groupSelector);

    if (selectDropdown.length === 0) {
      cy.get(usersSelector.groupSelector).click();
    }
    cy.get(usersSelector.groupSelector).eq(0).type(groupNames[0]);
    cy.wait(1000);
    cy.get(usersSelector.groupSelectInput).eq(0).check();
    cy.wait(1000);
    cy.get(usersSelector.groupSelector).eq(0).type(groupNames[1]);
    cy.wait(1000);
    cy.get(usersSelector.groupSelectInput).eq(0).check();
  });

  cy.get(usersSelector.buttonInviteUsers).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    usersText.userCreatedToast
  );

  cy.wait(1000);
  fetchAndVisitInviteLink(email);
  cy.wait(2000);
  cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
  // cy.intercept('GET', '/api/organizations').as('org')
  cy.get(commonSelectors.signUpButton).click();
  cy.wait(2000);
  cy.get(commonSelectors.acceptInviteButton).click();
};

export const fetchAndVisitInviteLink = (
  email,
  workspaceName = "My workspace"
) => {
  let invitationToken, organizationToken, workspaceId, userId;

  cy.runSqlQueryOnDB(`select invitation_token from users where email='${email}';`)
    .then((resp) => {
      invitationToken = resp.rows[0]?.invitation_token;
      return cy.runSqlQueryOnDB(
        `select id from organizations where name='${workspaceName}';`
      );
    })
    .then((resp) => {
      workspaceId = resp.rows[0]?.id;
      return cy.runSqlQueryOnDB(`select id from users where email='${email}';`);
    })
    .then((resp) => {
      userId = resp.rows[0]?.id;
      return cy.runSqlQueryOnDB(
        `select invitation_token from organization_users where user_id='${userId}';`
      );
    })
    .then((resp) => {
      organizationToken =
        resp.rows?.[1]?.invitation_token || resp.rows?.[0]?.invitation_token;
      const url = `/invitations/${invitationToken}/workspaces/${organizationToken}?oid=${workspaceId}`;

      cy.apiLogout();
      cy.wait(200);
      cy.visit(url);
    });
};

export const fetchAndVisitInviteLinkViaMH = (email) => {
  cy.mhGetMailsByRecipient(email).then((mails) => {
    expect(mails).to.have.length.greaterThan(0);
    const lastMail = mails[mails.length - 1];
    const mailContent = lastMail && lastMail.Content ? lastMail.Content : {};
    const mailBody = mailContent.Body || mailContent.Html || "";

    // Clean the email body by removing quoted-printable encoding and HTML entities
    let cleanedBody = mailBody
      .replace(/=\r?\n/g, "") // Remove quoted-printable line breaks (= at end of line)
      .replace(/=3D/g, "=") // Decode =3D back to =
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

    // Extract URL from href attribute or plain text
    let inviteUrl = "";

    // Try to find URL in href attribute first
    const hrefMatch = cleanedBody.match(
      /href=["']?(http[^"'\s>]*invitation[^"'\s>]*)/i
    );
    if (hrefMatch) {
      inviteUrl = hrefMatch[1];
    } else {
      // Fallback: look for URL in plain text
      const urlMatch = cleanedBody.match(
        /https?:\/\/[^\s"'<>]*invitation[s]?[^\s"'<>]*/i
      );
      inviteUrl = urlMatch ? urlMatch[0] : "";
    }

    expect(inviteUrl).to.not.be.empty;
    cy.log("Found invite URL: " + inviteUrl);
    cy.visit(inviteUrl);
  });
};

export const inviteUserWithUserRole = (firstName, email, role) => {
  fillUserInviteForm(firstName, email);

  cy.wait(2000);

  cy.get("body").then(($body) => {
    const selectDropdown = $body.find(usersSelector.groupSelector);

    if (selectDropdown.length === 0) {
      cy.get(usersSelector.groupSelector).click();
    }
    cy.get(usersSelector.groupSelector).eq(0).type(role);
    cy.wait(1000);
    cy.get(usersSelector.groupSelectInput).eq(0).check();
    cy.wait(1000);
  });

  cy.get(usersSelector.buttonInviteUsers).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    usersText.userCreatedToast
  );

  cy.wait(1000);
  fetchAndVisitInviteLink(email);
  cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
  cy.get(commonSelectors.signUpButton).click();
  cy.wait(2000);
  cy.get(commonSelectors.acceptInviteButton).click();
  cy.get(commonSelectors.homePageLogo, { timeout: 10000 }).should("be.visible");
};
export const verifyUserStatusAndMetadata = (
  email,
  expectedStatus = usersText.activeStatus,
  expectedMetadata = "{..}"
) => {
  common.searchUser(email);
  cy.contains("td", email)
    .parent()
    .within(() => {
      cy.get("td small").should("have.text", expectedStatus);
      cy.get("td[data-name='meta-header'] .metadata")
        .should("be.visible")
        .and("have.text", expectedMetadata);
    });
};

export const openEditUserDetails = (
  email,
  activeStatusText = usersText.activeStatus,
  expectedMetadata = "{..}"
) => {
  common.navigateToManageUsers();

  verifyUserStatusAndMetadata(email, activeStatusText, expectedMetadata);

  navigateToEditUser(email);
};

export const navigateToEditUser = (email) => {
  cy.contains("td", email)
    .parent()
    .within(() => {
      cy.get('[data-cy="user-actions-button"]').click();
    });
  cy.get('[data-cy="edit-user-details-button"]')
    .verifyVisibleElement("have.text", "Edit user details")
    .click();
};

export const cleanAllUsers = () => {
  let authHeaders;
  const emailsToDelete = new Set();
  const devEmail = "dev@tooljet.io";

  const collectEmails = (users = []) => {
    users.forEach(({ email }) => {
      if (!email) {
        return;
      }

      const normalized = String(email).toLowerCase();

      if (normalized !== devEmail) {
        emailsToDelete.add(email);
      }
    });
  };

  const fetchUsersByPage = (page = 1) => {
    return cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/users`,
        headers: authHeaders,
        qs: {
          page,
          searchText: "",
          status: "",
        },
        log: false,
      })
      .then(({ body }) => {
        collectEmails(body?.users ?? []);

        const totalPages = Number(body?.meta?.total_pages) || 1;
        return { totalPages };
      });
  };

  return cy
    .getAuthHeaders()
    .then((headers) => {
      authHeaders = headers;
    })
    .then(() => fetchUsersByPage(1))
    .then(({ totalPages }) => {
      if (totalPages <= 1) {
        return;
      }

      const remainingPages = Array.from(
        { length: totalPages - 1 },
        (_, index) => index + 2
      );
      return cy
        .wrap(remainingPages)
        .each((pageNumber) => fetchUsersByPage(pageNumber));
    })
    .then(() => {
      if (!emailsToDelete.size) {
        return cy.log("No users to clean up");
      }

      const deletableEmails = Array.from(emailsToDelete);

      cy.log(`Batch deleting ${deletableEmails.length} users...`);

      const sanitizedEmails = deletableEmails.map((email) =>
        email.replace(/'/g, "''")
      );
      const emailsArrayLiteral = `ARRAY['${sanitizedEmails.join("','")}']::text[]`;

      return cy.runSqlQueryOnDB(`CALL delete_users(${emailsArrayLiteral});`);
    });
};

export const apiArchiveUnarchiveUser = (
  email,
  action,
  workspaceId = Cypress.env("workspaceId")
) => {
  return cy.apiGetUserDetails().then((res) => {
    const resp = res?.body ?? res;
    cy.log("org-users response: " + JSON.stringify(resp));

    const users = Array.isArray(resp?.users) ? resp.users : [];
    const orgUser = users.find((u) => u.email === email);

    if (!orgUser?.id) {
      throw new Error(`Organization user record not found for email: ${email}`);
    }

    const organizationId = orgUser.organization_id || workspaceId;

    return cy
      .getAuthHeaders()
      .then((headers) =>
        cy.request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/organization-users/${orgUser.id}/${action}`,
          headers,
          body: { organizationId },
          log: false,
        })
      )
      .then((response) => {
        expect(response.status).to.be.oneOf([200, 201, 204]);
        Cypress.log({
          name: "Status Updated",
          message: `User ${email} ${action}d`,
        });
        return response;
      });
  });
};
