import {
  genralProperties,
  verifyDisability,
  verifyLoadingState,
  verifyVisibility,
} from "Support/utils/appBuilder/components/properties/common";
import { componentCommonSelectors } from "Selectors/appBuilder/components/common";
import {
  verifyButtonText,
  verifyButtonTooltip,
  verifyButtonColor,
  verifyButtonBorderRadius,
  verifyButtonIconPosition,
  verifyButtonPadding,
} from "Support/utils/appBuilder/components/properties/buttonComponent";

describe("Button Component - Feature Validation", { baseUrl: null }, () => {
  const {
    desktopToggle,
    visibilityToggle,
    disableToogle,
    loadingToggle,
    jsVisibilityToggle,
    jsDisableToggle,
    jsLoadingToggle,
    csaVisibilityToggle,
    csaLoadingToggle,
    csaDisableToggle,
  } = componentCommonSelectors;

  const componentSelector = '[data-cy="draggable-widget-button1"]';

  // Button specific controls
  const labelInput =
    '[data-cy="draggable-widget-buttonText"] input[type="text"]';
  const tooltipInput =
    '[data-cy="draggable-widget-tooltip"] input[type="text"]';
  const bgColorPicker =
    '[data-cy="draggable-widget-background_colorpicker"] .d-flex';
  const textColorPicker =
    '[data-cy="draggable-widget-textColor_colorpicker"] .d-flex';
  const borderColorPicker =
    '[data-cy="draggable-widget-borderColor_colorpicker"] .d-flex';
  const loaderColorPicker =
    '[data-cy="draggable-widget-loaderColor_colorpicker"] .d-flex';
  const iconColorPicker =
    '[data-cy="draggable-widget-iconColor_colorpicker"] .d-flex';
  const borderRadiusInput =
    '[data-cy="draggable-widget-borderRadius"] input[type="number"]';
  const sizeDropdown =
    '[data-cy="draggable-widget-iconPosition"] .dropdown-widget';

  const toastSelector = ".go3958317564";

  const appUrl =
    "https://appbuilder-v3-lts-eetestsystem.tooljet.com/applications/f04e7d02-3b03-44d4-832e-c23035d109e8";

  const setup = () => {
    genralProperties(componentSelector, desktopToggle, { state: "exist" });
    genralProperties(componentSelector, visibilityToggle, {
      state: "be.visible",
    });
  };

  beforeEach(() => {
    cy.visit(appUrl);
    cy.viewport(1800, 1400);
  });

  it("should verify properties", () => {
    genralProperties(componentSelector, desktopToggle, { state: "exist" });

    verifyVisibility(componentSelector, {
      toggle: visibilityToggle,
      csa: csaVisibilityToggle,
      jsSet: jsVisibilityToggle,
      jsReset: jsVisibilityToggle,
    });

    verifyDisability(
      componentSelector,
      {
        csa: csaDisableToggle,
        jsSet: jsDisableToggle,
        jsReset: jsDisableToggle,
      },
      { assertClass: "disabled" },
    );

    verifyLoadingState(componentSelector, {
      csa: csaLoadingToggle,
      jsSet: jsLoadingToggle,
      jsReset: jsLoadingToggle,
    });
  });

  it("should verify styles", () => {
    setup();

    verifyButtonText(componentSelector, labelInput, [
      { input: "Submit" },
      { input: "Click Me" },
      { input: "Save" },
    ]);

    verifyButtonTooltip(componentSelector, tooltipInput, [
      { input: "button component" },
      { input: "primary action button" },
    ]);

    verifyButtonColor("background", componentSelector, bgColorPicker, [
      { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
      { hex: "00ff00", expectedBg: "rgb(0, 255, 0)" },
    ]);

    verifyButtonColor("text", componentSelector, textColorPicker, [
      { hex: "ffffff", expectedColor: "rgb(255, 255, 255)" },
      { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
    ]);

    verifyButtonColor("border", componentSelector, borderColorPicker, [
      { hex: "ff0000", expectedBg: "rgb(255, 0, 0)" },
      { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
    ]);

    genralProperties(componentSelector, loadingToggle, {
      state: "be.visible",
    });
    verifyButtonColor("loader", componentSelector, loaderColorPicker, [
      { hex: "ff0000", expectedBg: "rgb(255, 0, 0)" },
      { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
    ]);
    cy.get(loadingToggle).click();

    verifyButtonColor("icon", componentSelector, iconColorPicker, [
      { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
      { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
      { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
      { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
    ]);

    verifyButtonBorderRadius(componentSelector, borderRadiusInput, [
      { input: "0", expected: "0px" },
      { input: "4", expected: "4px" },
      { input: "50", expected: "50px" },
      { input: "100", expected: "100px" },
    ]);

    verifyButtonIconPosition(
      componentSelector,
      '[data-cy="draggable-widget-iconPosition"]',
      [
        { label: "left", expectedPosition: "left" },
        { label: "right", expectedPosition: "right" },
      ]
    );

    verifyButtonPadding(
      componentSelector,
      '[data-cy="draggable-widget-padding"]',
      [
        { label: "default", expectedPadding: "2px" },
        { label: "none", expectedPadding: "0px" },
      ]
    );
  });

  it("should verify events", () => {
    setup();

    cy.get(componentSelector).find("button").click();
    cy.verifyToastMessage(toastSelector, "button clicked", false);
  });
});
