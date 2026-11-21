/**
 * MODULE — appBuilder/components/daterangePicker: browser-only helpers for the Date Range Picker widget.
 * FOR AI: addDaterangePickersViaApi seeds range pickers (+ helper widgets / Form parents / events) through the shared
 * addDateWidgetsViaApi; the generic popup drivers, probes and timezone pinning live in dateTimeCommon.js. The range
 * popup shows TWO months (DaterangePicker.jsx:334 monthsShown), so a bare day selector matches twice — pickRangeDay
 * scopes the cell to one month container.
 */
import { daterangePickerText as T } from "Texts/appBuilder/components/daterangePicker";
import { daterangePickerSelector as S } from "Selectors/appBuilder/components/daterangePicker";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { addDateWidgetsViaApi } from "Support/utils/appBuilder/components/dateTimeCommon";

/**
 * @tjBlock  contexts
 * @tjUsage  addDaterangePickersViaApi([{ name: 'drp', properties: { defaultStartDate: { value: '10/06/2026' }, defaultEndDate: { value: '14/06/2026' } } }, dateProbe('probe', 'drp', ['startDate'])])
 * @tjDom    addDateWidgetsViaApi with componentType DaterangePicker and the daterangepicker.js:6-9 default size
 */
export const addDaterangePickersViaApi = (items, opts = {}) =>
  addDateWidgetsViaApi(items, { componentType: T.componentType, defaultSize: T.defaultSize, ...opts });

/**
 * @tjBlock  userflow
 * @tjUsage  pickRangeDay(1, 3)   // 3rd of the RIGHT-hand month
 * @tjDom    clicks the day cell (outside-month cells excluded) inside month container `monthIndex` (0 = left)
 */
export const pickRangeDay = (monthIndex, day) =>
  cy.get(P.monthContainer).eq(monthIndex).find(S.dayCell(day)).click();

/**
 * @tjBlock  userflow
 * @tjUsage  expectShownMonths(['June 2026', 'July 2026'])
 * @tjDom    retries: the month + year react-select values of every month container's header, joined per month
 */
export const expectShownMonths = (months) =>
  cy.get(S.monthHeaderValues).should(($v) => {
    const values = [...$v].map((e) => e.textContent.trim());
    const shown = [];
    for (let i = 0; i < values.length; i += 2) shown.push(`${values[i]} ${values[i + 1]}`);
    expect(shown, "months shown in the popup").to.deep.eq(months);
  });

/**
 * @tjBlock  userflow
 * @tjUsage  expectDayCells(S.inRange, ['10', '11', '12'])
 * @tjDom    retries: the texts of the popup's day cells matching `selector`, in DOM order
 */
export const expectDayCells = (selector, days, label = selector) =>
  cy.document().should((doc) => {
    const texts = [...doc.querySelectorAll(selector)].map((e) => e.textContent.trim());
    expect(texts, label).to.deep.eq(days);
  });

/**
 * @tjBlock  userflow
 * @tjUsage  expectRangeDisplay('drp', '20/06/2026', '03/07/2026')   // '20/06/2026 → 03/07/2026'
 * @tjDom    the input value is the DaterangePicker.jsx:69-80 display string (arrow separator, partial sides kept)
 */
export const expectRangeDisplay = (name, start, end) => {
  let expected = "";
  if (start && end) expected = `${start}${T.displaySeparator}${end}`;
  else if (start) expected = `${start}${T.displaySeparator}`;
  else if (end) expected = `${T.displaySeparator}${end}`;
  return cy.get(S.input(name)).should("have.value", expected);
};

/**
 * @tjBlock  contexts
 * @tjUsage  localMidnightUnix('20/06/2026')   // ms; the browser is pinned to Asia/Kolkata (+05:30)
 * @tjDom    pure: the unix ms of local midnight of a DD/MM/YYYY date at a fixed UTC offset (minutes)
 */
export const localMidnightUnix = (ddmmyyyy, offsetMinutes = 330) => {
  const [d, m, y] = ddmmyyyy.split("/").map(Number);
  return Date.UTC(y, m - 1, d) - offsetMinutes * 60 * 1000;
};

/**
 * @tjBlock  contexts
 * @tjUsage  rangeExposed('20/06/2026', '03/07/2026')
 * @tjDom    pure: the deterministic range variables (startDate/endDate/selectedDateRange + unix) for a probe
 */
export const rangeExposed = (start, end) => ({
  startDate: start,
  endDate: end,
  selectedDateRange: start && end ? `${start}${T.exposedSeparator}${end}` : null,
  startDateInUnix: start ? localMidnightUnix(start) : null,
  endDateInUnix: end ? localMidnightUnix(end) : null,
});

export const RANGE_KEYS = ["startDate", "endDate", "selectedDateRange", "startDateInUnix", "endDateInUnix"];
