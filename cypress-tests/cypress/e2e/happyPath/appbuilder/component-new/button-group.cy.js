import {
    genralProperties,
    verifyDisability,
    verifyLoadingState,
    verifyVisibility,
} from "Support/utils/appBuilder/components/properties/common";
import { componentCommonSelectors } from "Selectors/appBuilder/components/common";
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

    const componentSelector = '[data-cy="buttongroup"]';
    const wrapperSelector = '[data-cy="draggable-widget-buttongroup"]';

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

    it("should verify properties", () => {
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
            csa: csaLoadingToggle,
            jsSet: jsLoadingToggle,
            jsReset: jsLoadingToggle,
        });

        verifyButtonSelection(componentSelector);
        cy.wait(1000)
        verifyMultipleSelect(componentSelector, multipleSelectToggle);

        verifyClearSelectedOptions(componentSelector, csaClearBtn);
    });

    it("should verify styles", () => {
        setup();

        // Ensure button-0 is selected before color picker tests
        cy.get(componentSelector).find('[data-cy="buttongroup-button-0"]').click();

        verifyButtonGroupLayout(componentSelector, layoutDropdown, [
            { label: "Column", expectedFlexDir: "column" },
            { label: "Row", expectedFlexDir: "row" },
            { label: "Wrap", expectedFlexDir: "row" },
            { label: "Row", expectedFlexDir: "row" },
        ]);

        verifyButtonGroupAlignment(componentSelector, buttonAlignmentDropdown, [
            { label: "Left", expectedJustify: "start" },
            { label: "Center", expectedJustify: "center" },
            { label: "Right", expectedJustify: "end" },
            { label: "Center", expectedJustify: "center" },
        ]);

        verifyLabelAlignment(componentSelector, labelAlignmentDropdown, [
            { label: "Top", expectedFlexDir: "column" },
            { label: "Side", expectedFlexDir: "row" },
        ]);

        cy.get(componentSelector).find('[data-cy="buttongroup-button-0"]').click();

        verifySelectedButtonBgColor(componentSelector, selectedBtnBgColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
            { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
        ]);

        verifySelectedButtonTextColor(componentSelector, selectedBtnTextColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "ffffff", expectedColor: "rgb(255, 255, 255)" },
            { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
        ]);

        verifyUnselectedButtonBgColor(componentSelector, buttonBgColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
            { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
        ]);

        verifyUnselectedButtonTextColor(componentSelector, buttonTextColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "ffffff", expectedColor: "rgb(255, 255, 255)" },
            { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
        ]);

        verifyButtonBorderColor(componentSelector, buttonBorderColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
        ]);

        verifyBoxShadowColor(componentSelector, boxShadowColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
        ]);

        verifyLabelColor(componentSelector, labelColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
        ]);

        verifyBorderRadius(componentSelector, borderRadiusInput, [
            { input: "20", expectedRadius: "20px" },
            { input: "0", expectedRadius: "0px" },
            { input: "50", expectedRadius: "50px" },
            { input: "10", expectedRadius: "10px" },
        ]);
    });

    it("should verify events", () => {
        setup();

        cy.get(componentSelector).find('[data-cy="buttongroup-button-1"]').click();
        cy.verifyToastMessage(toastSelector, "Button group clicked", false);

        cy.get(jsLinkClickBtn).click();
        cy.verifyToastMessage(toastSelector, "Button group clicked", false);
    });
});
