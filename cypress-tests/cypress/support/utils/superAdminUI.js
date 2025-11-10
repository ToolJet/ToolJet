import { commonEeSelectors,instanceSettingsSelector } from "Selectors/eeCommon";
import { fake } from "Fixtures/fake";
import { usersSelector } from "Selectors/manageUsers";
import { instanceSettingsText } from "Texts/eeCommon";
import { commonSelectors } from "Selectors/common";

import {
  instanceWorkspaceSelectors,
  instanceAllUsersSelectors,
  whiteLabelSelectors,
  usersTableElementsInInstance,
} from "Selectors/superAminUISelectors"; 

import {
  instanceWorkspaceText,
  instanceAllUsersText,
  whitelabelText,
  usersTableElementsInInstanceText,
  SMTP_TEXT,
} from "Texts/superAdminUIText";

import {
  openInstanceSettings,
  openUserActionMenu,
} from "Support/utils/platform/eeCommon";

const DEFAULT_WORKSPACE = "My workspace";
const DEFAULT_WS_ARCHIVE_TOOLTIP = "Default workspace cannot be archived. Set another workspace as default to proceed with archiving.";

const WHITE_LABEL_LOGO = "https://images.pexels.com/photos/1796715/pexels-photo-1796715.jpeg?cs=srgb&dl=pexels-chaitaastic-1796715.jpg&fm=jpg";
const WHITE_LABEL_FAVICON = WHITE_LABEL_LOGO;
const WHITE_LABEL_TEXT = "Paris UK 321 321 321";
const LOGO_IDENTIFIER = "pexels-photo-1796715";

export const userName = () => fake.firstName.toLowerCase().replace(/[^a-z]/g, "");
export const userEmail = () => fake.email.toLowerCase().replace(/[^a-z0-9@.]/g, "");

export const openWhiteLabelingSettings = () => {
  openInstanceSettings();
  cy.get(whiteLabelSelectors.navWhiteLabellingListItem).click();
};

export const openSMTPSettings = () => {
  openInstanceSettings();
  cy.get(whiteLabelSelectors.smtpListItem).click();
};

export const verifyWhiteLabelingUI = () => {
  cy.get(commonEeSelectors.pageTitle).verifyVisibleElement("have.text", whitelabelText.settingsPageTitle);
  cy.get(whiteLabelSelectors.breadcrumbPageTitle).verifyVisibleElement("have.text", whitelabelText.breadcrumbTitle);

  const fields = [
    { label: whitelabelText.appLogoLabel, input: whiteLabelSelectors.appLogoInput, help: whiteLabelSelectors.appLogoHelpTextSelector, helpText: whitelabelText.appLogoHelp },
    { label: whitelabelText.pageTitleLabel, help: whiteLabelSelectors.appLogoHelpTextSelector, helpText: whitelabelText.appLogoHelp },
    { label: whitelabelText.faviconLabel, help: whiteLabelSelectors.favIconHelpText, helpText: whitelabelText.faviconHelp }
  ];

  fields.forEach(field => {
    cy.contains("label", field.label).should("be.visible");
    if (field.input) cy.get(field.input).should("be.visible");
    cy.get(field.help).should("be.visible").and("contain", field.helpText);
  });
  cy.get(whiteLabelSelectors.cancelButton).verifyVisibleElement("have.text", whitelabelText.cancelButton);
  cy.get(whiteLabelSelectors.saveButton).verifyVisibleElement("have.text", whitelabelText.saveButton);
};

export const verifyInputPlaceholder = (selector, expected) => { 
    cy.get(selector) .should("be.visible") .and("have.attr", "placeholder")
    .and(($p) => expect(($p || "").toString().toLowerCase()).to.contain(expected)); 
};

export const verifyLabel = (text) => cy.contains("label", text).should("be.visible");

