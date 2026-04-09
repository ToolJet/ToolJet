import {
  genralProperties,
} from "Support/utils/appBuilder/components/properties/common";
import { componentCommonSelectors } from "Selectors/appBuilder/components/common";
import {
  verifyRadioColor,
  verifyRadioLabel,
  verifyRadioSelection,
} from "Support/utils/appBuilder/components/properties/radioComponent";

describe("Radio Button Legacy Component - Feature Validation", { baseUrl: null }, () => {
  const {
    desktopToggle,
    visibilityToggle,
    disableToogle,
  } = componentCommonSelectors;

  const componentSelector =
    '[data-cy="draggable-widget-radiobuttonlegacy1"]';
    const labelInput = '[data-cy="draggable-widget-radiobuttonLabel"] input[type="text"]';
  const textColorPicker =
    '[data-cy="draggable-widget-radiolabel_colorpicker"] .d-flex';
  const activeColorPicker =
    '[data-cy="draggable-widget-checked_colorpicker"] .d-flex';
    const options = '[data-cy="draggable-widget-optionstoggle"]';

  const appUrl =
    "https://marketplace-v3-lts-eetestsystem.tooljet.com/applications/2fddd2b8-a736-432f-9952-55b72cd9c4c7";

  const getOptionLabels = () =>
    cy.get(componentSelector).find('[data-cy*="-option-label-"]');

  const setup = () => {
    genralProperties(componentSelector, desktopToggle, { state: "exist" });
    genralProperties(componentSelector, visibilityToggle, {
      state: "be.visible",
    });
     genralProperties(componentSelector, options, { state: "exist" });
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
      assertClass: "disabled",
    });
  });

  it("should verify styles", () => {
    setup();

    verifyRadioLabel(componentSelector, labelInput, [
      { input: "Select" },
      { input: "Choose one" },
      { input: "Approval status" },
    ], "span");

    getOptionLabels().should("have.length.at.least", 2);

    verifyRadioColor(
      componentSelector,
      textColorPicker,
      '[data-cy$="-label"]',
      [
        { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
        { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
      ],
    );

    verifyRadioColor(
      componentSelector,
      textColorPicker,
      '[data-cy*="-option-label-"]',
      [
        { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
        { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
      ],
    );

    verifyRadioSelection(componentSelector, "Option selected successfully");
    verifyRadioColor(
      componentSelector,
      activeColorPicker,
      'input[type="radio"]:checked',
      [
        { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
        { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
      ],
      "background-color",
    );
  });

  it("should verify events", () => {
    setup();
    verifyRadioSelection(componentSelector, "Option selected successfully");
  });
});
