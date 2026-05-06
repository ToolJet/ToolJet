import { genralProperties } from "Support/utils/appBuilder/components/properties/common";
import { componentCommonSelectors } from "Selectors/appBuilder/components/common";
import {
  verifyLegacyDropdownAdvancedOptions,
  verifyLegacyDropdownAlignment,
  verifyLegacyDropdownBorderRadius,
  verifyLegacyDropdownCsaSelection,
  verifyLegacyDropdownDefaultValue,
  verifyLegacyDropdownDisabled,
  verifyLegacyDropdownInvalidFeedback,
  verifyLegacyDropdownLabel,
  verifyLegacyDropdownLoading,
  verifyLegacyDropdownSelection,
  verifyLegacyDropdownTextColor,
  verifyLegacyDropdownTooltip,
} from "Support/utils/appBuilder/components/properties/dropdownLegacyComponent";

describe("Dropdown Legacy Component - Feature Validation", { baseUrl: null }, () => {
  const {
    desktopToggle,
    visibilityToggle,
    disableToogle,
    loadingToggle,
  } = componentCommonSelectors;

  const componentSelector = '[data-cy="draggable-widget-dropdownlegacy1"]';

  const labelInput =
    '[data-cy="draggable-widget-label"] input[type="text"]';
  const tooltipInput =
    '[data-cy="draggable-widget-tooltip"] input[type="text"]';
  const textColorPicker =
    '[data-cy="draggable-widget-text_colorpicker"] .d-flex';
  const mandatoryTextInput =
    '[data-cy="draggable-widget-mandatorytext"] input[type="text"]';
  const borderRadiusInput =
    '[data-cy="draggable-widget-border_radius"] input[type="number"]';
  const alignmentControl =
    '[data-cy="draggable-widget-alignmentlabel_dropdown"]';
  const advanceToggle =
    '[data-cy="draggable-widget-advancetoggle"]';
  const csaSelectOptionToggle =
    '[data-cy="draggable-widget-csaselectoption"]';

  const appUrl =
    "https://marketplace-v3-lts-eetestsystem.tooljet.com/applications/aee34cb0-1e2e-4324-8a40-5f70f33ac8df";

  const setup = () => {
    genralProperties(componentSelector, desktopToggle, { state: "exist" });
    genralProperties(componentSelector, visibilityToggle, {
      state: "be.visible",
    });
    verifyLegacyDropdownDefaultValue(componentSelector, "two");
  };

  beforeEach(() => {
    cy.visit(appUrl);
    cy.viewport(1800, 1400);
  });

  it("should verify properties", () => {
    genralProperties(componentSelector, desktopToggle, { state: "exist" });

    genralProperties(componentSelector, visibilityToggle, {
      state: "be.visible",
    });

    genralProperties(componentSelector, visibilityToggle, {
      state: "not.be.visible",
    });

    genralProperties(componentSelector, visibilityToggle, {
      state: "be.visible",
    });

    verifyLegacyDropdownDisabled(componentSelector, disableToogle);
    verifyLegacyDropdownLoading(componentSelector, loadingToggle);
    verifyLegacyDropdownCsaSelection(
      componentSelector,
      csaSelectOptionToggle,
      "two"
    );
  });

  it("should verify styles", () => {
    setup();

    verifyLegacyDropdownLabel(componentSelector, labelInput, [
      { input: "Select" },
      { input: "Choose option" },
      { input: "Select status" },
    ]);

    verifyLegacyDropdownTooltip(componentSelector, tooltipInput, [
      { input: "Dropdown legacy component" },
      { input: "Select an option from the list" },
    ]);

    verifyLegacyDropdownInvalidFeedback(componentSelector, mandatoryTextInput, [
      { input: "This field is required", triggerOption: "one" },
      { input: "Please select an option", triggerOption: "three" },
    ]);

    verifyLegacyDropdownTextColor(componentSelector, textColorPicker, [
      { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
      { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
    ]);

    verifyLegacyDropdownAlignment(componentSelector, alignmentControl, [
      { label: "left", expectedValue: "left" },
      { label: "center", expectedValue: "center" },
      { label: "right", expectedValue: "right" },
    ]);

    verifyLegacyDropdownBorderRadius(componentSelector, borderRadiusInput, [
      { input: 4, expectedValue: "4px" },
      { input: 12, expectedValue: "12px" },
    ]);
  });

  it("should verify advanced options", () => {
    setup();

    verifyLegacyDropdownAdvancedOptions(componentSelector, advanceToggle, [
      { label: "Advance one", disable: false, visible: true },
      { label: "Advance two", disable: false, visible: true },
      { label: "Advance three", disable: false, visible: true },
    ]);
  });

  it("should verify events", () => {
    setup();

    verifyLegacyDropdownSelection(
      componentSelector,
      [{ label: "one" }, { label: "three" }],
      "Option selected successfully"
    );
  });
});
