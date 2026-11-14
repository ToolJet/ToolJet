import {
    genralProperties,
    verifyDisability,
    verifyLoadingState,
    verifyVisibility,
} from "Support/utils/appBuilder/components/properties/common";
import { componentCommonSelectors } from "Selectors/appBuilder/components/common";
import {
    verifyIconColor,
    verifyIconAlignment,
    verifyIconOnClick,
    verifyIconOnHover,
} from "Support/utils/appBuilder/components/properties/iconComponent";

describe("Icon Component - Feature Validation", { baseUrl: null }, () => {
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

    const componentSelector = '[data-cy="draggable-widget-iconcomponent"]>';

    // Icon-specific controls
    const colorPicker = '[data-cy="iconcolorpicker"]';
    const alignmentDropdown = '[data-cy="alignmentdropdown-actionable-section"]';

    const appUrl ="https://appbuilder-v3-lts-eetestsystem.tooljet.com/applications/icon-automation"

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

        verifyLoadingState(componentSelector, {
            csa: csaLoadingToggle,
            jsSet: jsLoadingToggle,
            jsReset: jsLoadingToggle,
        });
    });

    it("should verify styles", () => {
        setup();

        verifyIconColor(componentSelector, colorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
            { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
        ]);

        verifyIconAlignment(componentSelector, alignmentDropdown, [
            { label: "Left", expectedAlign: "left" },
            { label: "Center", expectedAlign: "center" },
            { label: "Right", expectedAlign: "right" },
        ]);
    });

    it("should verify events", () => {
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