export const verifySmtpSettingsUI = () => {
  cy.get(whiteLabelSelectors.smtpEnableToggle).should("be.visible");
  cy.contains(SMTP_TEXT.sectionTitle).should("be.visible");
  cy.contains(SMTP_TEXT.stateDisabled).should("be.visible");

  cy.contains(SMTP_TEXT.envToggle).should("be.visible");
  cy.contains(SMTP_TEXT.envHint).should("be.visible");

  verifyLabel(SMTP_TEXT.host);
  verifyInputPlaceholder(whiteLabelSelectors.smtpHostInput, SMTP_TEXT.hostPlaceholder);

  verifyLabel(SMTP_TEXT.port);
  verifyInputPlaceholder(whiteLabelSelectors.smtpPortInput, SMTP_TEXT.portPlaceholder);

  verifyLabel(SMTP_TEXT.username);
  verifyInputPlaceholder(whiteLabelSelectors.smtpUserInput, SMTP_TEXT.userPlaceholder);

verifyLabel(SMTP_TEXT.password);
verifyInputPlaceholder(whiteLabelSelectors.smtpPasswordInput, SMTP_TEXT.passwordPlaceholder);

  cy.contains("label", SMTP_TEXT.senderEmail).should("be.visible").parent().find("input").should("be.visible");
  cy.contains(SMTP_TEXT.docs).should("be.visible");
  cy.get(whiteLabelSelectors.cancelButton).verifyVisibleElement("have.text", whitelabelText.cancelButton);
  cy.get(whiteLabelSelectors.saveButton).verifyVisibleElement("have.text", whitelabelText.saveButton);
};

export const fillWhiteLabelingForm = () => {
  cy.get(whiteLabelSelectors.appLogoInput).clear().type(WHITE_LABEL_LOGO);
  cy.get(whiteLabelSelectors.pageTitleInput).clear().type(WHITE_LABEL_TEXT);
  cy.get(whiteLabelSelectors.favIconInput).clear().type(WHITE_LABEL_FAVICON);
};

export const saveWhiteLabelingChanges = () => {
  cy.get(whiteLabelSelectors.saveButton).click();
};

export const verifyWhiteLabelInputs = () => { 
    const decodeValue = (val) => val.replace(/&amp;/g, '&'); 
    cy.get(whiteLabelSelectors.appLogoInput) .invoke('val') .then((val) => expect(decodeValue(val)).to.eq(WHITE_LABEL_LOGO)); 
    cy.get(whiteLabelSelectors.pageTitleInput).should("have.value", WHITE_LABEL_TEXT); 
    cy.get(whiteLabelSelectors.favIconInput) .invoke('val') .then((val) => expect(decodeValue(val)).to.eq(WHITE_LABEL_FAVICON)); 
};

export const verifyLogoOnLoginPage = () => {
  cy.apiLogout();
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.visit("/");
  cy.get(".tooljet-header img")
    .should("be.visible")
    .and("have.attr", "src")
    .and("include", LOGO_IDENTIFIER);
};

export const verifyAllUsersHeaderUI = () => {
  cy.get(commonEeSelectors.pageTitle).verifyVisibleElement("have.text", instanceSettingsText.pageTitle);
  cy.get(instanceSettingsSelector.allUsersTab).verifyVisibleElement("have.text", instanceAllUsersText.allUsersTabInInstance);
  cy.get(instanceSettingsSelector.manageInstanceSettings).verifyVisibleElement("have.text", instanceSettingsText.manageInstanceSettings);
  cy.get('[data-cy="breadcrumb-header-settings"]').verifyVisibleElement("have.text", "SettingsAll Users");
  cy.get('[data-cy="title-users-page"]').should("have.text","Manage all users");
};

export const verifyTableControls = () => {
  for (const element in usersTableElementsInInstance) {
    cy.get(usersTableElementsInInstance[element]).verifyVisibleElement("have.text", usersTableElementsInInstanceText[element]);
  }
  cy.get(usersSelector.userFilterInput).should("be.visible");
  cy.get(instanceSettingsSelector.typeColumnHeader).verifyVisibleElement("have.text", instanceSettingsText.typeColumnHeader);
  cy.get(instanceSettingsSelector.workspaceColumnHeader).verifyVisibleElement("have.text", instanceSettingsText.workspaceColumnHeader);
};

export const verifyUserRow = (userName, userEmail, userType = "workspace", userStatus = "active") => {
  cy.get(instanceSettingsSelector.userName(userName)).verifyVisibleElement("have.text", userName);
  cy.get(instanceSettingsSelector.userEmail(userName)).verifyVisibleElement("have.text", userEmail);
  cy.get(instanceSettingsSelector.userType(userName)).verifyVisibleElement("have.text", userType);
  cy.get(instanceSettingsSelector.userStatus(userName)).verifyVisibleElement("have.text", userStatus);
};

