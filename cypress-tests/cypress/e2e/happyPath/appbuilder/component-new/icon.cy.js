import {
    genralProperties,
    verifyDisability,
    verifyLoadingState,
    verifyVisibility,
} from "Support/utils/appBuilder/components/properties/common";
import {
    verifyIconColor,
    verifyIconAlignment,
    verifyIconOnClick,
    verifyIconOnHover,
} from "Support/utils/appBuilder/components/properties/iconcomponent";

describe("Icon Component - Feature Validation", { baseUrl: null }, () => {
    const componentSelector = '[data-cy="draggable-widget-iconcomponent"]>';
    const desktopToggle = '[data-cy="desktoptoggle"] .d-flex';
    const visibilityToggle = '[data-cy="visibilitytoggle"] .d-flex';

    // JS action toggles (single toggle for set/reset)
    const jsVisibilityToggle = '[data-cy="jsvisibilitytoggle"] .d-flex';
    const jsDisableToggle = '[data-cy="jsdisabletoggle"] .d-flex';
    const jsLoadingToggle = '[data-cy="jsloadingtoggle"] .d-flex';

    // CSA toggles
    const csaVisibilityToggle = '[data-cy="csavisibletoggle"] .d-flex';
    const csaLoadingToggle = '[data-cy="csaloadingtoggle"] .d-flex';
    const csaDisableToggle = '[data-cy="csadisabletoggle"] .d-flex';

    // Icon-specific controls
    const colorPicker = '[data-cy="iconcolorpicker"]';
    const boxShadowColorPicker = '[data-cy="boxshadowcolorpicker"]';
    const alignmentDropdown = '[data-cy="alignmentdropdown-actionable-section"]';

    // Event trigger buttons
    const csaClickBtn = '[data-cy="csaclickbutton-button"]';
    const jsClickBtn = '[data-cy="jsiconclick-button"]';

    const appUrl =
        "https://appbuilder-v3-lts-eetestsystem.tooljet.com/applications/123c5160-2e06-40e8-a463-a6e0605a24a6";

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

        verifyLoadingState(componentSelector, {
            // toggle: jsLoadingToggle,
            csa: csaLoadingToggle,
            jsSet: jsLoadingToggle,
            jsReset: jsLoadingToggle,
        });
    });

    it("should verify icon color via color picker", () => {
        setup();

        verifyIconColor(componentSelector, colorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
            { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
        ]);
    });

    it("should verify icon alignment", () => {
        setup();

        verifyIconAlignment(componentSelector, alignmentDropdown, [
            { label: "Left", expectedAlign: "left" },
            { label: "Center", expectedAlign: "center" },
            { label: "Right", expectedAlign: "right" },
        ]);
    });

    it("should verify events on icon click, hover and action triggers using CSA and JS", () => {
        setup();
        verifyIconOnHover(
            componentSelector,
            ".go3958317564",
            "Hover"
        );
        cy.wait(1500);
        verifyIconOnClick(
            componentSelector,
            ".go3958317564",
            "Clicked",
        );

        cy.get('[data-cy="csaclickbutton-label"]').click();
        cy.verifyToastMessage('.go3958317564', 'Clicked');

        cy.get('[data-cy="jsiconclick-label"]').click();
        cy.verifyToastMessage('.go3958317564', 'Clicked', false);
    });

});
