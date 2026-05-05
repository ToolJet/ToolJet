import {
  genralProperties,
  verifyDisability,
  verifyLoadingState,
  verifyVisibility,
} from "Support/utils/appBuilder/components/properties/common";
import { componentCommonSelectors } from "Selectors/appBuilder/components/common";
import {
  verifyDropdownAlignment,
  verifyDropdownColor,
  verifyDropdownCsaClear,
  verifyDropdownClearSelection,
  verifyDropdownDefaultState,
  verifyDropdownDynamicOptions,
  verifyDropdownLabel,
  verifyDropdownMandatoryTextAndMark,
  verifyDropdownPadding,
  verifyDropdownSearchOption,
  verifyDropdownSelection,
  verifyDropdownTooltip,
  ensureDropdownCleared,
} from "Support/utils/appBuilder/components/properties/dropdownComponent";

describe("Dropdown Component - Feature Validation", { baseUrl: null }, () => {
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

  const componentSelector = '[data-cy="draggable-widget-dropdown1"]';

  // Property controls
  const labelInput =
    '[data-cy="draggable-widget-label"] input[type="text"]';
  const tooltipInput =
    '[data-cy="draggable-widget-tooltip"] input[type="text"]';
  const mandatoryTextInput =
    '[data-cy="draggable-widget-mandatorytext"] input[type="text"]';
  const mandatoryToggle =
    '[data-cy="draggable-widget-mandatorytoggle"] input[type="checkbox"]';
  const clearSelectionToggle =
    '[data-cy="draggable-widget-clearselection"]';
  const searchOptionToggle =
    '[data-cy="draggable-widget-searchoptiontoggle"]';
  const dynamicOptionsToggle =
    '[data-cy="draggable-widget-dynamicoptionstoggle"]';
  const defaultStateControl =
    '[data-cy="draggable-widget-defaultstate"]';

  // Style color pickers
  const textColorPicker =
    '[data-cy="draggable-widget-text_colorpicker"] .d-flex';
  const borderColorPicker =
    '[data-cy="draggable-widget-border_colorpicker"] .d-flex';
  const backgroundColorPicker =
    '[data-cy="draggable-widget-background_colorpicker"] .d-flex';
  const accentColorPicker =
    '[data-cy="draggable-widget-accent_colorpicker"] .d-flex';
  const handleColorPicker =
    '[data-cy="draggable-widget-handlecolor_colorpicker"] .d-flex';
  const placeholderTextColorPicker =
    '[data-cy="draggable-widget-placeholdertext_colorpicker"] .d-flex';
  const errorTextColorPicker =
    '[data-cy="draggable-widget-errortext_colorpicker"] .d-flex';
  const iconColorPicker =
    '[data-cy="draggable-widget-icon_colorpicker"] .d-flex';

  // Alignment and padding controls
  const alignmentControl = '[data-cy="draggable-widget-alignmentlabel_dropdown"]';
  const paddingControl = '[data-cy="draggable-widget-padding_dropdown"]';

  // CSA-clear
  const csaClearToggle = '[data-cy="csasetvaluetoggle"] .d-flex';

  const appUrl = "https://marketplace-v3-lts-eetestsystem.tooljet.com/applications/eec970d2-83bd-44a8-bea7-5bd6c19c5059";

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

    verifyDropdownMandatoryTextAndMark(
      componentSelector,
      mandatoryTextInput,
      mandatoryToggle,
      [
        { input: "This field is required" },
        {},
        { input: "Please select an option" },
      ],
      '[data-cy="draggable-widget-dropdown1"] > div:nth-child(2)',
    );

    verifyDropdownCsaClear(componentSelector, csaClearToggle);

      verifyDropdownClearSelection(componentSelector, clearSelectionToggle);
  });

  it("should verify styles", () => {
    setup();

    verifyDropdownLabel(componentSelector, labelInput, [
      { input: "Select" },
      { input: "Choose option" },
      { input: "Select status" },
    ]);

    verifyDropdownTooltip(componentSelector, tooltipInput, [
      { input: "Dropdown component" },
      { input: "Select an option from the list" },
    ]);

    verifyDropdownColor("text", componentSelector, textColorPicker, [
      { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
      { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
    ]);

    verifyDropdownColor("border", componentSelector, borderColorPicker, [
      { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
      { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
    ]);

    verifyDropdownColor("background", componentSelector, backgroundColorPicker, [
      { hex: "f5f5f5", expectedColor: "rgb(245, 245, 245)" },
      { hex: "ffffff", expectedColor: "rgb(255, 255, 255)" },
    ]);

    ensureDropdownCleared(componentSelector)

    verifyDropdownColor(
      "placeholderText",
      componentSelector,
      placeholderTextColorPicker,
      [
        { hex: "999999", expectedColor: "rgb(153, 153, 153)" },
        { hex: "6a727c", expectedColor: "rgb(106, 114, 124)" },
      ],
    );
    
    verifyDropdownAlignment(componentSelector, alignmentControl, [
      {
        label: "side",
        targetSelector: ".dropdown-widget",
        cssProperty: "flex-direction",
        expectedValue: "row",
      },
      {
        label: "top",
        targetSelector: ".dropdown-widget",
        cssProperty: "flex-direction",
        expectedValue: "column",
      },
    ]);

    verifyDropdownPadding(componentSelector, paddingControl, [
      { label: "default", cssProperty: "height", expectedValue: "56px" },
      { label: "none", cssProperty: "height", expectedValue: "60px" },
    ]);

    verifyDropdownSearchOption(componentSelector, searchOptionToggle, "option1");
  });

  it("should verify dynamic options", () => {
    setup();
    verifyDropdownDynamicOptions(
      componentSelector,
      dynamicOptionsToggle,
      [
        { label: "Dybamic_option 1", value: "1", disable: false, visible: true },
        { label: "Option 2", value: "2", disable: false, visible: true },
        { label: "Option 3", value: "3", disable: true, visible: true },
      ],
    );
  });

  it("should verify events", () => {
    setup();
    verifyDropdownSelection(
      componentSelector,
      [{ label: "option1" }, { label: "option2" }],
      "Option selected successfully",
    );
  });
});
