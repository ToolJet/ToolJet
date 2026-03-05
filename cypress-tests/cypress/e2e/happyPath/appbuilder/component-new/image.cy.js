import {
    genralProperties,
    verifyExistance,
    verifyImageFeature
} from "Support/utils/appBuilder/featuresValidation";

describe("Image Component - Feature Validation", { baseUrl: null }, () => {
    const componentSelector = '[data-cy="draggable-widget-image1"]';
    const desktopToggle = '[data-cy="toggleswitch1"] .d-flex';
    const zoomToggle = '[data-cy="zoombutton"] input[type="checkbox"]';
    const rotateToggle = '[data-cy="rotatebutton"] input[type="checkbox"]';
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

    const imageFeatures = [
        {
            toggleSelector: zoomToggle,
            action: { target: '.react-transform-component', dblclick: true },
            assertion: {
                target: '.react-transform-component',
                style: 'scale',
            },
            resetAfter: true,
        },
        {
            toggleSelector: rotateToggle,
            action: { preClick: true, hover: true, target: '.img-control-btn' },
            assertion: {
                target: 'img',
                style: 'rotate',
            },
            resetAfter: true,
        },
    ];

    beforeEach(() => {
        cy.visit(appUrl);
        cy.viewport(1800, 1400);
    });

    it("should verify image component properties", () => {
        verifyExistance(componentSelector, "not.exist");
        properties.forEach(({ controllerSelector, state, className }) => {
            genralProperties(componentSelector, controllerSelector, state, className);
        });

        genralProperties(componentSelector, loadingState, "exist");
        genralProperties(componentSelector, disableToggle, "exist");

        imageFeatures.forEach((feature) => {
            verifyImageFeature(componentSelector, feature);
        });
    });


});
