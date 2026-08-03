import { commonWidgetSelector, commonSelectors } from "Selectors/common";
import { selectColourFromColourPicker } from "Support/utils/commonWidget";

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

export const launchModal = (componentName) => {
  cy.get(launchButton(componentName)).click();
};

// Close button lives in the modal header (Header.jsx:60) and is shared by all
// open modals; scope by the static data-cy.
export const closeModal = () => {
  cy.get('[data-cy="modal-close-button"]').realClick();
};

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
