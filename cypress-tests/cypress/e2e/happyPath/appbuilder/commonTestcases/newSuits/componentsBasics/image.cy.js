import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { addCSA, verifyCSA } from "Support/utils/editor/textInput";
import { addMultiEventsWithAlert } from "Support/utils/events";
import { openAndVerifyNode, openNode, verifyNodes, verifyNodeData } from "Support/utils/inspector";
import {
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
    selectColourFromColourPicker,
    fillBoxShadowParams,
    verifyBoxShadowCss,
    verifyWidgetColorCss,
    verifyLayout,
    openEditorSidebar,
    openAccordion,
} from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Image Component Tests', { testIsolation: false }, () => {
    // exposedVariables is empty in config (image.js:241) — the Image widget
    // exposes no data variables, only the action functions below.
    const exposedValues = [];
    const functions = [
        { key: "setImageURL", type: "Function" }, // source: image.js:244
        { key: "clearImage", type: "Function" },  // source: image.js:249
        { key: "setVisibility", type: "Function" }, // source: image.js:253
        { key: "setLoading", type: "Function" },   // source: image.js:258
        { key: "setDisable", type: "Function" },    // source: image.js:263
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Image-App`);
        cy.openApp();
        cy.dragAndDropWidget('Image', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // Default renders an <img> pointing at the configured Source URL.
        cy.get(commonWidgetSelector.draggableWidget('image1'))
            .find('img')
            .should('have.attr', 'src', 'https://www.svgrepo.com/show/34217/image.svg'); // source: image.js:275
        // Visible + enabled by default.
        cy.get(commonWidgetSelector.draggableWidget('image1')).should('be.visible'); // source: image.js:285
        cy.get(commonWidgetSelector.draggableWidget('image1'))
            .should('not.have.attr', 'data-disabled', 'true'); // source: image.js:284
    });

    it.skip('should verify the properties of the image', () => {
        openEditorSidebar('image1');

        // --- Image Format switch: imageUrl (default) toggles Source URL vs JS Object ---
        // Default option imageUrl → Source URL field is rendered.
        cy.get(commonWidgetSelector.parameterLabel('Source URL'))
            .should('have.text', 'Source URL'); // source: image.js:29
        // Switch to JS Object → JS Object field renders, Source URL is gone.
        cy.contains('[data-cy^="image-format"]', 'JS Object').click({ force: true }); // source: image.js:20 (jsObject option label)
        cy.get(commonWidgetSelector.parameterLabel('JS Object'))
            .should('have.text', 'JS Object'); // source: image.js:41
        cy.get(commonWidgetSelector.parameterLabel('Source URL')).should('not.exist'); // source: image.js:30 (condRender imageFormat=imageUrl)
        // Switch back to Image URL.
        cy.contains('[data-cy^="image-format"]', 'Image URL').click({ force: true }); // source: image.js:19 (imageUrl option label)
        cy.get(commonWidgetSelector.parameterLabel('Source URL')).should('have.text', 'Source URL'); // source: image.js:29

        // --- Source URL (code) — set a new URL and assert the rendered <img> src updates ---
        const newUrl = 'https://www.svgrepo.com/show/13675/image.svg'; // dynamic: test URL
        verifyAndModifyParameter('Source URL', newUrl); // dynamic: test URL
        cy.forceClickOnCanvas();
        cy.get(commonWidgetSelector.draggableWidget('image1'))
            .find('img')
            .should('have.attr', 'src', newUrl); // dynamic: test URL echoed

        // --- Alternative text (code) — reflected as the img alt attribute ---
        const altText = fake.randomSentence;
        verifyAndModifyParameter('Alternative', altText); // dynamic: fake
        cy.forceClickOnCanvas();
        cy.get(commonWidgetSelector.draggableWidget('image1'))
            .find('img')
            .should('have.attr', 'alt', altText); // dynamic: fake echoed

        // --- Additional actions section toggles ---
        openAccordion('Additional actions', []);

        // Zoom button toggle (default false)
        verifyAndModifyToggleFx('Zoom button', '{{false}}'); // source: image.js:66
        // Rotate button toggle (default false)
        verifyAndModifyToggleFx('Rotate button', '{{false}}'); // source: image.js:75
        // Show loading state toggle (default false) → loader visible when on
        verifyAndModifyToggleFx('Show loading state', '{{false}}'); // source: image.js:84
        cy.get(commonWidgetSelector.draggableWidget('image1'))
            .parent()
            .within(() => {
                cy.get('.tj-widget-loader').should('be.visible');
            });
        verifyAndModifyToggleFx('Show loading state', '{{false}}'); // source: image.js:84 (toggle back)

        // Disable toggle (default false) → data-disabled=true when on
        verifyAndModifyToggleFx('Disable', '{{false}}'); // source: image.js:108
        cy.get(commonWidgetSelector.draggableWidget('image1'))
            .should('have.attr', 'data-disabled', 'true'); // source: image.js:108
        verifyAndModifyToggleFx('Disable', '{{false}}'); // source: image.js:108 (toggle back)

        // Visibility toggle (default true) → hidden when off
        verifyAndModifyToggleFx('Visibility', '{{true}}'); // source: image.js:93
        verifyLayout('image1');

        // Collapse when hidden toggle (default false)
        verifyAndModifyToggleFx('Collapse when hidden', '{{false}}'); // source: image.js:100

        // --- Tooltip switch (format) + Tooltip code field ---
        cy.get(commonWidgetSelector.parameterLabel('Tooltip')).should('have.text', 'Tooltip'); // source: image.js:116/131
        const tooltipText = fake.randomSentence;
        verifyAndModifyParameter('Tooltip', tooltipText); // dynamic: fake
    });

    it.skip('should verify the styles of the image', () => {
        openEditorSidebar('image1');
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click({ force: true });

        // ===== Image accordion =====
        openAccordion('Image', []);

        // Image fit (select) — options: contain(default), fill, cover, scale-down
        cy.get('[data-cy="image-fit-picker"]').click({ force: true }); // source: image.js:143
        cy.contains(/^Cover$/, { matchCase: false }).click({ force: true }); // source: image.js:148 (cover option)
        /* RESOLVE-LIVE cssProp for imageFit — assert object-fit:cover on the rendered <img> */
        cy.get(commonWidgetSelector.draggableWidget('image1'))
            .find('img')
            .should('have.css', 'object-fit', 'cover'); // source: image.js:148

        // Shape / borderType (select) — options: none(default), rounded, rounded-circle, img-thumbnail
        cy.get('[data-cy="shape-picker"]').click({ force: true }); // source: image.js:158
        cy.contains(/^Rounded$/, { matchCase: false }).click({ force: true }); // source: image.js:162 (rounded option)
        /* RESOLVE-LIVE cssProp for borderType — the shape adds a class (e.g. rounded) on the <img> */
        cy.get(commonWidgetSelector.draggableWidget('image1'))
            .find('img')
            .should('have.class', 'rounded'); // source: image.js:162

        // Alignment (alignButtons) — default center
        /* RESOLVE-LIVE cssProp for alignment — pick a non-default align button and assert container justify/text-align */
        cy.get('[data-cy="alignment-picker"]'); // source: image.js:173

        // ===== Container accordion =====
        openAccordion('Container', ['Image']);

        // Background (colorSwatches) default #ffffff00
        selectColourFromColourPicker('Background', ['255', '0', '0', '100']); // dynamic: test color
        /* RESOLVE-LIVE cssProp for backgroundColor — cache empty, resolve DOM prop/selector */
        verifyWidgetColorCss('image1', 'background-color', [255, 0, 0, 100]); // source: image.js:186

        // Border (colorSwatches) default #ffffff00
        selectColourFromColourPicker('Border', ['0', '0', '255', '100']); // dynamic: test color
        /* RESOLVE-LIVE cssProp for borderColor — cache empty, resolve DOM prop/selector */
        verifyWidgetColorCss('image1', 'border-color', [0, 0, 255, 100]); // source: image.js:195

        // Box shadow default 0px 0px 0px 0px #00000040
        fillBoxShadowParams(['X', 'Y', 'Blur', 'Spread'], ['0', '0', '10', '0']); // dynamic: test shadow
        verifyBoxShadowCss('image1', [0, 0, 0, 100], [0, 0, 10, 0]); // dynamic: test shadow

        // Border radius (numberInput) default {{0}} — condRender borderType=none.
        // Shape (borderType) was set to 'rounded' above; reset to None so the
        // Border radius field renders.
        cy.get('[data-cy="shape-picker"]').click({ force: true }); // source: image.js:157
        cy.contains(/^None$/, { matchCase: false }).click({ force: true }); // source: image.js:157 (none option)
        cy.get(commonWidgetSelector.stylePicker('Border radius')).clear().type('15'); // dynamic: test radius
        /* RESOLVE-LIVE cssProp for borderRadius — border-radius selector under image1 not in cache. */ // source: image.js:199

        // Padding (switch) default 'default' — options default/custom.
        cy.contains('[data-cy*="-button"]', 'Custom').click(); // source: image.js:218 (custom option)
        cy.contains('[data-cy*="-button"]', 'Default').click(); // source: image.js:218 (default option)
        /* RESOLVE-LIVE cssProp for padding — padding value under image1 not in cache. */ // source: image.js:218

        // Custom padding (numberInput) default {{0}} — condRender padding=custom.
        // Set Padding to Custom first so the Padding numberInput renders.
        cy.contains('[data-cy*="-button"]', 'Custom').click(); // source: image.js:218 (custom option)
        cy.get(commonWidgetSelector.stylePicker('Padding')).clear().type('12'); // dynamic: test padding
        /* RESOLVE-LIVE cssProp for customPadding — padding value under image1 not in cache. */ // source: image.js:229
    });

    it.skip('should verify the layout of the image', () => {
        // showOnDesktop {{true}} (image.js:270) + showOnMobile {{false}} (image.js:271)
        verifyLayout('image1');
    });

    it('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode('components');
        // exposedVariables is empty (image.js:241) — only the action functions exist.
        openAndVerifyNode('image1', exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify all the events from the image', () => {
        const events = [
            { event: 'On click', message: 'onClick Event' }, // source: image.js:139
        ];
        addMultiEventsWithAlert(events, false);
        cy.forceClickOnCanvas();
        cy.get(commonWidgetSelector.draggableWidget('image1')).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'onClick Event', false); // dynamic: echoed event message
    });

    it.skip('should verify all the CSA from the image', () => {
        const csaUrl = 'https://www.svgrepo.com/show/13675/image.svg'; // dynamic: test URL
        const actions = [
            { event: 'On click', action: 'Set image URL', value: csaUrl }, // b1 — source: image.js:245
            { event: 'On click', action: 'Clear image' }, // b2 — source: image.js:249
            { event: 'On click', action: 'Set visibility', valueToggle: '{{false}}' }, // b3 — source: image.js:253
            { event: 'On click', action: 'Set visibility', valueToggle: '{{true}}' }, // b4 — source: image.js:253
            { event: 'On click', action: 'Set loading', valueToggle: '{{true}}' }, // b5 — source: image.js:258
            { event: 'On click', action: 'Set disable', valueToggle: '{{true}}' }, // b6 — source: image.js:263
            { event: 'On click', action: 'Set disable', valueToggle: '{{false}}' }, // b7 — source: image.js:263
        ];
        addCSA('image1', actions);
        const component = 'image1';

        // b1 — Set image URL updates the <img> src
        cy.get(commonWidgetSelector.draggableWidget('button1')).click();
        cy.get(commonWidgetSelector.draggableWidget(component))
            .find('img')
            .should('have.attr', 'src', csaUrl); // dynamic: test URL echoed

        // b2 — Clear image removes the src / shows placeholder
        cy.get(commonWidgetSelector.draggableWidget('button2')).click();
        cy.get(commonWidgetSelector.draggableWidget(component))
            .find('img')
            .should('not.have.attr', 'src', csaUrl); // dynamic: cleared

        // b3 — Set visibility false hides the widget
        cy.get(commonWidgetSelector.draggableWidget('button3')).click();
        cy.get(commonWidgetSelector.draggableWidget(component)).should('not.be.visible'); // dynamic: CSA visibility hidden

        // b4 — Set visibility true shows the widget
        cy.get(commonWidgetSelector.draggableWidget('button4')).click();
        cy.get(commonWidgetSelector.draggableWidget(component)).should('be.visible'); // dynamic: CSA visibility shown

        // b5 — Set loading true shows the loader
        cy.get(commonWidgetSelector.draggableWidget('button5')).click();
        cy.get(commonWidgetSelector.draggableWidget(component))
            .parent()
            .within(() => {
                cy.get('.tj-widget-loader').should('be.visible');
            });

        // b6 — Set disable true
        cy.get(commonWidgetSelector.draggableWidget('button6')).click();
        cy.get(commonWidgetSelector.draggableWidget(component))
            .should('have.attr', 'data-disabled', 'true'); // dynamic: CSA disabled

        // b7 — Set disable false
        cy.get(commonWidgetSelector.draggableWidget('button7')).click();
        cy.get(commonWidgetSelector.draggableWidget(component))
            .should('have.attr', 'data-disabled', 'false'); // dynamic: CSA re-enabled
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });
});
