/**
 * MODULE — appBuilder/components/dateTimeCommon: browser-only helpers shared by the date/time widgets
 * (DatetimePickerV2, DatePickerV2, DaterangePicker, TimePicker — all render react-datepicker through
 * frontend/src/AppBuilder/Widgets/Date/BaseDateComponent.jsx).
 * FOR AI: addDateWidgetsViaApi seeds fully-configured date widgets (+ helper widgets, children via `parent`,
 * validation, events) in one components POST — deterministic and much faster than inspector edits;
 * pinBrowserTimezone fixes the browser's own timezone (CDP) so local-offset math is machine-independent;
 * dateProbe / expectDateProbe expose a widget's variables through a Text as JSON; openDatePopup /
 * pickCalendarDay / pickTimeItem / expectSelectedTime drive the real popup; datePopupBoxes reads its geometry.
 * Prefer fixed explicit dates in data over cy.clock (cy.clock stalls the app's timers).
 */
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { openIconAppInViewer } from "Support/utils/appBuilder/components/icon";

/**
 * @tjBlock  contexts
 * @tjUsage  addDateWidgetsViaApi([{ name: 'dtp', properties: { defaultValue: { value: '15/06/2026 10:30' } }, validation: { mandatory: { value: '{{true}}' } }, events: [counterEvent('onSelect', 'selects')] }, dateProbe('probe', 'dtp', ['value'])], { componentType: 'DatetimePickerV2', defaultSize: { width: 10, height: 40 } })
 * @tjDom    GET /api/apps/<appId> (editing version + home page) → POST /api/v2/apps/<appId>/versions/<v>/components
 *           (items without `type` become `componentType`; only the passed properties/styles/others/validation are
 *           posted — the app loader fills the definition defaults; `id` pins a component id, `parent` nests it,
 *           e.g. a Form child or `<formId>-footer`) → POST .../events per handler. Event items are merged over
 *           { actionId: 'show-alert', alertType: 'info' }; `componentName` in a control-component event is resolved
 *           to the seeded component's id. Sets Cypress.env('editingVersionId').
 */
export const addDateWidgetsViaApi = (items, { componentType, defaultSize = { width: 10, height: 40 }, appId: appIdArg } = {}) =>
  cy.getCookie("tj_auth_token").then((cookie) => {
    // resolve lazily: apiCreateApp sets Cypress.env('appId') only when its request completes
    const appId = appIdArg || Cypress.env("appId");
    const api = `${Cypress.env("server_host")}/api`;
    const headers = {
      "Content-Type": "application/json",
      "Tj-Workspace-Id": Cypress.env("workspaceId"),
      Cookie: `tj_auth_token=${cookie.value}`,
    };
    return cy.request({ method: "GET", url: `${api}/apps/${appId}`, headers }).then((res) => {
      const { id: versionId, home_page_id: pageId } = res.body.editing_version;
      Cypress.env("editingVersionId", versionId);
      const ids = {};
      items.forEach((item) => {
        ids[item.name] = item.id || crypto.randomUUID();
      });
      const diff = {};
      const events = [];
      items.forEach((item) => {
        const id = ids[item.name];
        const type = item.type || componentType;
        const isDate = type === componentType;
        const layout = {
          top: 40,
          left: 2,
          width: isDate ? defaultSize.width : 8,
          height: isDate ? defaultSize.height : 40,
          ...item.layout,
        };
        diff[id] = {
          name: item.name,
          type,
          ...(item.parent ? { parent: item.parent } : {}),
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: item.properties || {},
          styles: item.styles || {},
          others: item.others || {},
          validation: item.validation || {},
        };
        (item.events || []).forEach((e, index) => {
          const { componentName, ...rest } = e;
          events.push({
            name: rest.eventId, // event_handlers.name is NOT NULL (the editor stores the event id)
            event: {
              actionId: "show-alert",
              alertType: "info",
              ...rest,
              ...(componentName ? { componentId: ids[componentName] } : {}),
            },
            eventType: "component",
            attachedTo: id,
            index,
          });
        });
      });
      cy.request({
        method: "POST",
        url: `${api}/v2/apps/${appId}/versions/${versionId}/components`,
        headers,
        body: { is_user_switched_version: false, pageId, diff },
        failOnStatusCode: false,
      }).then((r) => expect(r.status, `create components: ${JSON.stringify(r.body)}`).to.eq(201));
      events.forEach((body) =>
        cy
          .request({
            method: "POST",
            url: `${api}/v2/apps/${appId}/versions/${versionId}/events`,
            headers,
            body,
            failOnStatusCode: false,
          })
          .then((r) => expect(r.status, `create event: ${JSON.stringify(r.body)}`).to.be.oneOf([200, 201]))
      );
      return cy.wrap(ids, { log: false });
    });
  });

