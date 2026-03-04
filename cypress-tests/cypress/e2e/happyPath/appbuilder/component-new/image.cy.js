import {
    genralProperties,
    verifyExistance
} from "Support/utils/appBuilder/featuresValidation";

describe("Image Component - Feature Validation", { baseUrl: null }, () => {
    const componentSelector = '[data-cy="draggable-widget-image1"]';
    const desktopToggle = '[data-cy="toggleswitch1"] .d-flex';
    const visibilityToggle = '[data-cy="toggleswitch3"] .d-flex';
    const disableToggle = '[data-cy="toggleswitch4"] .d-flex';
    const loadingState = '[data-cy="toggleswitch5"] .d-flex';

    const appUrl =
        "https://appbuilder-v3-lts-eetestsystem.tooljet.com/applications/0196abdc-e11e-4333-b79e-92a57c3dd39d";


    const properties = [
        { controllerSelector: desktopToggle, state: "exist" },
        { controllerSelector: visibilityToggle, state: "be.visible" },
        { controllerSelector: loadingState, state: "exist", className: "tj-widget-loader" },
        { controllerSelector: disableToggle, state: "exist" },
    ];

    beforeEach(() => {
        cy.visit(appUrl);
        cy.viewport(1600, 1200);
    });

    it("should verify image component properties", () => {
        verifyExistance(componentSelector, "not.exist");
        properties.forEach(({ controllerSelector, state, className }) => {
            genralProperties(componentSelector, controllerSelector, state, className);
        });
    });

});
