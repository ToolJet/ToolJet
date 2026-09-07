// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// datePicker.js
//   selectAndVerifyDate              -                    → canvas
//   verifyDate                       -                    → canvas
//   selectAndVerifyTime              -                    → canvas
// └──────────────────────────────────────────────────────────────────┘
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { datePickerSelector } from "Selectors/appBuilder/components/datePicker";
import moment from "moment";

/**
 * MODULE — appBuilder/components/datePicker: DatePicker widget CANVAS helpers.
 * FOR AI: drive the rendered date/time picker on the canvas — open the widget's calendar
 * and pick a date (selectAndVerifyDate), assert the current input value (verifyDate), or
 * type/verify a time (selectAndVerifyTime). Dates are passed as `DD/MM/YYYY` strings and
 * normalised via moment. Selectors come from Selectors/appBuilder/components/datePicker (calendar year/month/day,
 * time input).
 * NOT here: inspector property/style config → appBuilder/properties.js · styles.js.
 */
/**
 * @tjBlock  canvas
 * @tjUsage  selectAndVerifyDate('datepicker1', '15/06/2024')
 * @tjDom    rendered widget → calendar year/month selects + day cell, asserts input value
 */
export const selectAndVerifyDate = (
  widgetName,
  date,
  outFormat = "DD/MM/YYYY"
) => {
  const splitDate = date.split("/");
  const month = moment(splitDate[1]).format("MMMM");
  cy.get(commonSelectors.canvas).click({ force: true });
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
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

/**
 * @tjBlock  canvas
 * @tjUsage  verifyDate('datepicker1', '15 06 2024')
 * @tjDom    rendered widget input value (empty string asserts a cleared picker)
 */
export const verifyDate = (widgetName, date, format = "DD/MM/YYYY") => {
  date = date != "" ? moment(date, "DD MM YYYY").format(format) : date;
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .find("input")
    .should("have.value", date);
};

/**
 * @tjBlock  canvas
 * @tjUsage  selectAndVerifyTime('datepicker1', '10:30 AM')
 * @tjDom    rendered widget → calendar time input, types then asserts its value
 */
export const selectAndVerifyTime = (widgetName, time) => {
  cy.get(commonSelectors.canvas).click({ force: true });
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .scrollIntoView()
    .click()
    .trigger("mouseleave")
    .within(() => {
      cy.get(datePickerSelector.calendarTimeInput)
        .scrollIntoView()
        .focus()
        .type(`${time}`)
        .should("have.value", time);
    });
};