/**
 * @tjBlock  contexts
 * @tjUsage  pinBrowserTimezone('Asia/Kolkata')   // before cy.visit / cy.openApp
 * @tjDom    CDP Emulation.setTimezoneOverride on the browser tab: Date, Intl and moment.tz.guess() in the app
 *           all report this zone, whatever the CI machine's own timezone is. Verified through the AUT window.
 */
export const pinBrowserTimezone = (timezoneId) => {
  cy.then(() =>
    Cypress.automation("remote:debugger:protocol", {
      command: "Emulation.setTimezoneOverride",
      params: { timezoneId },
    }).catch((err) => {
      // an override that is already active is reported as an error by some Chromium builds
      if (!/already in effect/i.test(String(err && err.message))) throw err;
    })
  );
};

/**
 * @tjBlock  contexts
 * @tjUsage  expectBrowserTimezone('Asia/Kolkata')
 * @tjDom    the AUT window's Intl timezone (proves pinBrowserTimezone reached the app)
 */
export const expectBrowserTimezone = (timezoneId) =>
  cy.window().should((win) => {
    const tz = win.Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Chromium may canonicalise Asia/Kolkata as Asia/Calcutta
    expect([timezoneId, timezoneId.replace("Kolkata", "Calcutta")], "browser timezone").to.include(tz);
  });

/**
 * @tjBlock  contexts
 * @tjUsage  dateProbe('probe', 'dtp', ['value', 'displayValue'], { top: 300 })
 * @tjDom    a Text item (for addDateWidgetsViaApi) rendering JSON.stringify({ key: components.<widget>.<key>, … })
 */
export const dateProbe = (name, widget, keys, layout = {}) => ({
  type: "Text",
  name,
  layout: { top: 300, left: 2, width: 30, height: 60, ...layout },
  properties: {
    text: { value: `{{JSON.stringify({${keys.map((k) => `${k}: components.${widget}.${k}`).join(", ")}})}}` },
  },
});

/**
 * @tjBlock  contexts
 * @tjUsage  expectDateProbe('probe', { value: '2026-06-15T10:30:00.000+05:30', displayValue: '15/06/2026 10:30' })
 * @tjDom    retries: the probe Text's JSON deep-equals the expected object (keys whose value is undefined drop out)
 */
export const expectDateProbe = (name, expected, label = "exposed values") =>
  cy.get(`[data-cy="draggable-widget-${name}"]`, { timeout: 20000 }).should(($el) => {
    const raw = $el.text().trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      parsed = raw;
    }
    expect(parsed, label).to.deep.eq(expected);
  });

/**
 * @tjBlock  contexts
 * @tjUsage  openDateAppInViewer('[data-cy="dtp-input-field"]', { query: '&layout=mobile' })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for a selector
 */
export const openDateAppInViewer = (waitForSelector, opts) => openIconAppInViewer(waitForSelector, opts);

/**
 * @tjBlock  userflow
 * @tjUsage  openDatePopup('[data-cy="dtp-input-field"]')
 * @tjDom    clicks the widget input; the react-datepicker popup in #component-portal is visible
 */
