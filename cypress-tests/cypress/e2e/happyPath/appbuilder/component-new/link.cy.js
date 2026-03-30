import {
    genralProperties,
    verifyLoadingState,
    verifyVisibility,
    verifyOnHover,
} from "Support/utils/appBuilder/components/properties/common";
import { componentCommonSelectors } from "Selectors/appBuilder/components/common";
import {
    verifyLinkAlignment,
    verifyLinkFontSize,
    verifyLinkBoxShadowColor,
    verifyLinkTargetType,
    verifyLinkUnderline,
    verifyLinkIcon,
    verifyLinkCSASetTarget,
    verifyLinkCSASetText,
} from "Support/utils/appBuilder/components/properties/linkComponent";

describe("Link Component - Feature Validation", { baseUrl: null }, () => {
    const {
        desktopToggle,
        visibilityToggle,
        jsVisibilityToggle,
        jsLoadingToggle,
        csaVisibilityToggle,
        csaLoadingToggle,
    } = componentCommonSelectors;

    const componentSelector = '[data-cy="link"]';
    const wrapperSelector = '[data-cy="draggable-widget-link"]';

    // JS action buttons
    const jsLinkClickBtn = '[data-cy="js_link_click-label"]';

    // CSA action buttons
    const csaLinkClickBtn = '[data-cy="setimage-label"]';
    const csaSetLinkUrlBtn = '[data-cy="csa_setlinkurl-label"]';
    const csaSetLinkTextBtn = '[data-cy="csa_setlinktext-label"]';

    // Link-specific style controls
    const boxShadowColorPicker = '[data-cy="boxshadow_colorpicker"]';
    const alignmentDropdown =
        '[data-cy="draggable-widget-allignment_dropdown"] > .dropdown-widget';
    const textSizeInput = '[data-cy="textsizeinput-input"]';
    const targetTypeDropdown =
        '[data-cy="draggable-widget-target_type_dropdown"] > .dropdown-widget';
    const underlineDropdown =
        '[data-cy="draggable-widget-underline_dropdown"] > .dropdown-widget';
    const linkIconInput = '[data-cy="link_icon-input"]';

    const toastSelector = '.go3958317564';

    const appUrl =
        "https://appbuilder-v3-lts-eetestsystem.tooljet.com/applications/fdf994e8-a132-4348-937b-1c9dee998c38";

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

        verifyLoadingState(wrapperSelector, {
            csa: csaLoadingToggle,
            jsSet: jsLoadingToggle,
            jsReset: jsLoadingToggle,
        });
    });

    it("should verify styles", () => {
        setup();

        verifyLinkAlignment(componentSelector, alignmentDropdown, [
            { label: "Left", expectedAlign: "flex-start" },
            { label: "Center", expectedAlign: "center" },
            { label: "Right", expectedAlign: "flex-end" },
        ]);

        verifyLinkFontSize(componentSelector, textSizeInput, [
            { input: "20", expectedSize: "20px" },
            { input: "14", expectedSize: "14px" },
            { input: "30", expectedSize: "30px" },
            { input: "16", expectedSize: "16px" },
        ]);

        verifyLinkBoxShadowColor(componentSelector, boxShadowColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
            { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
        ]);

        verifyLinkTargetType(componentSelector, targetTypeDropdown, [
            { label: "New Tab", expectedTarget: "_blank" },
            { label: "Same tab", expectedTarget: null },
        ]);

        verifyLinkUnderline(componentSelector, underlineDropdown, [
            { label: "Always", expectedClass: "underline" },
            { label: "Never", expectedClass: "no-underline" },
            { label: "On Hover", expectedClass: "on-hover" },
        ]);

        verifyLinkIcon(componentSelector, linkIconInput, "IconAdCircleFilled");
    });

    it("should verify events", () => {
        setup();

        verifyOnHover(componentSelector, toastSelector, 'Link hover alert', '.link-text');

        // Remove href to prevent navigation when CSA/JS click triggers <a>.click()
        cy.get(componentSelector).find('a').invoke('removeAttr', 'href');

        // CSA Link Click triggers the link's click action
        cy.get(csaLinkClickBtn).click();
        cy.verifyToastMessage(toastSelector, 'Link click alert');

        // JS Link Click
        cy.get(jsLinkClickBtn).click();
        cy.verifyToastMessage(toastSelector, 'Link click alert');

        // CSA set link URL and text
        verifyLinkCSASetTarget(csaSetLinkUrlBtn, componentSelector, "https://www.google.com/");

        verifyLinkCSASetText(csaSetLinkTextBtn, componentSelector, "Updated Link");

        // Verify click navigation
        cy.get(componentSelector).find('a').invoke('attr', 'href')
            .should('not.be.empty')
            .and('include', 'http')
            .then((href) => {
                cy.get(componentSelector).find('.link-text').click();
                cy.origin(new URL(href).origin, { args: { href } }, ({ href }) => {
                    cy.url().should('include', new URL(href).hostname);
                });
            });
    });
});
