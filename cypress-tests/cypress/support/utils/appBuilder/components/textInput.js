/**
 * MODULE — appBuilder/components/textInput: browser-only helpers for the Text Input widget.
 * FOR AI: addTextInputsViaApi seeds fully-configured Text Inputs (+ helper widgets / events) in one
 * components POST (thin wrapper over the generic addDateWidgetsViaApi); expectClearButtonClearOfText checks
 * the clear button sits in the input's reserved right padding (TextInput.jsx getCustomStyles → 25px), so it
 * never covers typed text; widgetHeight reads the RenderWidget box height.
 */
import { textInputSelector } from "Selectors/appBuilder/components/textInput";
import { textInputText } from "Texts/appBuilder/components/textInput";
import { addDateWidgetsViaApi } from "Support/utils/appBuilder/components/dateTimeCommon";

/**
 * @tjBlock  contexts
 * @tjUsage  addTextInputsViaApi([{ name: 'ti1', layout: { top: 40 }, styles: { alignment: { value: 'top' } } }])
 * @tjDom    POST /api/v2/apps/<appId>/versions/<v>/components — items without `type` become TextInput; only the
 *           passed keys are posted, the app loader fills textinput.js definition defaults. Returns { name: id }.
 */
export const addTextInputsViaApi = (items, opts = {}) =>
  addDateWidgetsViaApi(items, {
    componentType: textInputText.componentType,
    defaultSize: { width: 10, height: 40 }, // source: textinput.js:6-9 defaultSize
    ...opts,
  });

/**
 * @tjBlock  canvas
 * @tjUsage  expectClearButtonClearOfText('textinput1')
 * @tjDom    clear button's left edge ≥ the <input>'s content-box right edge (right − padding-right − border)
 */
export const expectClearButtonClearOfText = (widgetName, tolerance = 0.5) => {
  cy.get(textInputSelector.input(widgetName)).first().should(($input) => {
    const btn = Cypress.$(textInputSelector.clearButton(widgetName))[0];
    expect(btn, "clear button rendered").to.exist;
    const el = $input[0];
    const css = el.ownerDocument.defaultView.getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const contentRight = r.right - parseFloat(css.paddingRight) - parseFloat(css.borderRightWidth);
    const b = btn.getBoundingClientRect();
    expect(parseFloat(css.paddingRight), "input reserves right padding for the clear button").to.be.gt(0);
    expect(b.left, `clear button left ${b.left} ≥ text area right ${contentRight}`).to.be.gte(contentRight - tolerance);
  });
};