export const openDatePopup = (inputSelector) => {
  cy.get(inputSelector).click();
  cy.get(P.calendar).should("be.visible");
};

/**
 * @tjBlock  userflow
 * @tjUsage  pickCalendarDay(20)
 * @tjDom    clicks the day cell of the shown month (outside-month cells excluded)
 */
export const pickCalendarDay = (day) => cy.get(P.day(day)).click();

/**
 * @tjBlock  userflow
 * @tjUsage  pickTimeItem(0, '14')   // column 0 = hours, 1 = minutes, 2 = am/pm
 * @tjDom    clicks the `.time-item` whose text is exactly `label` in the given `.time-col`
 */
export const pickTimeItem = (column, label) =>
  cy.get(P.timeColumn).eq(column).contains(P.timeItem, new RegExp(`^${label}$`)).click();

/**
 * @tjBlock  userflow
 * @tjUsage  expectSelectedTime(['14', '45'])
 * @tjDom    retries: the highlighted (`.selected-time`) item of every time column, left to right
 */
export const expectSelectedTime = (labels) =>
  cy.get(P.timeColumn).should(($cols) => {
    const selected = [...$cols].map((c) => c.querySelector(P.selectedTimeItem)?.textContent ?? null);
    expect(selected, "highlighted time items").to.deep.eq(labels);
  });

const rectOf = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const popupSnapshot = (doc, inputSelector) => {
  const q = (s) => doc.querySelector(s);
  const popup = q(P.popup);
  const timePanel = q(P.timePanel);
  const timeBody = timePanel && timePanel.querySelector(".time-input-body");
  return {
    input: rectOf(q(inputSelector)),
    popup: rectOf(popup),
    calendar: rectOf(q(P.calendar)),
    month: rectOf(q(P.monthContainer)),
    time: rectOf(timePanel),
    timeBody: timeBody ? { scrollWidth: timeBody.scrollWidth, clientWidth: timeBody.clientWidth } : null,
    popupClass: popup ? popup.className : null,
    viewport: { width: doc.defaultView.innerWidth, height: doc.defaultView.innerHeight },
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  datePopupBoxes('[data-cy="dtp-input-field"]', (b) => expect(b.popup.left).to.be.closeTo(b.input.left, 1))
 * @tjDom    retries the callback with plain-object rects of the input, the popper, the calendar, the month grid and
 *           the time panel, the time body's scroll/client width, the popper class list and the viewport size
 */
export const datePopupBoxes = (inputSelector, assertFn) =>
  cy.document().should((doc) => assertFn(popupSnapshot(doc, inputSelector)));

/**
 * @tjBlock  canvas
 * @tjUsage  readDatePopupBoxes('[data-cy="dtp-input-field"]').then((b) => …)
 * @tjDom    one-shot read of the datePopupBoxes snapshot (plain object)
 */
export const readDatePopupBoxes = (inputSelector) => cy.document().then((doc) => popupSnapshot(doc, inputSelector));

/**
 * @tjBlock  events
 * @tjUsage  csaEvent('onClick', 'dtp', 'setFocus')
 * @tjDom    a control-component event item for addDateWidgetsViaApi (componentName resolved to the seeded id)
 */
export const csaEvent = (eventId, componentName, handle, params = []) => ({
  eventId,
  actionId: "control-component",
  componentName,
  componentSpecificActionHandle: handle,
  componentSpecificActionParams: params,
});

/**
 * @tjBlock  userflow
 * @tjUsage  expectActiveElement('[data-cy="dtp-input-field"]', true)
 * @tjDom    retries: whether document.activeElement is the element (real focus, not a CSS state)
 */
export const expectActiveElement = (selector, focused = true) =>
  cy.document().should((doc) => {
    const el = doc.querySelector(selector);
    expect(el, `${selector} rendered`).to.exist;
    expect(doc.activeElement === el, `${selector} has focus`).to.eq(focused);
  });
