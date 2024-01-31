import { auditLogSelectors } from "Selectors/auditLogs";
import {
  auditLogsTexts,
  actionTypeTexts,
  resourceTexts,
  filterByTexts,
} from "Texts/auditLogs";
import { fake } from "Fixtures/fake";
import { navigateToAuditLogsPage } from "Support/utils/common";
import {
  verifyAuditLogsPageElements,
  verifyCalenderElements,
  selectDateAndTime,
  clickOnSearchButton,
  selectValueAndVerify,
  closeFilterValues,
  verifySearchButtonForDropdownFields,
} from "Support/utils/auditLogs";
import { addNewUserSW } from "Support/utils/userPermissions";
import { commonSelectors } from "Selectors/common";
import { randomDateOrTime, logout } from "Support/utils/common";
import { profileSelector } from "Selectors/profile";
import moment from "moment";

describe("Audit Logs", () => {
  const data = {};
  data.appName1 = `${fake.companyName}-App`;
  data.appName2 = `${fake.companyName}-App`;
  data.fromDate = randomDateOrTime();
  data.toDate = moment().format("DD/MM/YYYY");
  data.randomTime = randomDateOrTime("h:mm A");
  const userDetails = () => {
    let user = {};
    (user.firstName = fake.firstName),
      (user.lastName = fake.lastName.replaceAll("[^A-Za-z]", "")),
      (user.email = `${user.firstName}@example.com`.toLowerCase()),
      (user.userWithEmail = `${user.firstName} ${user.lastName} (${user.email})`);
    return user;
  };
  let user1 = userDetails();
  let user2 = userDetails();

  beforeEach(() => {
    cy.appUILogin();
  });

  it("Verify the elements of Audit Logs page", () => {
    navigateToAuditLogsPage();
    verifyAuditLogsPageElements();
  });

  it("Verify the functionality of 'Select User' dropdown field", () => {
    addNewUserSW(user1.firstName, user1.lastName, user1.email);
    cy.get(profileSelector.profileDropdown).invoke("show");
    cy.contains("Logout").click();
    cy.appUILogin();
    addNewUserSW(user2.firstName, user2.lastName, user2.email);
    logout();
    cy.appUILogin();
    navigateToAuditLogsPage();
    cy.get(auditLogSelectors.auditLogsHeader)
      .should("be.visible")
      .should("have.text", auditLogsTexts.auditLogsHeader);
    selectValueAndVerify(filterByTexts.users, [user1]);
    closeFilterValues([user1]);
    selectValueAndVerify(filterByTexts.users, [user1, user2]);
  });

  it("Verify the functionality of 'Select Apps' dropdown field", () => {
    cy.createApp(data.appName1);
    cy.clearAndType(commonSelectors.appNameInput, data.appName1);
    cy.waitForAutoSave();
    cy.get(commonSelectors.editorPageLogo).click();
    cy.get(commonSelectors.folderPageTitle).should("be.visible");
    cy.reload();
    cy.createApp(data.appName2);
    cy.clearAndType(commonSelectors.appNameInput, data.appName2);
    cy.waitForAutoSave();
    cy.get(commonSelectors.editorPageLogo).click();
    cy.get(commonSelectors.folderPageTitle).should("be.visible");
    navigateToAuditLogsPage();
    cy.get(auditLogSelectors.auditLogsHeader)
      .should("be.visible")
      .should("have.text", auditLogsTexts.auditLogsHeader);
    selectValueAndVerify(filterByTexts.apps, [data.appName1]);
    closeFilterValues([data.appName1]);
    selectValueAndVerify(filterByTexts.apps, [data.appName1, data.appName2]);
  });

  it("Verify the functionality of 'Select Resources' dropdown field", () => {
    navigateToAuditLogsPage();
    cy.get(auditLogSelectors.auditLogsHeader)
      .should("be.visible")
      .should("have.text", auditLogsTexts.auditLogsHeader);
    selectValueAndVerify(filterByTexts.resources, [resourceTexts.user]);
    closeFilterValues([resourceTexts.user]);
    selectValueAndVerify(filterByTexts.resources, [
      resourceTexts.user,
      resourceTexts.app,
    ]);
  });

  it("Verify the functionality of 'Select Actions' dropdown field", () => {
    navigateToAuditLogsPage();
    cy.get(auditLogSelectors.auditLogsHeader)
      .should("be.visible")
      .should("have.text", auditLogsTexts.auditLogsHeader);
    selectValueAndVerify(filterByTexts.actions, [actionTypeTexts.userLogin]);
    closeFilterValues([actionTypeTexts.userLogin]);
    selectValueAndVerify(filterByTexts.actions, [
      actionTypeTexts.userLogin,
      actionTypeTexts.appCreate,
    ]);
  });

  it("Verify the functionality of 'Search' button", () => {
    navigateToAuditLogsPage();
    cy.get(auditLogSelectors.auditLogsHeader)
      .should("be.visible")
      .should("have.text", auditLogsTexts.auditLogsHeader);
    verifySearchButtonForDropdownFields(filterByTexts.users, [user1]);
    verifySearchButtonForDropdownFields(filterByTexts.apps, [data.appName1]);
    verifySearchButtonForDropdownFields(filterByTexts.resources, [
      resourceTexts.user,
    ]);
    verifySearchButtonForDropdownFields(filterByTexts.actions, [
      actionTypeTexts.userLogin,
    ]);
    cy.get(auditLogSelectors.fromDateInputfield).should("be.visible").click();
    selectDateAndTime(
      auditLogSelectors.fromDateInputfield,
      filterByTexts.timeFrom,
      data.fromDate,
      data.randomTime
    );
    clickOnSearchButton();
    cy.get(auditLogSelectors.logTable).should("be.visible");
    cy.get(
      `${auditLogSelectors.filterBySection} :nth-child(3) .select-close-btn`
    )
      .should("be.visible")
      .click();
    cy.get(auditLogSelectors.toDateInputfield).should("be.visible").click();
    selectDateAndTime(
      auditLogSelectors.toDateInputfield,
      filterByTexts.timeTo,
      data.toDate,
      data.randomTime
    );
    clickOnSearchButton();
  });

  it("Verify the functionality of 'From' input field", () => {
    navigateToAuditLogsPage();
    cy.get(auditLogSelectors.auditLogsHeader)
      .should("be.visible")
      .should("have.text", auditLogsTexts.auditLogsHeader);
    cy.get(auditLogSelectors.fromDateInputfield).should("be.visible").click();
    verifyCalenderElements(auditLogSelectors.fromDateInputfield);
    selectDateAndTime(
      auditLogSelectors.fromDateInputfield,
      filterByTexts.timeFrom,
      data.fromDate,
      data.randomTime
    );
  });

  it("Verify the functionality of 'To' input field", () => {
    navigateToAuditLogsPage();
    cy.get(auditLogSelectors.auditLogsHeader)
      .should("be.visible")
      .should("have.text", auditLogsTexts.auditLogsHeader);
    cy.get(auditLogSelectors.toDateInputfield).should("be.visible").click();
    verifyCalenderElements(auditLogSelectors.toDateInputfield);
    selectDateAndTime(
      auditLogSelectors.toDateInputfield,
      filterByTexts.timeTo,
      data.toDate,
      data.randomTime
    );
  });
});
