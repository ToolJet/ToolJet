/**
 * SPEC — File Input — contexts facet.
 * FOR AI: always-on device + exposed-value contexts. File Input has no context scenario in TESTING.md
 * (frontend/ee/test/app-builder/widgets/FileInput); its only browser scenario (FileInput-BRW-001) is in userflow.cy.js.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, openNode, openAndVerifyNode,
 * verifyNodeData, interceptFileChooser.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { fileInputSelector as SEL } from "Selectors/appBuilder/components/fileInput";
import { fileInputText } from "Texts/appBuilder/components/fileInput";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { interceptFileChooser } from "Support/utils/appBuilder/components/fileInput";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = fileInputText;
const W = T.defaultWidgetName;

describe('File Input — contexts facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-FileInput-contexts-${Cypress._.uniqueId()}`);
        interceptFileChooser();
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        closeQueryPanel();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('device context — Show on desktop / Show on mobile gate the widget on the matching editor layout', () => {
        const widget = commonWidgetSelector.draggableWidget(W);

        // defaults (fileinput.js:487-488): on the desktop canvas, absent from the mobile canvas
        cy.get(SEL.button(W)).should('contain.text', T.browseText);
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
        cy.get(SEL.summary(W)).should('have.text', T.defaultPlaceholder); // fileinput.js:492
        switchLayout('desktop');
        cy.get(widget).should('not.exist');
    });

    it('exposed-value context — initial state observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'files', type: 'Array', value: '[0]' }, // fileinput.js:425
            { key: 'isParsing', type: 'Boolean', value: 'false' }, // fileinput.js:427
            { key: 'isValid', type: 'Boolean', value: 'true' }, // fileinput.js:428
            { key: 'fileSize', type: 'Number', value: '0' }, // fileinput.js:429
            { key: 'isMandatory', type: 'Boolean', value: 'false' }, // fileinput.js:430
            { key: 'isLoading', type: 'Boolean', value: 'false' }, // fileinput.js:431
            { key: 'isVisible', type: 'Boolean', value: 'true' }, // fileinput.js:432
            { key: 'isDisabled', type: 'Boolean', value: 'false' }, // fileinput.js:433
        ], verifyNodeData);
    });
});
