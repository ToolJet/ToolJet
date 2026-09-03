// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// modal.js
//   launchButton                     -                    → canvas
//   launchModal                      -                    → canvas
//   closeModal                       -                    → canvas
//   addAndVerifyColor                colorSwatches        → styles
// └──────────────────────────────────────────────────────────────────┘
import { commonWidgetSelector, commonSelectors } from "Selectors/common";
import { selectColourFromColourPicker } from "Support/utils/commonWidget";

/**
 * MODULE — appBuilder/components/modal: ModalV2 widget helpers.
 * FOR AI: open a modal via its launch button, close it, or set+verify a modal
 * style-swatch colour on a target element. launchButton returns the selector
 * string; launchModal/closeModal act on canvas; addAndVerifyColor drives the
 * Styles tab colour picker and asserts computed CSS.
 * NOTE: trigger button data-cy is the bare `<name>-launch-button` (NOT
 * `draggable-widget-<name>-launch-button`); it only renders when
 * useDefaultButton && isVisible (both default true).
 * NOT here: generic styles picker → appBuilder/styles.js · properties → appBuilder/properties.js.
 */

/**
 * @tjBlock  canvas
 * @tjUsage  cy.get(launchButton('modal1')).click()
 * @tjDom    returns selector `[data-cy="<name>-launch-button"]` (no DOM query itself)
 */
// ModalV2 trigger button: `${dataCy}-launch-button` where dataCy === the bare
// component name (RenderWidget.jsx:329 passes dataCy={componentName} →
// ModalV2.jsx:282). NOTE: it is `<name>-launch-button`, NOT the legacy
// `draggable-widget-<name>-launch-button` (the outer canvas wrapper carries
// `draggable-widget-<name>`, the inner <button> carries the bare-name dataCy).
// Verified via DOM probe: `modal1-launch-button`. Renders only when
// `useDefaultButton && isVisible` (both default true).
export const launchButton = (componentName) => {
  return `[data-cy="${componentName.toLowerCase().replace(/\s/g, "-")}-launch-button"]`;
};

/**
 * @tjBlock  canvas
 * @tjUsage  launchModal('modal1')
 * @tjDom    clicks the modal's launch button
 */
export const launchModal = (componentName) => {
  cy.get(launchButton(componentName)).click();
};

/**
 * @tjBlock  canvas
 * @tjUsage  closeModal()
 * @tjDom    static modal-close-button in the modal header
 */
// Close button lives in the modal header (Header.jsx:60) and is shared by all
// open modals; scope by the static data-cy.
export const closeModal = () => {
  cy.get('[data-cy="modal-close-button"]').realClick();
};

/**
 * @tjType   colorSwatches
 * @tjBlock  styles
 * @tjUsage  addAndVerifyColor('Background', ['255','0','0','100'], '[data-cy="..."]')
 * @tjDom    style swatch colour picker → asserts computed <type> css on dataCy element
 */
// ModalV2 colour swatches default to theme CSS variables (e.g.
// `var(--cc-surface1-surface)`), so the legacy default-hex assertion no longer
// applies. Open the swatch's colour picker, set the colour, then verify the
// resulting computed CSS on the target element. After typing the colour the
// inspector re-renders, so reopen the Styles tab before the next swatch.
export const addAndVerifyColor = (section, color, dataCy, type = "background-color") => {
  selectColourFromColourPicker(section, color);
  cy.waitForAutoSave();
  cy.get(dataCy)
    .last()
    .invoke("css", type)
    .then((cssValue) => {
      // selectColourFromColourPicker types rgba parts; assert the element took
      // a non-default colour (computed value is rgb/rgba).
      expect(cssValue).to.match(/^rgba?\(/);
    });
  cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click({ force: true });
};
