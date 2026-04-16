import {
  genralProperties,
  verifyDisability,
  verifyLoadingState,
  verifyVisibility,
} from "Support/utils/appBuilder/components/properties/common";
import { componentCommonSelectors } from "Selectors/appBuilder/components/common";
import {
  verifyToggleSwitchAlignment,
  verifyToggleDefaultValue,
  verifyToggleSwitchClick,
  verifyToggleSwitchColor,
  verifyToggleSwitchLabel,
  verifyToggleSwitchTooltip,
} from "Support/utils/appBuilder/components/properties/toggleSwitchComponent";

describe("Toggle Switch Component - Feature Validation", { baseUrl: null }, () => {
  const {
    desktopToggle,
    visibilityToggle,
    jsVisibilityToggle,
    jsDisableToggle,
    jsLoadingToggle,
    csaVisibilityToggle,
    csaLoadingToggle,
    csaDisableToggle,
  } = componentCommonSelectors;

  const componentSelector = '[data-cy="draggable-widget-toggleswitch"]';
  const labelInput =
    '[data-cy="draggable-widget-toggleswitchText"] input[type="text"]';
  const tooltipInput =
    '[data-cy="draggable-widget-tooltip"] input[type="text"]';
  const textColorPicker =
    '[data-cy="draggable-widget-textColor_colorpicker"] .d-flex';
  const borderColorPicker =
    '[data-cy="draggable-widget-borderColor_colorpicker"] .d-flex';
  const checkedColorPicker =
    '[data-cy="draggable-widget-checked_colorpicker"] .d-flex';
  const uncheckedColorPicker =
    '[data-cy="draggable-widget-unchecked_colorpicker"] .d-flex';
  const handleColorPicker =
    '[data-cy="draggable-widget-handle_colorpicker"] .d-flex';
  const alignmentDropdown = '[data-cy="draggable-widget-alignment"]';
  const defaultvalueDropdown = '[data-cy="draggable-widget-defaultvalue"]';

  const appUrl =
    "https://appbuilder-v3-lts-eetestsystem.tooljet.com/applications/8bb55540-a1d0-445f-bfe8-94dbf48487d8";

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

    verifyToggleSwitchLabel(componentSelector, labelInput, [
      { input: "Toggle label" },
      { input: "Notifications" },
      { input: "Enable alerts" },
    ]);

    verifyToggleSwitchTooltip(componentSelector, tooltipInput, [
      { input: "toggle switch component" },
      { input: "enable or disable the workflow" },
    ]);

    verifyToggleSwitchColor("text", componentSelector, textColorPicker, [
      { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
      { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
    ]);

    verifyToggleSwitchColor("border", componentSelector, borderColorPicker, [
      { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
      { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
    ]);

    verifyToggleDefaultValue(componentSelector, defaultvalueDropdown, [
      { label: "on" },
      { label: "off" },
    ]);

    verifyToggleSwitchColor("checked", componentSelector, checkedColorPicker, [
      { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
      { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
    ]);

    verifyToggleSwitchColor("unchecked", componentSelector, uncheckedColorPicker, [
      { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
      { hex: "72ddeb", expectedColor: "rgb(114, 221, 235)" },
    ]);

    verifyToggleSwitchColor("handle", componentSelector, handleColorPicker, [
      { hex: "ffffff", expectedColor: "rgb(255, 255, 255)" },
      { hex: "60c50e", expectedColor: "rgb(96, 197, 14)" },
    ]);

    verifyToggleSwitchAlignment(componentSelector, alignmentDropdown, [
      { label: "right", expectedClass: "flex-row-reverse" },
      { label: "left", expectedClass: "flex-row" },
    ]);
  });

  it("should verify events", () => {
    setup();
    verifyToggleSwitchClick(componentSelector, "Toggleswitch value updated");
  });
});
