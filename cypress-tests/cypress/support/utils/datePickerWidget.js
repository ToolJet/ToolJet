import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { datePickerSelector } from "Selectors/datePicker";
import moment from "moment";

export const selectAndVerifyDate = (date, outFormat = "DD/MM/YYYY") => {
  const splitDate = date.split("/");
  const month = moment(splitDate[1]).format("MMMM");
  cy.get(commonSelectors.canvas).click({ force: true });
  cy.get(datePickerSelector.draggableDatePicker)
    .click()
    .within(() => {
      cy.get(datePickerSelector.calendarYearSelect).select(splitDate[2], {
        force: true,
      });
      cy.get(datePickerSelector.calendarMonthSelect).select(month, {
        force: true,
      });
      cy.get(datePickerSelector.calendarMonth)
        .find(datePickerSelector.calendarDaySelect)
        .not(datePickerSelector.calendarDayOutsideMonth)
        .contains(Number(splitDate[0]))
        .click();
    })
    .find("input")
    .should("have.value", moment(date, "DD/MM/YYYY").format(outFormat));
};

export const verifyDate = (date, format = "DD/MM/YYYY") => {
  date = date != "" ? moment(date, "DD MM YYYY").format(format) : date;
  cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
  cy.get(datePickerSelector.draggableDatePicker)
    .find("input")
    .should("have.value", date);
};

export const selectAndVerifyTime = (time) => {
  cy.get(commonSelectors.canvas).click({ force: true });
  cy.get(datePickerSelector.draggableDatePicker)
    .click()
    .within(() => {
      cy.get(datePickerSelector.calenderTimeInput)
        .type(`${time}`)
        .should("have.value", time);
    });
};
