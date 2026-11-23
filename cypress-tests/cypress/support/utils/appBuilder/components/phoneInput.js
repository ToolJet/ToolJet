import { phoneInputSelector } from "Selectors/appBuilder/components/phoneInput";

/**
 * MODULE — appBuilder/components/phoneInput: Phone Input (and Currency Input) country-picker helpers.
 * The country menu is a react-select portalled into document.body and keyed by the component id
 * (CountrySelect.jsx:134,160), so the helpers resolve the id from the canvas wrapper first.
 */

/**
 * @tjBlock  canvas
 * @tjUsage  getComponentId('phoneinput1').then((id) => ...)
 * @tjDom    closest `[component-type]` wrapper of the draggable → its `id` (WidgetWrapper.jsx:264)
 */
export const getComponentId = (widgetName) =>
  cy
    .get(phoneInputSelector.draggableWidget(widgetName))
    .closest(phoneInputSelector.wrapper)
    .invoke("attr", "id");

/**
 * @tjBlock  canvas
 * @tjUsage  openCountryMenu('phoneinput1').then((id) => ...)
 * @tjDom    real click on the country picker → `.country-<id>__menu` visible; yields the component id
 */
export const openCountryMenu = (widgetName) =>
  getComponentId(widgetName).then((id) => {
    cy.get(phoneInputSelector.countrySelect(widgetName)).realClick();
    cy.get(phoneInputSelector.menu(id)).should("be.visible");
    return cy.wrap(id);
  });

/**
 * @tjBlock  canvas
 * @tjUsage  selectCountryOption(id, 'India +91')
 * @tjDom    real click on the `.country-<id>__option` whose text is the label
 */
export const selectCountryOption = (componentId, optionLabel) => {
  cy.contains(phoneInputSelector.option(componentId), optionLabel).scrollIntoView().realClick();
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectDialCode('phoneinput1', '+91')
 * @tjDom    dial code text rendered beside the flag (CustomValueContainer.jsx:30)
 */
export const expectDialCode = (widgetName, dialCode) => {
  cy.get(phoneInputSelector.dialCode(widgetName)).invoke("text").then((t) => expect(t.trim()).to.eq(dialCode));
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectInputDigits('phoneinput1', '2015550123')
 * @tjDom    the tel input's value with every non-digit stripped (react-phone-number-input formats with spaces)
 */
export const expectInputDigits = (widgetName, digits) => {
  cy.get(phoneInputSelector.input(widgetName)).should(($i) => {
    expect(String($i.val()).replace(/\D/g, ""), "digits in the phone field").to.eq(digits);
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectActiveElementWithin('[data-cy="phoneinput1-country-select-dropdown"]')
 * @tjDom    document.activeElement is (inside) the first element matching the selector
 */
export const expectActiveElementWithin = (selector) => {
  cy.get(selector).first().should(($el) => {
    const active = $el[0].ownerDocument.activeElement;
    expect($el[0].contains(active), `focus is within ${selector} (active: ${active && active.outerHTML.slice(0, 80)})`).to.be.true;
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectActiveElementOutside('[data-cy="phoneinput1-actionable-section"]')
 * @tjDom    document.activeElement is NOT inside the first element matching the selector
 */
export const expectActiveElementOutside = (selector) => {
  cy.get(selector).first().should(($el) => {
    const active = $el[0].ownerDocument.activeElement;
    expect($el[0].contains(active), `focus is outside ${selector} (active: ${active && active.outerHTML.slice(0, 80)})`).to.be.false;
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectVerticallyCentred('.tj-input-clear-btn', '[data-cy="phoneinput1-input"]')
 * @tjDom    retries until the inner rect's vertical centre matches the outer rect's (± tolerance px)
 */
export const expectVerticallyCentred = (innerSelector, outerSelector, tolerance = 2) => {
  cy.get(outerSelector).first().should(($outer) => {
    const inner = Cypress.$(innerSelector)[0];
    expect(inner, `${innerSelector} rendered`).to.exist;
    const i = inner.getBoundingClientRect();
    const o = $outer[0].getBoundingClientRect();
    const di = (i.top + i.bottom) / 2 - (o.top + o.bottom) / 2;
    expect(Math.abs(di), `${innerSelector} vertical centre vs ${outerSelector} (Δ=${di.toFixed(1)}px)`).to.be.lte(tolerance);
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectCountryMenuGeometry('phoneinput1', id, { width: 208, height: 236, gap: 2 })
 * @tjDom    portalled `.country-<id>__menu` box size + placement: directly under the country control, left edges aligned
 */
export const expectCountryMenuGeometry = (widgetName, componentId, { width, height, gap }, tolerance = 2) => {
  cy.get(phoneInputSelector.menu(componentId)).should(($menu) => {
    const m = $menu[0].getBoundingClientRect();
    const c = Cypress.$(phoneInputSelector.countryControl(widgetName))[0].getBoundingClientRect();
    expect(Math.abs(m.width - width), `menu width ${m.width} ≈ ${width}`).to.be.lte(tolerance);
    expect(Math.abs(m.height - height), `menu height ${m.height} ≈ ${height}`).to.be.lte(tolerance);
    expect(Math.abs(m.top - (c.bottom + gap)), `menu top ${m.top} ≈ control bottom ${c.bottom} + ${gap}`).to.be.lte(tolerance);
    expect(Math.abs(m.left - c.left), `menu left ${m.left} ≈ control left ${c.left}`).to.be.lte(tolerance);
    // portalled into <body>, not clipped inside the widget box
    expect($menu[0].closest('[data-cy^="draggable-widget-"]'), "menu is portalled out of the widget").to.be.null;
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  getWidgetCanvasOffset('phoneinput1').then(({ x, y }) => ...)
 * @tjDom    draggable rect minus the `[data-cy=real-canvas]` rect — position on the canvas, immune to page scroll
 */
export const getWidgetCanvasOffset = (widgetName) =>
  cy.get(phoneInputSelector.draggableWidget(widgetName)).then(($w) => {
    const w = $w[0].getBoundingClientRect();
    const c = Cypress.$("[data-cy=real-canvas]")[0].getBoundingClientRect();
    return { x: Math.round(w.left - c.left), y: Math.round(w.top - c.top) };
  });
