import { auditLogSelectors } from "Selectors/auditLogs";
import {
  auditLogsTexts,
  actionTypeTexts,
  resourceTexts,
  filterByTexts,
} from "Texts/auditLogs";
import { path } from "Texts/common";
import moment from "moment";

export const timeUpdateOnCalender = (
  inputFieldSelector,
  countValue,
  childNum
) => {
  for (let i = 0; i < countValue; i++) {
    cy.get(`${inputFieldSelector} .rdtCounters`).then(() => {
      cy.get(
        `${inputFieldSelector} .rdtCounters > :nth-child(${childNum}) :nth-child(1)`
      ).click();
    });
  }
};
export const selectDateAndTime = (
  inputFieldSelector,
  filterText,
  date,
  time
) => {
  cy.get(`${inputFieldSelector} .rdtSwitch`).verifyVisibleElement(
    "have.text",
    moment().format("MMMM YYYY")
  );
  cy.get(`${inputFieldSelector} .rdtSwitch`).dblclick();
  cy.get(`${inputFieldSelector} .rdtYears`).then(($year) => {
    if ($year.text().includes(moment(date, "DD/MM/YYYY").format("YYYY"))) {
      cy.get(
        `${inputFieldSelector} [data-value="${moment(date, "DD/MM/YYYY").format(
          "YYYY"
        )}"]`
      ).click();
    } else {
      cy.get(`${inputFieldSelector} .rdtPrev`).click();
      cy.get(
        `${inputFieldSelector} [data-value="${moment(date, "DD/MM/YYYY").format(
          "YYYY"
        )}"]`
      ).click();
    }
  });
  cy.get(`${inputFieldSelector} .rdtSwitch`).verifyVisibleElement(
    "have.text",
    moment(date, "DD/MM/YYYY").format("YYYY")
  );
  cy.get(`${inputFieldSelector} .rdtMonths`).within(() => {
    cy.contains(moment(date, "DD/MM/YYYY").format("MMM")).click();
  });
  cy.get(`${inputFieldSelector} .rdtSwitch`).verifyVisibleElement(
    "have.text",
    `${moment(date, "DD/MM/YYYY").format("MMMM")} ${moment(
      date,
      "DD/MM/YYYY"
    ).format("YYYY")}`
  );
  cy.get(`${inputFieldSelector} .rdtDays`).then(() => {
    if (moment(date, "DD/MM/YYYY").format("D") == moment().format("D")) {
      cy.get(
        `${inputFieldSelector} [class = "rdtDay rdtToday"][data-value="${Number(
          moment(date, "DD/MM/YYYY").format("D")
        )}"]`
      ).click();
    } else {
      cy.get(
        `${inputFieldSelector} [class = "rdtDay"][data-value="${Number(
          moment(date, "DD/MM/YYYY").format("D")
        )}"]`
      ).click();
    }
  });
  cy.get(
    `${auditLogSelectors.filterBySection} :nth-child(2)`
  ).verifyVisibleElement("have.text", filterText);
  cy.get(`${inputFieldSelector} .rdtTimeToggle`)
    .should("be.visible")
    .verifyVisibleElement("have.text", "12:00 AM");
  cy.get(`${inputFieldSelector} .rdtTimeToggle`).click();
  cy.get(`${inputFieldSelector} .rdtSwitch`)
    .should("be.visible")
    .verifyVisibleElement(
      "have.text",
      moment(date, "DD/MM/YYYY").format("MM/DD/YYYY")
    );
  cy.get(`${inputFieldSelector} .rdtCounters`).then(() => {
    timeUpdateOnCalender(
      inputFieldSelector,
      moment(time, "h:mm A").format("h"),
      1
    );
    timeUpdateOnCalender(
      inputFieldSelector,
      moment(time, "h:mm A").format("mm"),
      3
    );
    cy.get(`${inputFieldSelector} .rdtCounters > :nth-child(4) :nth-child(2)`)
      .invoke("text")
      .then((text) => {
        if (moment(time, "h:mm A").format("A") !== text) {
          cy.get(
            `${inputFieldSelector} .rdtCounters > :nth-child(4) :nth-child(1)`
          ).click();
        }
      });
    cy.get(`${inputFieldSelector} input`).verifyVisibleElement(
      "have.value",
      `${moment(date, "DD/MM/YYYY").format("MM/DD/YYYY")} ${time}`
    );
  });
};
export const verifyFilterSection = (heading, selectValue) => {
  cy.get(auditLogSelectors.filterHeadingText(heading))
    .should("be.visible")
    .verifyVisibleElement("have.text", heading);
  cy.get(auditLogSelectors.filterSelectedValueLabel(selectValue)).should(
    "be.visible"
  );
};
export const verifyAuditLogsPageElements = () => {
  cy.url().should("include", path.auditLogsPath);
  cy.get(auditLogSelectors.auditLogsHeader).verifyVisibleElement(
    "have.text",
    auditLogsTexts.auditLogsHeader
  );
  cy.get(auditLogSelectors.selectDropdown(filterByTexts.users)).should(
    "be.visible"
  );
  cy.get(auditLogSelectors.selectDropdown(filterByTexts.apps)).should(
    "be.visible"
  );
  cy.get(auditLogSelectors.selectDropdown(filterByTexts.resources)).should(
    "be.visible"
  );
  cy.get(auditLogSelectors.selectDropdown(filterByTexts.actions)).should(
    "be.visible"
  );
  cy.get(auditLogSelectors.searchButton).should("be.visible");
  cy.get(auditLogSelectors.fromDateInputfield).should("be.visible");
  cy.get(auditLogSelectors.toDateInputfield).should("be.visible");
  cy.get(auditLogSelectors.fromDateLabel).verifyVisibleElement(
    "contain",
    auditLogsTexts.fromLabel
  );
  cy.get(auditLogSelectors.toDateLabel).verifyVisibleElement(
    "contain",
    auditLogsTexts.toLabel
  );
  cy.get(auditLogSelectors.filterBySection).should("be.visible");
  cy.get(auditLogSelectors.filterByLabel).verifyVisibleElement(
    "have.text",
    auditLogsTexts.filterByLabel
  );
  cy.get(auditLogSelectors.logTable).should("be.visible");
  cy.get(auditLogSelectors.actionTypeText).verifyVisibleElement(
    "have.text",
    actionTypeTexts.userLogin
  );
};
export const selectValueAndVerify = (fieldText, dataValue = []) => {
  if (typeof dataValue[0] === "object") {
    dataValue.forEach((element) => {
      cy.get(`${auditLogSelectors.selectDropdown(fieldText)} input`)
        .scrollIntoView()
        .should("be.visible")
        .click()
        .clear()
        .type(element.firstName);
      cy.get(".select-search__option").within(() => {
        cy.contains(element.userWithEmail).click();
      });
      verifyFilterSection(fieldText, element.userWithEmail);
    });
  }
  if (typeof dataValue[0] === "string") {
    dataValue.forEach((element) => {
      cy.get(`${auditLogSelectors.selectDropdown(fieldText)} input`)
        .scrollIntoView()
        .should("be.visible")
        .click()
        .clear()
        .type(element);
      cy.get(".select-search__option").within(() => {
        cy.contains(element).click();
      });
      verifyFilterSection(fieldText, element);
    });
    if (fieldText == filterByTexts.apps) {
      verifyFilterSection(filterByTexts.resources, resourceTexts.app);
      cy.get(
        auditLogSelectors.selectedItemCount(filterByTexts.resources, "1")
      ).verifyVisibleElement("have.text", `1 selected`);
    }
  }
  cy.get(
    auditLogSelectors.selectedItemCount(fieldText, dataValue.length)
  ).verifyVisibleElement("have.text", `${dataValue.length} selected`);
};
export const clickOnSearchButton = () => {
  cy.get(auditLogSelectors.searchButton).scrollIntoView().should("be.visible");
  cy.get(auditLogSelectors.searchButton).click();
  cy.get(auditLogSelectors.logTable).should("be.visible");
};
export const closeFilterValues = (dataValue = []) => {
  if (typeof dataValue[0] === "object") {
    dataValue.forEach((element) => {
      cy.get(auditLogSelectors.filterSelectedValueClose(element.userWithEmail))
        .should("be.visible")
        .click();
    });
  }
  if (typeof dataValue[0] === "string") {
    dataValue.forEach((element) => {
      cy.get(auditLogSelectors.filterSelectedValueClose(element))
        .should("be.visible")
        .click();
    });
  }
};
export const verifySearchButtonForDropdownFields = (
  fieldText,
  dataValue = []
) => {
  selectValueAndVerify(fieldText, (dataValue = []));
  clickOnSearchButton();
  cy.get(auditLogSelectors.logTable).should("be.visible");
  closeFilterValues((dataValue = []));
};
export const verifyCalenderElements = (inputFieldSelector) => {
  cy.get(`${inputFieldSelector} .rdtSwitch`).should("be.visible");
  cy.get(`${inputFieldSelector} .rdtPrev`).should("be.visible");
  cy.get(`${inputFieldSelector} .rdtNext`).should("be.visible");
  cy.get(`${inputFieldSelector} .dow`).should("be.visible");
  cy.get(`${inputFieldSelector} .rdtDay`).should("be.visible");
  cy.get(`${inputFieldSelector} .rdtTimeToggle`).should("be.visible");
};
