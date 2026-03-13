import {
    genralProperties,
    verifyDisability,
    verifyLoadingState,
    verifyVisibility,
} from "Support/utils/appBuilder/components/properties/common";
import {
    verifyBorderType,
    verifyImageBackgroundColor,
    verifyImageFit,
    verifyImageFitAndBorderType,
    verifyImageLabel,
    verifyRotateFeature,
    verifyZoomFeature,
} from "Support/utils/appBuilder/components/properties/imageComponent";

describe("Image Component - Feature Validation", { baseUrl: null }, () => {
    const componentSelector = '[data-cy="draggable-widget-image1"]:eq(1)';
    const desktopToggle = '[data-cy="toggleswitch1"] .d-flex';
    const zoomToggle = '[data-cy="zoombutton"] input[type="checkbox"]';
    const rotateToggle = '[data-cy="rotatebutton"] input[type="checkbox"]';
    const visibilityToggle = '[data-cy="toggleswitch3"] .d-flex';
    const loadingState = '[data-cy="toggleswitch5"] .d-flex';

    // JS action toggles (single toggle for set/reset)
    const jsVisibilityToggle = '[data-cy="jsvisibilitytoggle"] .d-flex';
    const jsDisableToggle = '[data-cy="jsdisabletoggle"] .d-flex';
    const jsLoadingToggle = '[data-cy="jsloadingtoggle"] .d-flex';

    // CSA checkboxes/toggles
    const csaVisibilityToggle = '[data-cy="csavisibility"] .d-flex';
    const csaLoadingToggle = '[data-cy="csaloading"] .d-flex';
    const csaDisableToggle = '[data-cy="csadisable"] .d-flex';

    const appUrl =
        "https://appbuilder-v3-lts-eetestsystem.tooljet.com/applications/0196abdc-e11e-4333-b79e-92a57c3dd39d";

    const setup = () => {
        genralProperties(componentSelector, desktopToggle, { state: "exist" });
        genralProperties(componentSelector, visibilityToggle, {
            state: "be.visible",
        });
    };

    const fitDropdown =
        '[data-cy="draggable-widget-dropdown1"] > .dropdown-widget';
    const shapeDropdown =
        '[data-cy="draggable-widget-dropdown2"] > .dropdown-widget';
    const labelInput = '[data-cy="numberinput1-input"]';
    const colorPicker = '[data-cy="colorpicker1"]>.d-flex';

    const imageFitOptions = [
        { label: "Contain", value: "contain" },
        { label: "Fill", value: "fill" },
        { label: "Cover", value: "cover" },
        { label: "Scale Down", value: "scale-down" },
        { label: "None", value: "none" },
    ];

    const borderTypeOptions = [
        { label: "None", css: { "border-radius": "0px" } },
        { label: "Rounded", css: { "border-radius": "4px" } },
        { label: "Circle", css: { "border-radius": "50%" } },
        { label: "Thumbnail", css: { "border-radius": "4px" } },
    ];

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
            toggle: loadingState,
            csa: csaLoadingToggle,
            jsSet: jsLoadingToggle,
            jsReset: jsLoadingToggle,
        });
    });

    it("should verify zoom feature", () => {
        setup();

        verifyZoomFeature(componentSelector, zoomToggle);
    });

    it("should verify rotate feature", () => {
        setup();

        verifyRotateFeature(componentSelector, rotateToggle);
    });

    it("should verify image fit options", () => {
        setup();

        verifyImageFit(componentSelector, fitDropdown, imageFitOptions);
    });

    it("should verify border type options", () => {
        setup();

        verifyBorderType(componentSelector, shapeDropdown, borderTypeOptions);
    });

    it("should verify label (padding) options", () => {
        setup();

        verifyImageLabel(componentSelector, labelInput, [
            { input: "50", styles: ["padding: 50px"] },
            { input: "100", styles: ["padding: 100px"] },
            { input: "200", styles: ["padding: 200px"] },
            { input: "0", styles: ["padding: 0px"] },
        ]);
    });

    it("should verify image fit and border type combination", () => {
        setup();

        verifyImageFitAndBorderType(
            componentSelector,
            fitDropdown,
            shapeDropdown,
            imageFitOptions,
            borderTypeOptions,
        );
    });

    it("should verify background color via color picker", () => {
        setup();

        verifyImageBackgroundColor(componentSelector, colorPicker, [
            { hex: "ff0000", expectedBg: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedBg: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedBg: "rgb(0, 0, 255)" },
            { hex: "000000", expectedBg: "rgb(0, 0, 0)" },
        ]);
    });

    it("should verify event on image click", () => {
        setup();

        cy.get(componentSelector).click();
        cy.get('.go3958317564').should("have.text", "Image clicked");
    });
});
