/**
 * MODULE — appBuilder/components/timePicker: browser-only helpers for the Time Picker widget.
 * FOR AI: addTimePickersViaApi seeds Time Pickers (+ helper widgets / Form parents / events) through the shared
 * addDateWidgetsViaApi; the popup drivers (openDatePopup, pickTimeItem, expectSelectedTime), probes and timezone
 * pinning live in dateTimeCommon.js. timeColumnState reads each column's scroll + thumb geometry.
 */
import { timePickerText as T } from "Texts/appBuilder/components/timePicker";
import { timePickerSelector as S } from "Selectors/appBuilder/components/timePicker";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { addDateWidgetsViaApi } from "Support/utils/appBuilder/components/dateTimeCommon";

/**
 * @tjBlock  contexts
 * @tjUsage  addTimePickersViaApi([{ name: 'tp', properties: { defaultValue: { value: '10:30' } } }, dateProbe('probe', 'tp', ['value'])])
 * @tjDom    addDateWidgetsViaApi with componentType TimePicker and the timepicker.js:6-9 default size
 */
export const addTimePickersViaApi = (items, opts = {}) =>
  addDateWidgetsViaApi(items, { componentType: T.componentType, defaultSize: T.defaultSize, ...opts });

/**
 * @tjBlock  userflow
 * @tjUsage  expectTimeItems(0, (labels, disabled) => expect(disabled).to.deep.eq(['00', … '08']))
 * @tjDom    retries the callback with the item texts of time column `column` and the texts of its `.disabled-time` items
 */
export const expectTimeItems = (column, assertFn) =>
  cy.get(P.timeColumn).eq(column).should(($col) => {
    const items = [...$col[0].querySelectorAll(P.timeItem)];
    assertFn(
      items.map((e) => e.textContent),
      items.filter((e) => e.matches(S.disabledTimeItem)).map((e) => e.textContent)
    );
  });

/**
 * @tjBlock  canvas
 * @tjUsage  timeColumnState().then((cols) => expect(cols[0].scrollTop).to.eq(0))
 * @tjDom    one-shot plain objects per `.time-col`: scrollTop / scrollHeight / clientHeight, the column rect, the
 *           overlay thumb rect + its `scrolling` state class (TimepickerInput.jsx:95-108)
 */
export const timeColumnState = () =>
  cy.document().then((doc) =>
    [...doc.querySelectorAll(P.timeColumn)].map((col) => {
      const wrap = col.closest(".time-colwrap");
      const bar = wrap && wrap.querySelector(".time-scrollbar");
      const thumb = bar && bar.querySelector(".time-scrollbar-thumb");
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      };
      return {
        scrollTop: col.scrollTop,
        scrollHeight: col.scrollHeight,
        clientHeight: col.clientHeight,
        col: rect(col),
        thumb: rect(thumb),
        scrolling: bar ? bar.classList.contains("scrolling") : null,
      };
    })
  );
