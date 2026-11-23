/**
 * SPEC — Tags — contexts facet.
 * FOR AI: always-on device + exposed-value contexts (no Tags browser scenario maps to contexts:
 * Tags-BRW-001 → canvas/styles, Tags-BRW-002 → inspector).
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData, expectBadgeTitles.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { tagsText } from "Texts/appBuilder/components/tags";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { expectBadgeTitles } from "Support/utils/appBuilder/components/tags";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = tagsText.defaultWidgetName;
const T = tagsText;

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Tags — contexts facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Tags-contexts-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        closeQueryPanel();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('device context — show on desktop / mobile toggles visibility', () => {
        expectBadgeTitles(W, T.defaultTitles); // source: tags.js:189,197,205,213
        verifyLayout(W);
    });

    it('exposed-value context — tags and state flags observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        // exposedVariables is registered empty (tags.js:157); the runtime publishes these (Tags.jsx:133-156)
        openAndVerifyNode(W, [
            { key: 'tags', type: 'Array', value: `[${T.defaultTitles.length}]` }, // tags.js:186-220
            { key: 'isVisible', type: 'Boolean', value: 'true' }, // tags.js:223
            { key: 'isLoading', type: 'Boolean', value: 'false' }, // tags.js:226
            { key: 'isDisabled', type: 'Boolean', value: 'false' }, // tags.js:225
        ], verifyNodeData);
    });
});