export const verifyUserActionMenu = (userName) => {
  cy.get(instanceAllUsersSelectors.editUserDetailsButton).verifyVisibleElement("have.text", instanceAllUsersText.editUserDetails);
  cy.get(instanceAllUsersSelectors.resetPasswordButton).should("be.visible");
  cy.get(instanceAllUsersSelectors.archiveUserButton).verifyVisibleElement("have.text", instanceAllUsersText.archiveUser);
};

export const verifyEditUserModal = (userName, userEmail) => {
  openUserActionMenu(userName);
  cy.get(instanceAllUsersSelectors.editUserDetailsButton).click();
  cy.get(commonEeSelectors.modalTitle).verifyVisibleElement("have.text", instanceSettingsText.editModalTitle);
  cy.verifyLabel("Name");
  cy.get(instanceAllUsersSelectors.inputFieldFullName).should("be.visible").should("have.value", userName);
  cy.get(instanceAllUsersSelectors.inputFieldEmail).should("be.visible").should("have.value", userEmail);
  cy.verifyLabel("Email address");
  cy.get(instanceSettingsSelector.superAdminToggleLabel).verifyVisibleElement("have.text", instanceSettingsText.superAdminToggleLabel);
  cy.get(instanceSettingsSelector.superAdminToggle).should("be.visible");
  cy.get(commonSelectors.cancelButton).verifyVisibleElement("have.text", whitelabelText.cancelButton);
  cy.get(instanceAllUsersSelectors.updateButton).verifyVisibleElement("have.text", instanceAllUsersText.updateButton);
  cy.get(commonEeSelectors.modalCloseButton).should("be.visible").click();
};

export const verifyWorkspacesViewModal = (userName) => {
  cy.get(instanceSettingsSelector.viewButton(userName)).click();
  cy.get(commonEeSelectors.modalTitle).verifyVisibleElement("have.text", instanceAllUsersText.workspacesModalTitle(userName));
  cy.get(commonEeSelectors.modalCloseButton).should("be.visible").click();
  cy.get(instanceAllUsersSelectors.viewTableNameColumnHeader).verifyVisibleElement("have.text", instanceAllUsersText.viewTableNameHeader);
  cy.get(instanceAllUsersSelectors.viewTableStatusColumnHeader).verifyVisibleElement("have.text", instanceAllUsersText.viewTableStatusHeader);
  cy.get(instanceAllUsersSelectors.userStatusCell(userName)).verifyVisibleElement("have.text", "active");
};

export const openResetPasswordModal = () => {
  cy.get(instanceAllUsersSelectors.resetPasswordButton).click();
};

export const verifyResetPasswordModalUI = (userEmail) => {
  cy.get('[data-cy="reset-password-title"]').should("have.text", "Reset password");
  cy.contains(userEmail).should("be.visible");

  cy.contains("label", "Automatically generate a password").should("be.visible");
  cy.contains("You will be able to view and copy the password in the next step").should("be.visible");
  cy.contains("label", "Create password").should("be.visible");

  cy.contains("label", "Create password").click();
  cy.get(instanceWorkspaceSelectors.passwordInputField).should("be.visible");
  cy.contains("Password should be at least 5 characters").should("be.visible");

  cy.get(commonSelectors.cancelButton).should("be.visible");
  cy.get(instanceWorkspaceSelectors.resetButton).should("be.visible");

  cy.get(commonSelectors.cancelButton).click();
};

export const openArchiveUserModal = (userName) => {
    openUserActionMenu(userName);
  cy.get(instanceAllUsersSelectors.archiveUserButton).click();
};

export const verifyArchiveUserModalUI = (userEmail) => {
  openArchiveUserModal(userEmail)
  cy.get(commonEeSelectors.modalTitle).contains(`Archive user${userEmail}`);
  cy.contains(userEmail).should("be.visible");
  cy.contains(
    "Archiving the user will restrict their access to all their workspaces and exclude them from the count of users covered by your plan. Are you sure you want to continue?"
  ).should("be.visible");
  cy.get(commonSelectors.cancelButton).should("be.visible");
  cy.contains("button", "Archive").should("be.visible");
  cy.get(commonSelectors.cancelButton).click();
};

export const verifyUsersFilterOptions = () => {
  cy.get(usersSelector.userFilterInput).click();
  ["All", "Active", "Invited", "Archived"].forEach((opt) => {
    cy.contains(opt).should("be.visible");
  });
  cy.get("body").click(0, 0);
};

export const openAllWorkspaces = () => {
  openInstanceSettings();
  cy.get(instanceWorkspaceSelectors.navAllWorkspaces).click();
};

