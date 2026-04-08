import { componentCommonSelectors } from "Selectors/appBuilder/components/common";
import {
  genralProperties,
  verifyDisability,
  verifyLoadingState,
  verifyVisibility,
} from "Support/utils/appBuilder/components/properties/common";
import {
  verifyRadioColor,
  verifyRadioLabel,
  verifyRadioMandatoryTextAndMark,
  verifyRadioSelection,
  verifyRadioButtonAlignment,
} from "Support/utils/appBuilder/components/properties/radioComponent";

describe("Radio Button Component - Feature Validation", { baseUrl: null }, () => {
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

  const componentSelector =
    '[data-cy="draggable-widget-radiobutton1"]';
  const labelInput = '[data-cy="draggable-widget-radiobuttonLabel"] input[type="text"]';
  const labelColorPicker =
    '[data-cy="draggable-widget-radiolabel_colorpicker"] .d-flex';
  const optionsTextColorPicker =
    '[data-cy="draggable-widget-optiontext_colorpicker"] .d-flex';
  const checkedBackgroundColorPicker =
    '[data-cy="draggable-widget-checked_colorpicker"] .d-flex';
  const uncheckedBackgroundColorPicker =
    '[data-cy="draggable-widget-unchecked_colorpicker"] .d-flex';
  const borderColorPicker =
    '[data-cy="draggable-widget-border_colorpicker"] .d-flex';
  const mandatorytoggle = '[data-cy="draggable-widget-mandatorytoggle"]';
  const mandatorytext = '[data-cy="draggable-widget-mandatorytext"]';
  const requiredIndicator = '[data-cy="radiobutton1-label"] p > span';
  const errorTextSelector = '.radio-button + div';
  const layoutDropdown = '[data-cy="draggable-widget-layoutdropdown"]';
  const alignmentoption = '[data-cy="draggable-widget-alignmentoption_dropdown"]';
  const alignmentlabel = '[data-cy="draggable-widget-alignmentlabel_dropdown"]';

  const appUrl =
    "https://marketplace-v3-lts-eetestsystem.tooljet.com/applications/0a3304ab-687f-40c3-a49c-14733fd7c7bf";

  const getOptionLabels = () =>
    cy.get(componentSelector).find('[data-cy*="-option-label-"]');

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

    verifyRadioMandatoryTextAndMark(
      componentSelector,
      mandatorytext,
      mandatorytoggle,
      [
        { input: "It is mandatory field" },
        { input: "This is required field" },
      ],
      requiredIndicator,
      errorTextSelector,
    );
  });

  it("should verify styles", () => {
    setup();

    verifyRadioLabel(componentSelector, labelInput, [
      { input: "Select" },
      { input: "Choose one" },
      { input: "Approval status" },
    ]);

    getOptionLabels().should("have.length.at.least", 2);

    verifyRadioColor(
      componentSelector,
      labelColorPicker,
      '[data-cy$="-label"] p, [data-cy$="-label"]',
      [
        { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
        { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
      ],
    );

    verifyRadioColor(
      componentSelector,
      optionsTextColorPicker,
      '[data-cy*="-option-label-"]',
      [
        { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
        { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
      ],
    );

    verifyRadioSelection(componentSelector);
    verifyRadioColor(
      componentSelector,
      checkedBackgroundColorPicker,
      'input[type="radio"]:checked + .checkmark',
      [
        { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
        { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
      ],
      "background-color",
    );

    verifyRadioSelection(componentSelector);
    verifyRadioColor(
      componentSelector,
      uncheckedBackgroundColorPicker,
      'input[type="radio"] + .checkmark',
      [
        { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
        { hex: "72ddeb", expectedColor: "rgb(114, 221, 235)" },
      ],
      "background-color",
    );

    verifyRadioColor(
      componentSelector,
      borderColorPicker,
      'input[type="radio"] + .checkmark',
      [
        { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
        { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
      ],
      "border-top-color",
    );

    verifyRadioButtonAlignment(componentSelector, layoutDropdown, [
      {
        label: "row",
        targetSelector: '.radio-button > .d-flex.px-0.h-100',
        expectedValue: "row",
      },
      {
        label: "column",
        targetSelector: '.radio-button > .d-flex.px-0.h-100',
        expectedValue: "column",
      },
      {
        label: "wrap",
        targetSelector: '.radio-button > .d-flex.px-0.h-100',
        cssProperty: "flex-wrap",
        expectedValue: "wrap",
      },
    ]);

    verifyRadioButtonAlignment(componentSelector, alignmentoption, [

      {
        label: "top",
        targetSelector: '.radio-button[role="radiogroup"]',
        cssProperty: "flex-direction",
        expectedValue: "column",
      },
      {
        label: "side",
        targetSelector: '.radio-button[role="radiogroup"]',
        cssProperty: "flex-direction",
        expectedValue: "row",
      },
    ]);

    verifyRadioButtonAlignment(componentSelector, alignmentlabel, [
      {
        label: "right",
        targetSelector: '[data-cy="radiobutton1-label"]',
        cssProperty: "justify-content",
        expectedValue: "flex-end",
      },
      {
        label: "left",
        targetSelector: '[data-cy="radiobutton1-label"]',
        cssProperty: "justify-content",
        expectedValue: "flex-start",
      },
    ]);
  });

  it("should verify events", () => {
    setup();
    verifyRadioSelection(componentSelector);
  });
});
