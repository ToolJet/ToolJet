/**
 * SPEC — JSON Explorer — contexts facet.
 * FOR AI: always-on device + exposed-value contexts (no TESTING.md browser scenario maps here — the widget's theme
 * scenario JSONExplorer-BRW-003 lives in styles.cy.js because it is about the painted palette over the Background
 * style). Device gating: others.showOnDesktop / showOnMobile (jsonExplorer.js:10-13, defaults :186-187).
 * Exposed state flags: jsonExplorer.js:158-160, published on mount (JSONExplorer.jsx:127-152).
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, openNode, openAndVerifyNode,
 * verifyNodeData, explorerMetrics.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { jsonExplorerText } from "Texts/appBuilder/components/jsonExplorer";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { explorerMetrics } from "Support/utils/appBuilder/components/jsonExplorer";

const T = jsonExplorerText;
const W = T.defaultWidgetName;

const expectDefaultTree = () =>
    explorerMetrics(W, (m) => {
        expect(m.labels[0]).to.eq(T.defaultRootLabel); // source: jsonExplorer.js:195
        expect(m.text).to.contain(T.defaultFirstValue); // source: jsonExplorer.js:191
    });

describe('JSON Explorer — contexts facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-JSONExplorer-contexts-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('device context — Show on desktop / Show on mobile gate the widget on the matching editor layout', () => {
        const widget = commonWidgetSelector.draggableWidget(W);

        // defaults (jsonExplorer.js:186-187): on the desktop canvas, absent from the mobile canvas
        expectDefaultTree();
        switchLayout('mobile');
        cy.get(widget).should('not.exist');
        switchLayout('desktop');
        cy.get(widget).should('exist');

        // desktop off → gone from desktop; mobile on → shown on the mobile canvas only
        openEditorSidebar(W);
        openAccordion(commonWidgetText.accordionLayout);
        verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
        cy.get(widget).should('not.exist');
        verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
        cy.waitForAutoSave();
        switchLayout('mobile');
        cy.get(widget).should('be.visible');
        expectDefaultTree();
        switchLayout('desktop');
        cy.get(widget).should('not.exist');
    });

    it('exposed-value context — state flags observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'isVisible', type: 'Boolean', value: 'true' }, // jsonExplorer.js:158
            { key: 'isLoading', type: 'Boolean', value: 'false' }, // jsonExplorer.js:159
            { key: 'isDisabled', type: 'Boolean', value: 'false' }, // jsonExplorer.js:160
        ], verifyNodeData);
    });
});