export const verifyWorkspacePageHeader = () => {
  cy.get(commonEeSelectors.pageTitle).verifyVisibleElement("have.text", instanceSettingsText.pageTitle);
  cy.get(instanceWorkspaceSelectors.breadcrumbPageTitle).verifyVisibleElement("have.text", instanceWorkspaceText.breadcrumbTitle);
};

export const verifyWorkspaceTableControls = () => {
  cy.get(instanceWorkspaceSelectors.tabActive).should("be.visible");
  cy.get(instanceWorkspaceSelectors.tabArchived).should("be.visible");
  cy.get(instanceWorkspaceSelectors.searchBar).should("be.visible");
  cy.get(instanceWorkspaceSelectors.nameHeader).verifyVisibleElement("have.text", instanceWorkspaceText.nameHeader);
};

export const verifyWorkspaceRow = (workspaceName, isDefault = false) => {
  cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
    .contains(workspaceName)
    .should("be.visible")
    .within(() => {
      cy.contains(workspaceName).should("be.visible");
      if (isDefault) {
        cy.get(instanceWorkspaceSelectors.defaultWorkspaceTag).should("be.visible");
      }
    });
};

export const verifyWorkspaceSelectDropdown = (testWorkspace) => {
  cy.get(instanceWorkspaceSelectors.selectControl).should("be.visible");
  cy.get(instanceWorkspaceSelectors.selectControl).click();
  cy.get(instanceWorkspaceSelectors.selectMenu).within(() => {
    cy.contains(instanceWorkspaceSelectors.selectOption, "My workspace").scrollIntoView().should("be.visible");
    cy.contains(instanceWorkspaceSelectors.selectOption, testWorkspace).scrollIntoView().should("be.visible");
  });
  cy.get(instanceWorkspaceSelectors.selectControl).click();
};

export const verifyWorkspaceTabs = () => {
  cy.get(instanceWorkspaceSelectors.tabActive).should("be.visible").and("contain", instanceWorkspaceText.activeTab);
  cy.get(instanceWorkspaceSelectors.tabArchived).should("be.visible").and("contain", instanceWorkspaceText.archivedTab);
};

export const verifyWorkspaceRowTags = (workspaceName) => {
  cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
    .contains(DEFAULT_WORKSPACE)
    .parent()
    .within(() => {
      cy.contains("Default workspace").should("be.visible");
    });
  cy.contains("Current workspace").should("be.visible");
  cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
    .contains(workspaceName)
    .should("be.visible");
};

export const openArchiveWorkspaceModal = (workspaceName) => {
  searchWorkspace(workspaceName);
  cy.get(instanceWorkspaceSelectors.statusChangeButton).click({ force: true });
};

export const verifyArchiveWorkspaceModalUI = (workspaceName) => {
  cy.get(commonEeSelectors.modalTitle).contains("Archive workspace");
  cy.contains(workspaceName).should("be.visible");
  cy.contains(
    "Archiving the workspace will revoke user access and all associate content. Are you sure you want to continue?"
  ).should("be.visible");
  cy.get(commonSelectors.cancelButton).should("be.visible");
  cy.contains("button", "Archive").should("be.visible");
  cy.get(commonSelectors.cancelButton).click();
};

export const verifyOpenWorkspaceTooltip = (workspaceName) => {
  cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
    .contains(workspaceName)
    .parents("tr")
    .within(() => {
      cy.get('[data-tooltip-id="tooltip-for-open-new-ws"]').trigger("mouseover");
    });
  cy.contains("Open workspace in new tab").should("be.visible");
};

export const searchWorkspace = (name) => {
  cy.get(instanceWorkspaceSelectors.searchBar).should("be.visible").clear().type(name);
};

export const verifyDefaultWorkspaceTooltip = () => {
  cy.get(instanceWorkspaceSelectors.workspaceTableRow).each(($row) => {
    cy.wrap($row)
      .find(instanceWorkspaceSelectors.workspaceNameCellSuffix)
      .invoke("text")
      .then((name) => {
        if (name.trim() === DEFAULT_WORKSPACE) {
          cy.wrap($row)
            .find(instanceWorkspaceSelectors.statusChangeButton)
            .trigger("mouseover");

          cy.get(instanceWorkspaceSelectors.tooltipDefaultWorkspace)
            .should("be.visible")
            .and("have.attr", "data-tooltip-content", DEFAULT_WS_ARCHIVE_TOOLTIP);
        }
      });
  });
};
