import {
    genralProperties,
    verifyDisability,
    verifyLoadingState,
    verifyVisibility,
    verifyOnHover,
} from "Support/utils/appBuilder/components/properties/common";
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
    const componentSelector = '[data-cy="link"]';
    const wrapperSelector = '[data-cy="draggable-widget-link"]';
    const desktopToggle = '[data-cy="desktoptoggle"] .d-flex';
    const visibilityToggle = '[data-cy="visibilitytoggle"] .d-flex';

    // JS action toggles (single toggle for set/reset)
    const jsVisibilityToggle = '[data-cy="jsvisibilitytoggle"] .d-flex';
    const jsLoadingToggle = '[data-cy="jsloadingtoggle"] .d-flex';
    const jsDisableToggle = '[data-cy="jsdisabletoggle"] .d-flex';
    const jsLinkClickBtn = '[data-cy="js_link_click-label"]';

    // CSA toggles
    const csaVisibilityToggle = '[data-cy="csavisibility"] .d-flex';
    const csaLoadingToggle = '[data-cy="csaloading"] .d-flex';
    const csaDisableToggle = '[data-cy="csadisable"] .d-flex';
    const csaLinkClickBtn = '[data-cy="setimage-label"]';
    const csaSetLinkUrlBtn = '[data-cy="csa_setlinkurl-label"]';
    const csaSetLinkTextBtn = '[data-cy="csa_setlinktext-label"]';

    // Link-specific controls
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

    it("should verify visibility state", () => {
        genralProperties(componentSelector, desktopToggle, { state: "exist" });

        verifyVisibility(componentSelector, {
            toggle: visibilityToggle,
            csa: csaVisibilityToggle,
            jsSet: jsVisibilityToggle,
            jsReset: jsVisibilityToggle,
        });
    });

    it("should verify loading state", () => {
        setup();

        verifyLoadingState(wrapperSelector, {
            csa: csaLoadingToggle,
            jsSet: jsLoadingToggle,
            jsReset: jsLoadingToggle,
        });
    });

    it("should verify link alignment options", () => {
        setup();

        verifyLinkAlignment(componentSelector, alignmentDropdown, [
            { label: "Left", expectedAlign: "flex-start" },
            { label: "Center", expectedAlign: "center" },
            { label: "Right", expectedAlign: "flex-end" },
        ]);
    });

    it("should verify link font size", () => {
        setup();

        verifyLinkFontSize(componentSelector, textSizeInput, [
            { input: "20", expectedSize: "20px" },
            { input: "14", expectedSize: "14px" },
            { input: "30", expectedSize: "30px" },
            { input: "16", expectedSize: "16px" },
        ]);
    });

    it("should verify box shadow color via color picker", () => {
        setup();

        verifyLinkBoxShadowColor(componentSelector, boxShadowColorPicker, [
            { hex: "ff0000", expectedColor: "rgb(255, 0, 0)" },
            { hex: "00ff00", expectedColor: "rgb(0, 255, 0)" },
            { hex: "0000ff", expectedColor: "rgb(0, 0, 255)" },
            { hex: "000000", expectedColor: "rgb(0, 0, 0)" },
        ]);
    });

    it("should verify target type changes", () => {
        setup();

        verifyLinkTargetType(componentSelector, targetTypeDropdown, [
            { label: "New Tab", expectedTarget: "_blank" },
            { label: "Same tab", expectedTarget: null },
        ]);
    });

    it("should verify underline dropdown options", () => {
        setup();

        verifyLinkUnderline(componentSelector, underlineDropdown, [
            { label: "Always", expectedClass: "underline" },
            { label: "Never", expectedClass: "no-underline" },
            { label: "On Hover", expectedClass: "on-hover" },
        ]);
    });

    it("should verify link icon visibility and css", () => {
        setup();

        verifyLinkIcon(componentSelector, linkIconInput, "IconAdCircleFilled");
    });

    it("should verify events on link click and action triggers using CSA and JS", () => {
        setup();

        // Remove href to prevent navigation when CSA/JS click triggers <a>.click()
        cy.get(componentSelector).find('a').invoke('removeAttr', 'href');

        // CSA Link Click triggers the link's click action
        cy.get(csaLinkClickBtn).click();
        cy.verifyToastMessage(toastSelector, 'Link click alert');

        // JS Link Click
        cy.get(jsLinkClickBtn).click();
        cy.verifyToastMessage(toastSelector, 'Link click alert');
    });

    it("should verify hover toast and click navigation on link", () => {
        setup();

        verifyOnHover(componentSelector, toastSelector, 'Link hover alert', '.link-text');

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

    it("should verify CSA set link URL and set link text", () => {
        setup();

        verifyLinkCSASetTarget(csaSetLinkUrlBtn, componentSelector, "https://www.google.com/");

        verifyLinkCSASetText(csaSetLinkTextBtn, componentSelector, "Updated Link");
    });
});
