/**
 * SPEC — Audio Recorder — contexts facet.
 * FOR AI: always-on device + exposed-value contexts. Audio Recorder has no context scenario in TESTING.md
 * (frontend/ee/test/app-builder/widgets/AudioRecorder); its browser scenarios (AudioRecorder-BRW-001..004) are in
 * userflow.cy.js.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, openNode, openAndVerifyNode,
 * verifyNodeData, installFakeMic.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { audioRecorderSelector as SEL } from "Selectors/appBuilder/components/audioRecorder";
import { audioRecorderText } from "Texts/appBuilder/components/audioRecorder";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { installFakeMic } from "Support/utils/appBuilder/components/mediaCommon";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = audioRecorderText;
const W = T.defaultWidgetName;

describe('Audio Recorder — contexts facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-AudioRecorder-contexts-${Cypress._.uniqueId()}`);
        cy.openApp();
        installFakeMic();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        closeQueryPanel();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('device context — Show on desktop / Show on mobile gate the widget on the matching editor layout', () => {
        const widget = commonWidgetSelector.draggableWidget(W);

        // defaults (audioRecorder.js:156-157): on the desktop canvas, absent from the mobile canvas
        cy.get(SEL.label(W)).should('have.text', T.defaultLabel);
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
        cy.get(SEL.label(W)).should('have.text', T.defaultLabel); // audioRecorder.js:160
        switchLayout('desktop');
        cy.get(widget).should('not.exist');
    });

    it('exposed-value context — initial state observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'isVisible', type: 'Boolean', value: 'true' }, // audioRecorder.js:128
            { key: 'isDisabled', type: 'Boolean', value: 'false' }, // audioRecorder.js:129
            { key: 'isLoading', type: 'Boolean', value: 'false' }, // audioRecorder.js:130
            { key: 'dataURL', type: 'Null', value: 'null' }, // audioRecorder.js:131
        ], verifyNodeData);
    });
});
