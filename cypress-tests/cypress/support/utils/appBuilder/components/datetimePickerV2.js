/**
 * MODULE — appBuilder/components/datetimePickerV2: browser-only helpers for the Date Time Picker widget.
 * FOR AI: addDatetimePickersViaApi seeds Date Time Pickers (+ helper widgets / Form parents / events) through the
 * shared addDateWidgetsViaApi; the popup drivers, probes and timezone pinning live in dateTimeCommon.js.
 */
import { datetimePickerV2Text as T } from "Texts/appBuilder/components/datetimePickerV2";
import { addDateWidgetsViaApi } from "Support/utils/appBuilder/components/dateTimeCommon";

/**
 * @tjBlock  contexts
 * @tjUsage  addDatetimePickersViaApi([{ name: 'dtp', properties: { defaultValue: { value: '15/06/2026 10:30' } } }, dateProbe('probe', 'dtp', ['value'])])
 * @tjDom    addDateWidgetsViaApi with componentType DatetimePickerV2 and the datetimepickerV2.js:7-10 default size
 */
export const addDatetimePickersViaApi = (items, opts = {}) =>
  addDateWidgetsViaApi(items, { componentType: T.componentType, defaultSize: T.defaultSize, ...opts });
