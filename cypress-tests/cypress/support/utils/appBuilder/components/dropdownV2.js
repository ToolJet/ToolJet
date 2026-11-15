/**
 * MODULE — appBuilder/components/dropdownV2: browser-only helpers for the Dropdown (DropdownV2) widget.
 * FOR AI: addDropdownsViaApi seeds fully-configured Dropdowns (definition defaults merged, validation and
 * event handlers included) plus any helper widgets in one components POST; visitDropdownApp opens the running
 * app (optionally as an iPhone user agent); openDropdownMenu / pickDropdownOption drive the portalled
 * react-select menu; dropdownState reads the real geometry + computed styles of the field, its value and the
 * open menu (virtualized rows, scroll state, viewport overflow) as a plain object.
 * The Select has no classNamePrefix (DropdownV2.jsx:573-653), so parts are reached structurally — see
 * Selectors/appBuilder/components/dropdownV2. Only one Dropdown menu is open at a time.
 * NOT here: legacy Dropdown (v1) helpers → components/dropdown.js.
 */
import { dropdownV2Selector as S } from "Selectors/appBuilder/components/dropdownV2";
import { dropdownV2Text } from "Texts/appBuilder/components/dropdownV2";

const authHeaders = (cookie) => ({
  "Content-Type": "application/json",
  "Tj-Workspace-Id": Cypress.env("workspaceId"),
  Cookie: `tj_auth_token=${cookie.value}`,
});

/**
 * @tjBlock  contexts
 * @tjUsage  addDropdownsViaApi([{ name: 'dd', layout: { top: 40, left: 2, width: 10, height: 40 }, validation: { mandatory: { value: '{{true}}' } }, events: [counterEvent('onSelect', 'selects')] }])
 * @tjDom    GET /api/apps/<appId> (editing version + home page) → POST /api/v2/apps/<appId>/versions/<v>/components
 *           → POST .../events per handler. Items without `type` become DropdownV2 with dropdownV2.js definition
 *           properties/styles/others/validation merged under the item's own; other types post what is passed.
 *           Event items are merged over { actionId: 'show-alert', alertType: 'info' }; a `componentName` in a
 *           control-component event resolves to the seeded component's id. Sets Cypress.env('editingVersionId').
 */
