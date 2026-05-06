import {
  genralProperties,
  verifyDisability,
  verifyLoadingState,
  verifyVisibility,
} from "Support/utils/appBuilder/components/properties/common";
import { componentCommonSelectors } from "Selectors/appBuilder/components/common";
import {
  verifyCheckboxClick,
  verifyCheckboxColor,
  verifyCheckboxCsaToggle,
  verifyCheckboxDefaultValue,
  verifyCheckboxLabel,
  verifyCheckboxMandatoryTextAndMark,
  verifyCheckboxSetValue,
  verifyCheckboxTooltip,
} from "Support/utils/appBuilder/components/properties/checkboxComponent";

describe("Checkbox Component - Feature Validation", { baseUrl: null }, () => {
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

  const componentSelector = '[data-cy="draggable-widget-checkbox1"]';
  const labelInput =
    '[data-cy="draggable-widget-label"] input[type="text"]';
  const tooltipInput =
    '[data-cy="draggable-widget-tooltip"] input[type="text"]';
  const mandatoryTextInput =
    '[data-cy="draggable-widget-mandatorytext"] input[type="text"]';
  const mandatoryToggle =
    '[data-cy="draggable-widget-mandatorytoggle"] input[type="checkbox"]';
  const defaultValueControl = '[data-cy="draggable-widget-defaultdropdown"]';
  const textColorPicker =
    '[data-cy="draggable-widget-text_colorpicker"] .d-flex';
  const csaSetValueToggle= '[data-cy="draggable-widget-csasetvaluetoggle"]';
  const csaToggle ='[data-cy="draggable-widget-csatoggle"]'


  const appUrl =
    "https://marketplace-v3-lts-eetestsystem.tooljet.com/applications/ccefffdd-ced9-41d2-97d1-4812f9b6feaf";

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

    verifyCheckboxMandatoryTextAndMark(
      componentSelector,
      mandatoryTextInput,
      mandatoryToggle,
      [
        { input: "This field is required" },
        { },
        { input: "Checkbox is mandatory" },
      ],
      '[data-cy="checkbox1-invalid-feedback"]',
    );

    verifyCheckboxSetValue(componentSelector, csaSetValueToggle);

    verifyCheckboxCsaToggle(componentSelector, csaToggle);
  });

  it("should verify styles", () => {
    setup();

    verifyCheckboxLabel(componentSelector, labelInput, [
      { input: "Checkbox label" },
      { input: "Accept terms" },
      { input: "Receive updates" },
    ]);

    verifyCheckboxTooltip(componentSelector, tooltipInput, [
      { input: "checkbox component" },
      { input: "enable or disable the selection" },
    ]);

    verifyCheckboxDefaultValue(componentSelector, defaultValueControl, [
      { label: "on", expectedChecked: true },
      { label: "off", expectedChecked: false },
    ]);

    verifyCheckboxColor("text", componentSelector, textColorPicker, [
      { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
      { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
    ]);
  });

  it("should verify events", () => {
    setup();
    verifyCheckboxClick(componentSelector);
  });
});
