import {
    genralProperties,
    verifyDisability,
    verifyLoadingState,
    verifyVisibility,
} from "Support/utils/appBuilder/components/properties/common";
import { componentCommonSelectors } from "Selectors/appBuilder/components/common";
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

    const componentSelector = '[data-cy="draggable-widget-image1"]:eq(1)';
    const zoomToggle = '[data-cy="zoombutton"] input[type="checkbox"]';
    const rotateToggle = '[data-cy="rotatebutton"] input[type="checkbox"]';

    const appUrl =
        "https://appbuilder-v3-lts-eetestsystem.tooljet.com/applications/image-app-automation";
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

        verifyLoadingState(componentSelector, {
            csa: csaLoadingToggle,
            jsSet: jsLoadingToggle,
            jsReset: jsLoadingToggle,
        });

        verifyZoomFeature(componentSelector, zoomToggle);

        verifyRotateFeature(componentSelector, rotateToggle);
    });

    it("should verify styles", () => {
        setup();

        verifyImageFit(componentSelector, fitDropdown, imageFitOptions);

        verifyBorderType(componentSelector, shapeDropdown, borderTypeOptions);

        verifyImageLabel(componentSelector, labelInput, [
            { input: "50", styles: ["padding: 50px"] },
            { input: "100", styles: ["padding: 100px"] },
            { input: "200", styles: ["padding: 200px"] },
            { input: "0", styles: ["padding: 0px"] },
        ]);

        verifyImageBackgroundColor(componentSelector, colorPicker, [
            { hex: "ff0000", expectedBg: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedBg: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedBg: "rgb(0, 0, 255)" },
            { hex: "000000", expectedBg: "rgb(0, 0, 0)" },
        ]);

        verifyImageFitAndBorderType(
            componentSelector,
            fitDropdown,
            shapeDropdown,
            imageFitOptions,
            borderTypeOptions,
        );
    });

    it("should verify events", () => {
        setup();

        cy.get(componentSelector).click();
        cy.get('.go3958317564').should("have.text", "Image clicked");
    });
});