export const addDropdownsViaApi = (items, appIdArg) =>
  cy.getCookie("tj_auth_token").then((cookie) => {
    // resolve lazily: apiCreateApp sets Cypress.env('appId') only when its request completes
    const appId = appIdArg || Cypress.env("appId");
    const api = `${Cypress.env("server_host")}/api`;
    const headers = authHeaders(cookie);
    return cy.request({ method: "GET", url: `${api}/apps/${appId}`, headers }).then((res) => {
      const { id: versionId, home_page_id: pageId } = res.body.editing_version;
      Cypress.env("editingVersionId", versionId);
      const D = dropdownV2Text.definition;
      const ids = {};
      items.forEach((item) => {
        ids[item.name] = item.id || crypto.randomUUID();
      });
      const diff = {};
      const events = [];
      items.forEach((item) => {
        const id = ids[item.name];
        const type = item.type || dropdownV2Text.componentType;
        const isDropdown = type === dropdownV2Text.componentType;
        const layout = { top: 40, left: 2, width: 10, height: 40, ...item.layout };
        diff[id] = {
          name: item.name,
          type,
          ...(item.parent ? { parent: item.parent } : {}),
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: { ...(isDropdown ? D.properties : {}), ...item.properties },
          styles: { ...(isDropdown ? D.styles : {}), ...item.styles },
          others: { ...(isDropdown ? D.others : {}), ...item.others },
          validation: { ...(isDropdown ? D.validation : {}), ...item.validation },
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
      })
        .its("status")
        .should("eq", 201);
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
    });
  });

/**
 * @tjBlock  contexts
 * @tjUsage  dropdownOptions(['alpha', 'beta'], 'beta')  ·  dropdownOptions(Array.from({length: 3}, (_, i) => `Item ${i}`))
 * @tjDom    builds a static properties.options value (dropdownV2.js:408-434 shape) — value = label, the one
 *           whose label equals `defaultLabel` is the default
 */
export const dropdownOptions = (labels, defaultLabel = null) => ({
  value: labels.map((label) => ({
    label,
    value: label,
    caption: null,
    disable: { value: false },
    visible: { value: true },
    default: { value: label === defaultLabel },
  })),
});

/**
 * @tjBlock  contexts
 * @tjUsage  visitDropdownApp('[data-cy="draggable-widget-dd"]', { query: '&layout=mobile', userAgent: dropdownV2Text.iPhoneUserAgent })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) or `path`; with
 *           `userAgent`, navigator.userAgent is overridden before the app boots (isMobileDevice / iOS checks
 *           read it at render time); waits for the selector
 */
export const visitDropdownApp = (waitForSelector, { appId, query = "", path, userAgent } = {}) => {
  cy.then(() =>
    cy.visit(path || `/applications/${appId || Cypress.env("appId")}/home?version=v1${query}`, {
      onBeforeLoad(win) {
        if (userAgent) Object.defineProperty(win.navigator, "userAgent", { value: userAgent, configurable: true });
      },
    })
  );
  if (waitForSelector) cy.get(waitForSelector, { timeout: 30000 }).should("be.visible");
};

/**
 * @tjBlock  canvas
 * @tjUsage  getDropdownComponentId('dd').then((id) => cy.get(dropdownV2Selector.validationError(id)))
 * @tjDom    closest `[component-type]` wrapper of the draggable → its `id`
 */
export const getDropdownComponentId = (name) =>
  cy.get(S.draggableWidget(name)).first().closest(S.wrapper).invoke("attr", "id");

/**
 * @tjBlock  canvas
 * @tjUsage  openDropdownMenu('dd')
 * @tjDom    clicks the actionable section (DropdownV2.jsx:567 handleClickInsideSelect) → menu list visible
 */
export const openDropdownMenu = (name) => {
  cy.get(S.menuList).should("not.exist");
  cy.get(S.field(name)).click({ scrollBehavior: "center" });
  cy.get(S.menuList).should("be.visible");
};

/**
 * @tjBlock  canvas
 * @tjUsage  closeDropdownMenu('dd')
 * @tjDom    clicks the actionable section again (toggle) → menu list removed
 */
export const closeDropdownMenu = (name) => {
  cy.get(S.field(name)).click({ scrollBehavior: "center" });
  cy.get(S.menuList).should("not.exist");
};

/**
 * @tjBlock  canvas
 * @tjUsage  pickDropdownOption('beta')
 * @tjDom    clicks the open menu's option whose text equals the label → menu closes
 */
export const pickDropdownOption = (label) => {
  cy.get(S.option).contains(new RegExp(`^${Cypress._.escapeRegExp(label)}$`)).click();
  cy.get(S.menuList).should("not.exist");
};

/**
 * @tjBlock  canvas
 * @tjUsage  searchDropdownMenu('alp')
 * @tjDom    real keystrokes into the open menu's search box (focused on open — CustomMenuList.jsx:37-42; typing →
 *           onInputChange). The menu re-renders per keystroke and replaces the <input>, which breaks cy.type, so
 *           the text goes through cy.realType to the focused element and the box is re-queried for its value
 */
export const searchDropdownMenu = (text) => {
  cy.get(S.menuSearch).should("have.value", "").and("be.focused");
  cy.realType(text);
  cy.get(S.menuSearch).should("have.value", text);
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectDropdownValue('dd', 'beta')
 * @tjDom    trimmed text of the SingleValue / Placeholder node in the ValueContainer
 */
export const expectDropdownValue = (name, text) =>
  cy.get(S.valueText(name)).first().should(($el) => expect($el.text().trim(), `${name} shown value`).to.eq(text));

const rect = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const measureDropdown = (doc, name) => {
  const win = doc.defaultView;
  const cs = (el, prop) => (el ? win.getComputedStyle(el).getPropertyValue(prop) : null);
  const box = doc.querySelector(S.draggableWidget(name));
  const container = box ? box.querySelector('[id^="component-"]') : null;
  const control = container ? container.querySelector(":scope > div") : null;
  const valueContainer = control ? control.firstElementChild : null;
  const valueText = valueContainer ? valueContainer.querySelector("span.d-flex > div") : null;
  const field = box ? box.querySelector(".dropdownV2-widget") : null;
  const list = doc.querySelector(S.menuList);
  const body = list ? list.querySelector(S.menuBody) : null;
  const search = list ? list.querySelector(S.menuSearch) : null;
  const options = list
    ? [...list.querySelectorAll('[id^="react-select-"][id*="-option-"]')].map((o) => {
        const check = o.querySelector("svg path");
        const label = o.querySelector("span.tw-truncate");
        return {
          id: o.id,
          index: Number(o.id.split("-option-")[1]),
          text: o.textContent.trim(),
          ...rect(o),
          color: cs(o, "color"),
          backgroundColor: cs(o, "background-color"),
          checkFill: check ? cs(check, "fill") : null,
          labelTruncated: label ? label.scrollWidth > label.clientWidth : null,
        };
      })
    : [];
  const error = container ? doc.getElementById(`${container.id.replace(/^component-/, "")}-validation-error`) : null;
  return {
    box: box ? { ...rect(box), padding: cs(box, "padding-top") } : null,
    field: rect(field),
    control: control
      ? {
          ...rect(control),
          backgroundColor: cs(control, "background-color"),
          borderColor: cs(control, "border-top-color"),
          borderRadius: cs(control, "border-top-left-radius"),
          boxShadow: cs(control, "box-shadow"),
        }
      : null,
    value: valueContainer
      ? {
          justifyContent: cs(valueContainer, "justify-content"),
          container: rect(valueContainer),
          // CustomValueContainer.jsx:25 — the `.d-inline-flex` block justify-content positions
          inner: rect(valueContainer.firstElementChild),
          paddingLeft: parseFloat(cs(valueContainer, "padding-left")),
          paddingRight: parseFloat(cs(valueContainer, "padding-right")),
          text: valueText ? valueText.textContent.trim() : null,
          textRect: rect(valueText),
          color: cs(valueText, "color"),
        }
      : null,
    loader: !!(box && box.querySelector(".tj-widget-loader")),
    indicatorCount: control && control.lastElementChild ? control.lastElementChild.children.length : 0,
    ariaInvalid: box ? box.querySelector('input[role="combobox"]')?.getAttribute("aria-invalid") : null,
    error: error ? { text: error.textContent.trim(), color: cs(error, "color") } : null,
    menu: list
      ? {
          ...rect(list),
          fontSize: cs(list, "font-size"),
          backgroundColor: body ? cs(body, "background-color") : null,
          search: search ? { fontSize: cs(search, "font-size"), focused: doc.activeElement === search } : null,
          body: body
            ? { ...rect(body), scrollTop: body.scrollTop, scrollHeight: body.scrollHeight, clientHeight: body.clientHeight }
            : null,
          options,
        }
      : null,
    viewport: {
      innerWidth: win.innerWidth,
      clientWidth: doc.documentElement.clientWidth,
      scrollWidth: doc.documentElement.scrollWidth,
      scrollX: win.scrollX,
      scale: win.visualViewport ? win.visualViewport.scale : 1,
    },
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  dropdownState('dd', (s) => expect(s.menu.width).to.be.closeTo(s.field.width, 1))
 * @tjDom    retries the callback with a plain object: `box` (RenderWidget box rect + padding), `field`
 *           (actionable section rect), `control` (rect + background/border colour, radius, box-shadow),
 *           `value` (ValueContainer justify-content/rect/padding, its `.d-inline-flex` child rect `inner`,
 *           SingleValue|Placeholder text/rect/colour),
 *           `loader`, `indicatorCount`, `ariaInvalid`, `error` (validation node text/colour), `menu` (list
 *           rect, font-size, background, search font-size/focus, scroller rect/scrollTop/scrollHeight, rendered
 *           option rows: index/text/rect/colour/background/check-mark fill/label truncation) and `viewport`
 *           (innerWidth, clientWidth, document scrollWidth, scrollX, visualViewport scale)
 */
export const dropdownState = (name, assertFn) =>
  cy.document().should((doc) => assertFn(measureDropdown(doc, name)));

/**
 * @tjBlock  canvas
 * @tjUsage  getDropdownState('dd').then((s) => …)
 * @tjDom    one-shot read (no retry) of the plain object dropdownState passes to its callback
 */
export const getDropdownState = (name) => cy.document().then((doc) => measureDropdown(doc, name));

/**
 * @tjBlock  canvas
 * @tjUsage  scrollDropdownMenuTo('bottom')  ·  scrollDropdownMenuTo(0)
 * @tjDom    scrolls the open menu's virtualized scroller (fires a real scroll event the virtualizer reads). First
 *           waits until the scroller's scrollTop has not moved for `quietMs`: the reveal-on-open
 *           (CustomMenuList.jsx:56-67 → @tanstack/virtual scrollToIndex) re-scrolls to the selected row on up to 10
 *           animation frames while row measurements settle, and a scroll made inside that window is pulled back.
 */
export const scrollDropdownMenuTo = (position, quietMs = 300) => {
  let last = null;
  let since = 0;
  cy.get(S.menuBody).should(($b) => {
    const top = $b[0].scrollTop;
    if (top !== last) {
      last = top;
      since = Date.now();
    }
    expect(Date.now() - since, "menu scroll settled").to.be.gte(quietMs);
  });
  if (typeof position === "number") cy.get(S.menuBody).scrollTo(0, position, { ensureScrollable: false });
  else cy.get(S.menuBody).scrollTo(position, { ensureScrollable: false });
};

/**
 * @tjBlock  canvas
 * @tjUsage  waitForStableRect(dropdownV2Selector.field('dd'))
 * @tjDom    re-reads the element's bounding rect every 300ms until two reads agree (the viewer's header and
 *           mobile layout settle after first paint; coordinates taken before that point at the wrong element)
 */
export const waitForStableRect = (selector, triesLeft = 20) =>
  cy.get(selector).first().then(($el) => {
    const a = $el[0].getBoundingClientRect();
    cy.wait(300); // dynamic: settle interval
    cy.get(selector).first().then(($again) => {
      const b = $again[0].getBoundingClientRect();
      const same = ["left", "top", "width", "height"].every((k) => Math.abs(a[k] - b[k]) < 0.5);
      if (!same) {
        expect(triesLeft, `${selector} settles`).to.be.gt(0);
        waitForStableRect(selector, triesLeft - 1);
      }
    });
  });
