/**
 * SPEC — Color Picker — contexts facet.
 * FOR AI: always-on device + exposed-value contexts. No ColorPicker browser scenario maps here
 * (BRW-001 slider drags → userflow.cy.js).
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { colorPickerText } from "Texts/appBuilder/components/colorPicker";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Color Picker — contexts facet', { testIsolation: false }, () => {
    const W = colorPickerText.defaultWidgetName;
    const C = colorPickerText.defaultColor;

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-ColorPicker-contexts-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(colorPickerText.displayName, 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // Device-visibility context matrix: Show on Desktop / Show on Mobile.
    it('device context — show on desktop / mobile toggles visibility', () => {
        verifyLayout(W);
    });

    // Exposed-value context: the default colour is observable in the app's component tree.
    // getExposedColorState (ColorPicker/utils.js:9-24) of defaultColor #4368E3 (colorPicker.js:299), showAlpha off.
    it('exposed-value context — selected colour observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'selectedColorHex', type: 'String', value: `"${C.hex}"` },
            { key: 'selectedColorRGB', type: 'String', value: `"${C.rgb}"` },
            { key: 'selectedColorRGBA', type: 'String', value: `"${C.rgba}"` },
            { key: 'colorFormat', type: 'String', value: `"${colorPickerText.defaultFormat}"` },
        ], verifyNodeData);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});
