import {
    genralProperties,
    verifyDisability,
    verifyLoadingState,
    verifyVisibility,
} from "Support/utils/appBuilder/components/properties/common";
import {
    verifyButtonGroupLayout,
    verifyButtonGroupAlignment,
    verifyLabelAlignment,
    verifySelectedButtonBgColor,
    verifySelectedButtonTextColor,
    verifyUnselectedButtonBgColor,
    verifyUnselectedButtonTextColor,
    verifyButtonBorderColor,
    verifyBoxShadowColor,
    verifyLabelColor,
    verifyBorderRadius,
    verifyButtonSelection,
    verifyMultipleSelect,
    verifyClearSelectedOptions,
} from "Support/utils/appBuilder/components/properties/buttonGroupComponent";

describe("Button Group Component - Feature Validation", { baseUrl: null }, () => {
    const componentSelector = '[data-cy="buttongroup"]';
    const wrapperSelector = '[data-cy="draggable-widget-buttongroup"]';
    const desktopToggle = '[data-cy="desktoptoggle"] .d-flex';
    const visibilityToggle = '[data-cy="visibilitytoggle"] .d-flex';
    const loadingToggle = '[data-cy="loadingtoggle"] .d-flex';

    // JS action toggles (single toggle for set/reset)
    const jsVisibilityToggle = '[data-cy="jsvisibilitytoggle"] .d-flex';
    const jsDisableToggle = '[data-cy="jsdisabletoggle"] .d-flex';
    const jsLoadingToggle = '[data-cy="jsloadingtoggle"] .d-flex';

    // CSA toggles
    const csaVisibilityToggle = '[data-cy="csavisibility"] .d-flex';
    const csaLoadingToggle = '[data-cy="csaloading"] .d-flex';
    const csaDisableToggle = '[data-cy="csadisable"] .d-flex';

    // CSA / JS action buttons
    const csaClearBtn = '[data-cy="setimage-label"]';
    const jsLinkClickBtn = '[data-cy="js_link_click-label"]';

    // Feature controls
    const multipleSelectToggle = '[data-cy="multiple_select_toggleswitch"] .d-flex';
    const buttonAlignmentDropdown = '[data-cy="button_allignment_dropdown-actionable-section"]';
    const layoutDropdown = '[data-cy="layout_dropdown-actionable-section"]';
    const labelAlignmentDropdown = '[data-cy="label_allignment_dropdown-actionable-section"]';
    const borderRadiusInput = '[data-cy="border_radius_input-input"]';

    // Color pickers
    const selectedBtnBgColorPicker = '[data-cy="selected_btn_bg_colorpicker"]>.d-flex';
    const selectedBtnTextColorPicker = '[data-cy="selected_btn_text_colorpicker"]>.d-flex';
    const buttonBgColorPicker = '[data-cy="button_background_colorpicker"]>.d-flex';
    const buttonTextColorPicker = '[data-cy="button_text_colorpicker"]>.d-flex';
    const buttonBorderColorPicker = '[data-cy="button_border_colorpicker"]>.d-flex';
    const boxShadowColorPicker = '[data-cy="boxshadow_colorpicker"]>.d-flex';
    const labelColorPicker = '[data-cy="label_colorpicker"]>.d-flex';

    const toastSelector = '.go3958317564';

    const appUrl =
        "https://appbuilder-v3-lts-eetestsystem.tooljet.com/applications/button-group-automation";

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

    it("should verify visibility, disable, and loading states", () => {
        genralProperties(componentSelector, desktopToggle, { state: "exist" });

        verifyVisibility(componentSelector, {
            toggle: visibilityToggle,
            csa: csaVisibilityToggle,
            jsSet: jsVisibilityToggle,
            jsReset: jsVisibilityToggle,
        });

        verifyDisability(componentSelector, {
            csa: csaDisableToggle,
            jsSet: jsDisableToggle,
            jsReset: jsDisableToggle,
        });

        verifyLoadingState(wrapperSelector, {
            toggle: loadingToggle,
            csa: csaLoadingToggle,
            jsSet: jsLoadingToggle,
            jsReset: jsLoadingToggle,
        });
    });

    it("should verify button group layout options", () => {
        setup();

        verifyButtonGroupLayout(componentSelector, layoutDropdown, [
            { label: "Column", expectedFlexDir: "column" },
            { label: "Row", expectedFlexDir: "row" },
            { label: "Wrap", expectedFlexDir: "row" },
            { label: "Row", expectedFlexDir: "row" },
        ]);
    });

    it("should verify button group alignment options", () => {
        setup();

        verifyButtonGroupAlignment(componentSelector, buttonAlignmentDropdown, [
            { label: "Left", expectedJustify: "start" },
            { label: "Center", expectedJustify: "center" },
            { label: "Right", expectedJustify: "end" },
            { label: "Center", expectedJustify: "center" },
        ]);
    });

    it("should verify label alignment options", () => {
        setup();

        verifyLabelAlignment(componentSelector, labelAlignmentDropdown, [
            { label: "Top", expectedFlexDir: "column" },
            { label: "Side", expectedFlexDir: "row" },
        ]);
    });

    it("should verify selected button background color via color picker", () => {
        setup();

        verifySelectedButtonBgColor(componentSelector, selectedBtnBgColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
            { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
        ]);
    });

    it("should verify selected button text color via color picker", () => {
        setup();

        verifySelectedButtonTextColor(componentSelector, selectedBtnTextColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "ffffff", expectedColor: "rgb(255, 255, 255)" },
            { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
        ]);
    });

    it("should verify unselected button background color via color picker", () => {
        setup();

        verifyUnselectedButtonBgColor(componentSelector, buttonBgColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
            { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
        ]);
    });

    it("should verify unselected button text color via color picker", () => {
        setup();

        verifyUnselectedButtonTextColor(componentSelector, buttonTextColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "ffffff", expectedColor: "rgb(255, 255, 255)" },
            { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
        ]);
    });

    it("should verify button border color via color picker", () => {
        setup();

        verifyButtonBorderColor(componentSelector, buttonBorderColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
        ]);
    });

    it("should verify box shadow color via color picker", () => {
        setup();

        verifyBoxShadowColor(componentSelector, boxShadowColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
        ]);
    });

    it("should verify label color via color picker", () => {
        setup();

        verifyLabelColor(componentSelector, labelColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
        ]);
    });

    it("should verify border radius input", () => {
        setup();

        verifyBorderRadius(componentSelector, borderRadiusInput, [
            { input: "20", expectedRadius: "20px" },
            { input: "0", expectedRadius: "0px" },
            { input: "50", expectedRadius: "50px" },
            { input: "10", expectedRadius: "10px" },
        ]);
    });

    it("should verify single button selection", () => {
        setup();

        verifyButtonSelection(componentSelector);
    });

    it("should verify multiple select toggle", () => {
        setup();

        verifyMultipleSelect(componentSelector, multipleSelectToggle);
    });

    it("should verify CSA clear selected options", () => {
        setup();

        verifyClearSelectedOptions(componentSelector, csaClearBtn);
    });

    it("should verify JS link click event triggers toast", () => {
        setup();

        // Click a button in the group first to register an interaction
        cy.get(componentSelector).find('[data-cy="buttongroup-button-1"]').click();
        cy.verifyToastMessage(toastSelector, "Button group clicked", false);
        // Now trigger the JS action click and verify toast appears again
        cy.get(jsLinkClickBtn).click();
        cy.verifyToastMessage(toastSelector, "Button group clicked", false);
    });

    it("should verify button group button click triggers toast", () => {
        setup();

        cy.get(componentSelector).find('[data-cy="buttongroup-button-1"]').click();
        cy.verifyToastMessage(toastSelector, "Button group clicked", false);
    });
});
