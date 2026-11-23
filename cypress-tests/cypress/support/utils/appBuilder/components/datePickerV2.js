/**
 * MODULE — appBuilder/components/datePickerV2: browser-only helpers for the Date Picker (DatePickerV2) widget.
 * FOR AI: addDatePickersViaApi seeds Date Pickers (+ helper widgets / Form parents / events) through the shared
 * addDateWidgetsViaApi; the popup drivers, probes and timezone pinning live in dateTimeCommon.js.
 * unpinBrowserTimezone drops the CDP timezone override so later specs see the machine zone again.
 */
import { datePickerV2Text as T } from "Texts/appBuilder/components/datePickerV2";
import { addDateWidgetsViaApi } from "Support/utils/appBuilder/components/dateTimeCommon";

/**
 * @tjBlock  contexts
 * @tjUsage  addDatePickersViaApi([{ name: 'dp', properties: { defaultValue: { value: '15/06/2026' } } }, dateProbe('probe', 'dp', ['value'])])
 * @tjDom    addDateWidgetsViaApi with componentType DatePickerV2 and the datepickerV2.js:6-9 default size
 */
export const addDatePickersViaApi = (items, opts = {}) =>
  addDateWidgetsViaApi(items, { componentType: T.componentType, defaultSize: T.defaultSize, ...opts });

/**
 * @tjBlock  contexts
 * @tjUsage  after(() => unpinBrowserTimezone())
 * @tjDom    CDP Emulation.setTimezoneOverride with an empty id — restores the host timezone for later specs
 */
export const unpinBrowserTimezone = () =>
  cy.then(() =>
    Cypress.automation("remote:debugger:protocol", {
      command: "Emulation.setTimezoneOverride",
      params: { timezoneId: "" },
    }).catch(() => null)
  );
