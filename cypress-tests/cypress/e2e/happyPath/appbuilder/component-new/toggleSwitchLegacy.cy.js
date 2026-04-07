import {
  genralProperties,
} from "Support/utils/appBuilder/components/properties/common";
import { componentCommonSelectors } from "Selectors/appBuilder/components/common";
import {
  verifyToggleDefaultValue,
  verifyToggleSwitchClick,
  verifyToggleSwitchColor,
  verifyToggleSwitchLabel,
} from "Support/utils/appBuilder/components/properties/toggleSwitchComponent";

describe("Toggle Switch Legacy Component - Feature Validation", { baseUrl: null }, () => {
  const {
    desktopToggle,
    visibilityToggle,
    disableToogle,
  } = componentCommonSelectors;

  const componentSelector =
    '[data-cy="draggable-widget-toggleswitchlegacy1"]';
  const labelInput =
    '[data-cy="draggable-widget-toggleswitchtext"] input[type="text"]';
  const defaultValueToggle =
    '[data-cy="draggable-widget-defaultvalue"] input[type="checkbox"]';
  const textColorPicker =
    '[data-cy="draggable-widget-textColor_colorpicker"] .d-flex';
  const toggleSwitchColorPicker =
    '[data-cy="draggable-widget-toggleswitchcolor_colorpicker"] .d-flex';

  const appUrl =
    "https://marketplace-v3-lts-eetestsystem.tooljet.com/applications/89c970e7-8f33-45b4-b226-45f0e05251be";

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

    genralProperties(componentSelector, visibilityToggle, {
      state: "be.visible",
    });
    
    genralProperties(componentSelector, visibilityToggle, {
      state: "not.be.visible",
    });

    genralProperties(componentSelector, visibilityToggle, {
      state: "be.visible",
    });

    genralProperties(componentSelector, disableToogle, {
       assertClass: "disabled" 
    });
  });

  it("should verify styles", () => {
    setup();

    verifyToggleDefaultValue(componentSelector, defaultValueToggle, [
      {
        label: "on",
        expectedInputColor: "rgb(67, 104, 227)",
      },
      { label: "off" },
    ]);

    verifyToggleSwitchLabel(componentSelector, labelInput, [
      { input: "Toggle label" },
      { input: "Notifications" },
      { input: "Enable alerts" },
    ], "span");

    verifyToggleSwitchColor("text", componentSelector, textColorPicker, [
      { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
      { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
    ], "span");

    verifyToggleSwitchColor("toggleswitch", componentSelector, toggleSwitchColorPicker, [
      { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
      { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
    ]);
  });

  it("should verify events", () => {
    setup();
    verifyToggleSwitchClick(componentSelector);
  });
});
